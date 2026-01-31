import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Badge } from '../components/UI';
import { Settings, Save, RotateCcw, Bot } from 'lucide-react';
import { LLM_PROVIDERS, DEFAULT_LLM_SETTINGS, validateLLMSettings } from '../services/llmService';
import './SettingsView.css';

export default function SettingsView() {
    const { managerMode, probabilityWeights, setProbabilityWeights, llmSettings, setLLMSettings } = useApp();
    const [weights, setWeights] = useState(probabilityWeights);
    const [llm, setLLM] = useState(llmSettings || DEFAULT_LLM_SETTINGS);
    const [saved, setSaved] = useState(false);
    const [llmSaved, setLLMSaved] = useState(false);

    useEffect(() => {
        setWeights(probabilityWeights);
    }, [probabilityWeights]);

    useEffect(() => {
        setLLM(llmSettings || DEFAULT_LLM_SETTINGS);
    }, [llmSettings]);

    if (!managerMode) {
        return (
            <div className="settings-view">
                <div className="settings-view__restricted">
                    <Settings size={48} />
                    <h2>アクセス制限</h2>
                    <p>設定画面はマネージャーモードでのみ利用可能です。</p>
                </div>
            </div>
        );
    }

    const handleWeightChange = (level, value) => {
        const numValue = Math.max(0, Math.min(100, parseInt(value) || 0));
        setWeights(prev => ({ ...prev, [level]: numValue }));
        setSaved(false);
    };

    const handleSaveWeights = () => {
        setProbabilityWeights(weights);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleResetWeights = () => {
        const defaultWeights = { high: 80, medium: 50, low: 20, uncertain: 10 };
        setWeights(defaultWeights);
        setProbabilityWeights(defaultWeights);
    };

    const handleLLMChange = (field, value) => {
        setLLM(prev => ({ ...prev, [field]: value }));
        setLLMSaved(false);
    };

    const handleSaveLLM = () => {
        const errors = validateLLMSettings(llm);
        if (errors.length > 0) {
            alert(errors.join('\n'));
            return;
        }
        setLLMSettings(llm);
        setLLMSaved(true);
        setTimeout(() => setLLMSaved(false), 2000);
    };

    const handleResetLLM = () => {
        setLLM(DEFAULT_LLM_SETTINGS);
        setLLMSettings(DEFAULT_LLM_SETTINGS);
    };

    const probabilityLevels = [
        { key: 'high', label: '高確度', color: 'var(--color-accent-green)' },
        { key: 'medium', label: '中確度', color: 'var(--color-accent-yellow)' },
        { key: 'low', label: '低確度', color: 'var(--color-accent-red)' },
    ];

    return (
        <div className="settings-view">
            <header className="settings-view__header">
                <h2 className="settings-view__title">
                    <Settings size={24} />
                    設定
                </h2>
            </header>

            {/* Probability Weights Section */}
            <Card className="settings-view__card">
                <CardHeader>
                    <CardTitle>確度別重み設定</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="settings-view__description">
                        売上予測の計算に使用する確度別の重み（%）を設定します。
                        加重予測 = 予算 × 重み で計算されます。
                    </p>

                    <div className="settings-view__weights">
                        {probabilityLevels.map(({ key, label, color }) => (
                            <div key={key} className="settings-view__weight-item">
                                <div className="settings-view__weight-header">
                                    <Badge
                                        variant={key === 'high' ? 'success' : key === 'medium' ? 'warning' : 'danger'}
                                    >
                                        {label}
                                    </Badge>
                                    <span className="settings-view__weight-value">
                                        {weights[key]}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    step="5"
                                    value={weights[key]}
                                    onChange={(e) => handleWeightChange(key, e.target.value)}
                                    className="settings-view__slider"
                                    style={{ '--slider-color': color }}
                                />
                                <div className="settings-view__weight-labels">
                                    <span>0%</span>
                                    <span>50%</span>
                                    <span>100%</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="settings-view__preview">
                        <h4>プレビュー例（予算1,000万円の場合）</h4>
                        <div className="settings-view__preview-items">
                            {probabilityLevels.map(({ key, label }) => (
                                <div key={key} className="settings-view__preview-item">
                                    <span>{label}:</span>
                                    <span>¥{((10000000 * weights[key]) / 100 / 10000).toLocaleString()}万</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="settings-view__actions">
                        <button
                            className="settings-view__btn settings-view__btn--secondary"
                            onClick={handleResetWeights}
                        >
                            <RotateCcw size={16} />
                            デフォルトに戻す
                        </button>
                        <button
                            className={`settings-view__btn settings-view__btn--primary ${saved ? 'settings-view__btn--saved' : ''}`}
                            onClick={handleSaveWeights}
                        >
                            <Save size={16} />
                            {saved ? '保存しました' : '保存'}
                        </button>
                    </div>
                </CardContent>
            </Card>

            {/* LLM API Settings Section */}
            <Card className="settings-view__card">
                <CardHeader>
                    <CardTitle>
                        <Bot size={20} />
                        LLM API設定
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="settings-view__description">
                        AIアドバイス機能で使用するLLM APIを設定します。
                    </p>

                    <div className="settings-view__form">
                        <div className="settings-view__field">
                            <label>プロバイダー</label>
                            <select
                                value={llm.provider}
                                onChange={(e) => handleLLMChange('provider', e.target.value)}
                            >
                                <option value={LLM_PROVIDERS.OPENAI}>OpenAI API互換</option>
                                <option value={LLM_PROVIDERS.AZURE}>Azure OpenAI</option>
                                <option value={LLM_PROVIDERS.VERTEX}>Google AI (Gemini)</option>
                            </select>
                        </div>

                        <div className="settings-view__field">
                            <label>APIキー</label>
                            <input
                                type="password"
                                value={llm.apiKey}
                                onChange={(e) => handleLLMChange('apiKey', e.target.value)}
                                placeholder="sk-... または API Key"
                            />
                        </div>

                        {llm.provider === LLM_PROVIDERS.OPENAI && (
                            <>
                                <div className="settings-view__field">
                                    <label>エンドポイント（任意）</label>
                                    <input
                                        type="text"
                                        value={llm.endpoint}
                                        onChange={(e) => handleLLMChange('endpoint', e.target.value)}
                                        placeholder="https://api.openai.com/v1"
                                    />
                                    <span className="settings-view__hint">
                                        空白の場合はOpenAI公式APIを使用
                                    </span>
                                </div>
                                <div className="settings-view__field">
                                    <label>モデル</label>
                                    <input
                                        type="text"
                                        value={llm.model}
                                        onChange={(e) => handleLLMChange('model', e.target.value)}
                                        placeholder="gpt-4o-mini"
                                    />
                                </div>
                            </>
                        )}

                        {llm.provider === LLM_PROVIDERS.AZURE && (
                            <>
                                <div className="settings-view__field">
                                    <label>エンドポイント</label>
                                    <input
                                        type="text"
                                        value={llm.endpoint}
                                        onChange={(e) => handleLLMChange('endpoint', e.target.value)}
                                        placeholder="https://your-resource.openai.azure.com"
                                    />
                                </div>
                                <div className="settings-view__field">
                                    <label>デプロイメント名</label>
                                    <input
                                        type="text"
                                        value={llm.azureDeployment}
                                        onChange={(e) => handleLLMChange('azureDeployment', e.target.value)}
                                        placeholder="gpt-4o-mini"
                                    />
                                </div>
                                <div className="settings-view__field">
                                    <label>APIバージョン</label>
                                    <input
                                        type="text"
                                        value={llm.azureApiVersion}
                                        onChange={(e) => handleLLMChange('azureApiVersion', e.target.value)}
                                        placeholder="2024-02-01"
                                    />
                                </div>
                            </>
                        )}

                        {llm.provider === LLM_PROVIDERS.VERTEX && (
                            <>
                                <div className="settings-view__field">
                                    <label>サービスアカウントJSON</label>
                                    <div className="settings-view__file-upload">
                                        <input
                                            type="file"
                                            accept=".json"
                                            id="service-account-json"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = (evt) => {
                                                        handleLLMChange('vertexServiceAccountJson', evt.target.result);
                                                    };
                                                    reader.readAsText(file);
                                                }
                                            }}
                                        />
                                        <label htmlFor="service-account-json" className="settings-view__file-label">
                                            {llm.vertexServiceAccountJson ? '✓ JSONファイル読み込み済み' : 'JSONファイルを選択...'}
                                        </label>
                                    </div>
                                    <span className="settings-view__hint">
                                        GCPコンソールからダウンロードしたサービスアカウントキーのJSONファイル
                                    </span>
                                    {llm.vertexServiceAccountJson && (() => {
                                        try {
                                            const sa = JSON.parse(llm.vertexServiceAccountJson);
                                            return (
                                                <div className="settings-view__json-info">
                                                    <div>プロジェクト: {sa.project_id}</div>
                                                    <div>サービスアカウント: {sa.client_email}</div>
                                                </div>
                                            );
                                        } catch {
                                            return <span className="settings-view__error">JSONの形式が不正です</span>;
                                        }
                                    })()}
                                </div>
                                <div className="settings-view__field">
                                    <label>リージョン</label>
                                    <select
                                        value={llm.vertexRegion}
                                        onChange={(e) => handleLLMChange('vertexRegion', e.target.value)}
                                    >
                                        <option value="us-central1">us-central1</option>
                                        <option value="asia-northeast1">asia-northeast1 (東京)</option>
                                        <option value="asia-southeast1">asia-southeast1</option>
                                        <option value="europe-west1">europe-west1</option>
                                    </select>
                                </div>
                                <div className="settings-view__field">
                                    <label>モデル</label>
                                    <input
                                        type="text"
                                        value={llm.model}
                                        onChange={(e) => handleLLMChange('model', e.target.value)}
                                        placeholder="gemini-1.5-flash-001"
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <div className="settings-view__actions">
                        <button
                            className="settings-view__btn settings-view__btn--secondary"
                            onClick={handleResetLLM}
                        >
                            <RotateCcw size={16} />
                            リセット
                        </button>
                        <button
                            className={`settings-view__btn settings-view__btn--primary ${llmSaved ? 'settings-view__btn--saved' : ''}`}
                            onClick={handleSaveLLM}
                        >
                            <Save size={16} />
                            {llmSaved ? '保存しました' : '保存'}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
