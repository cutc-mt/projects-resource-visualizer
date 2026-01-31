/**
 * LLM Service - Multi-provider LLM API client
 * Supports: OpenAI API Compatible, Azure OpenAI, Vertex AI (Service Account)
 */

// Provider types
export const LLM_PROVIDERS = {
    OPENAI: 'openai',
    AZURE: 'azure',
    VERTEX: 'vertex',
};

// Default settings
export const DEFAULT_LLM_SETTINGS = {
    provider: LLM_PROVIDERS.OPENAI,
    apiKey: '',
    endpoint: '',
    model: 'gpt-4o-mini',
    // Azure specific
    azureDeployment: '',
    azureApiVersion: '2024-02-01',
    // Vertex specific
    vertexServiceAccountJson: '', // JSON string of service account
    vertexRegion: 'us-central1',
};

/**
 * Base64 URL encode (for JWT)
 */
function base64UrlEncode(str) {
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Convert ArrayBuffer to Base64 URL
 */
function arrayBufferToBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return base64UrlEncode(binary);
}

/**
 * Parse PEM private key to CryptoKey
 */
async function importPrivateKey(pemKey) {
    // Remove PEM headers and decode
    const pemContents = pemKey
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\s/g, '');

    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    return await crypto.subtle.importKey(
        'pkcs8',
        binaryDer,
        {
            name: 'RSASSA-PKCS1-v1_5',
            hash: 'SHA-256',
        },
        false,
        ['sign']
    );
}

/**
 * Create signed JWT for Google OAuth
 */
async function createSignedJwt(serviceAccount) {
    const now = Math.floor(Date.now() / 1000);

    const header = {
        alg: 'RS256',
        typ: 'JWT',
    };

    const payload = {
        iss: serviceAccount.client_email,
        sub: serviceAccount.client_email,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
        scope: 'https://www.googleapis.com/auth/cloud-platform',
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signInput = `${encodedHeader}.${encodedPayload}`;

    const privateKey = await importPrivateKey(serviceAccount.private_key);
    const signature = await crypto.subtle.sign(
        'RSASSA-PKCS1-v1_5',
        privateKey,
        new TextEncoder().encode(signInput)
    );

    const encodedSignature = arrayBufferToBase64Url(signature);
    return `${signInput}.${encodedSignature}`;
}

/**
 * Get access token from Google OAuth using service account
 */
async function getGoogleAccessToken(serviceAccount) {
    const jwt = await createSignedJwt(serviceAccount);

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: jwt,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error_description || 'Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Generate a prompt for project advice
 */
function generatePrompt(project) {
    const isLead = project.status === 'lead';
    const projectType = isLead ? 'プレ活動（営業案件）' : '受注プロジェクト';

    const risksSection = project.risks?.length > 0
        ? `リスク:\n${project.risks.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
        : 'リスク: 特になし';

    const issuesSection = project.issues?.length > 0
        ? `課題:\n${project.issues.map((r, i) => `${i + 1}. ${r}`).join('\n')}`
        : '';

    const prompt = `あなたはプロジェクト管理の専門家です。以下の${projectType}について、リスクと課題を分析し、具体的なアドバイスを提供してください。

## 案件情報
- 案件名: ${project.name}
- クライアント: ${project.clientName}
- 予算: ¥${project.estimatedBudget?.toLocaleString() || '未定'}
- 期間: ${project.startDate} 〜 ${project.endDate}
${isLead ? `- 確度: ${project.probability || '未設定'}` : ''}

## 概要
${project.description || '(記載なし)'}

${isLead && project.needs ? `## 顧客ニーズ\n${project.needs}` : ''}

${risksSection}

${issuesSection}

---

上記の情報に基づいて、以下の観点からアドバイスをお願いします：
1. 主要なリスクへの対策
2. 課題解決のアプローチ
3. プロジェクト成功のための推奨事項

回答は日本語で、簡潔かつ実用的にお願いします。`;

    return prompt;
}

/**
 * Call OpenAI-compatible API
 */
async function callOpenAI(prompt, settings) {
    const endpoint = settings.endpoint || 'https://api.openai.com/v1';
    const url = `${endpoint}/chat/completions`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`,
        },
        body: JSON.stringify({
            model: settings.model || 'gpt-4o-mini',
            messages: [
                { role: 'user', content: prompt }
            ],
            max_tokens: 1500,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response';
}

/**
 * Call Azure OpenAI API
 */
async function callAzureOpenAI(prompt, settings) {
    if (!settings.endpoint || !settings.azureDeployment) {
        throw new Error('Azure OpenAI requires endpoint and deployment name');
    }

    const url = `${settings.endpoint}/openai/deployments/${settings.azureDeployment}/chat/completions?api-version=${settings.azureApiVersion}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'api-key': settings.apiKey,
        },
        body: JSON.stringify({
            messages: [
                { role: 'user', content: prompt }
            ],
            max_tokens: 1500,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Azure API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response';
}

/**
 * Call Vertex AI API (Gemini) with Service Account
 */
async function callVertexAI(prompt, settings) {
    if (!settings.vertexServiceAccountJson) {
        throw new Error('Vertex AI requires service account JSON');
    }

    let serviceAccount;
    try {
        serviceAccount = JSON.parse(settings.vertexServiceAccountJson);
    } catch {
        throw new Error('Invalid service account JSON format');
    }

    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
        throw new Error('Service account JSON is missing required fields');
    }

    // Get access token
    const accessToken = await getGoogleAccessToken(serviceAccount);

    const region = settings.vertexRegion || 'us-central1';
    const model = settings.model || 'gemini-1.5-flash-001';
    const projectId = serviceAccount.project_id;

    const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                maxOutputTokens: 1500,
                temperature: 0.7,
            }
        }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.error?.message || `Vertex AI error: ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
}

/**
 * Get AI advice for a project
 * @param {Object} project - Project data
 * @param {Object} settings - LLM settings
 * @returns {Promise<string>} - AI advice text
 */
export async function getAIAdvice(project, settings) {
    if (settings.provider === LLM_PROVIDERS.VERTEX) {
        if (!settings.vertexServiceAccountJson) {
            throw new Error('サービスアカウントJSONが設定されていません。設定画面からアップロードしてください。');
        }
    } else if (!settings?.apiKey) {
        throw new Error('APIキーが設定されていません。設定画面からLLM APIを設定してください。');
    }

    const prompt = generatePrompt(project);

    switch (settings.provider) {
        case LLM_PROVIDERS.OPENAI:
            return callOpenAI(prompt, settings);
        case LLM_PROVIDERS.AZURE:
            return callAzureOpenAI(prompt, settings);
        case LLM_PROVIDERS.VERTEX:
            return callVertexAI(prompt, settings);
        default:
            throw new Error(`Unknown provider: ${settings.provider}`);
    }
}

/**
 * Validate LLM settings
 */
export function validateLLMSettings(settings) {
    const errors = [];

    if (settings.provider === LLM_PROVIDERS.VERTEX) {
        if (!settings.vertexServiceAccountJson) {
            errors.push('Vertex AI: サービスアカウントJSONは必須です');
        } else {
            try {
                const sa = JSON.parse(settings.vertexServiceAccountJson);
                if (!sa.project_id) errors.push('Vertex AI: project_idが見つかりません');
                if (!sa.private_key) errors.push('Vertex AI: private_keyが見つかりません');
                if (!sa.client_email) errors.push('Vertex AI: client_emailが見つかりません');
            } catch {
                errors.push('Vertex AI: JSONの形式が不正です');
            }
        }
    } else {
        if (!settings.apiKey) {
            errors.push('APIキーは必須です');
        }
    }

    if (settings.provider === LLM_PROVIDERS.AZURE) {
        if (!settings.endpoint) errors.push('Azure: エンドポイントは必須です');
        if (!settings.azureDeployment) errors.push('Azure: デプロイメント名は必須です');
    }

    return errors;
}
