import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import Modal from './Modal';
import Badge from './Badge';
import { Bot, Sparkles, AlertCircle, RefreshCw, Settings, Save, Check } from 'lucide-react';
import { getAIAdvice } from '../../services/llmService';
import './AIAdviceModal.css';

export default function AIAdviceModal({ project, isOpen, onClose }) {
    const { llmSettings, setView, updateProject } = useApp();
    const [advice, setAdvice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    // Reset state when modal opens or project changes
    useEffect(() => {
        if (isOpen) {
            setAdvice('');
            setError('');
            setIsLoading(false);
            setIsSaved(false);
        }
    }, [isOpen, project?.id]);

    const handleGetAdvice = async () => {
        if (!llmSettings?.apiKey && llmSettings?.provider !== 'vertex') {
            setError('LLM APIが設定されていません。設定画面から設定してください。');
            return;
        }
        if (llmSettings?.provider === 'vertex' && !llmSettings?.vertexServiceAccountJson) {
            setError('Vertex AIのサービスアカウントJSONが設定されていません。設定画面から設定してください。');
            return;
        }

        setIsLoading(true);
        setError('');
        setAdvice('');
        setIsSaved(false);

        try {
            const result = await getAIAdvice(project, llmSettings);
            setAdvice(result);
        } catch (err) {
            setError(err.message || 'アドバイスの取得に失敗しました');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveAdvice = () => {
        if (!advice || !project) return;

        const aiAdviceEntry = {
            id: `ai-advice-${Date.now()}`,
            content: advice,
            generatedAt: new Date().toISOString(),
            provider: llmSettings?.provider || 'unknown'
        };

        // Save to project's aiAdvices array
        const updatedAiAdvices = [...(project.aiAdvices || []), aiAdviceEntry];
        updateProject({ ...project, aiAdvices: updatedAiAdvices });

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
    };

    const handleGoToSettings = () => {
        onClose();
        setView('settings');
    };

    const isConfigured = llmSettings?.apiKey || llmSettings?.vertexServiceAccountJson;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="AIアドバイス" size="lg">
            <div className="ai-advice-modal">
                <div className="ai-advice-modal__header">
                    <div className="ai-advice-modal__project">
                        <Bot size={24} className="ai-advice-modal__icon" />
                        <div>
                            <h3>{project?.name}</h3>
                            <span className="ai-advice-modal__client">{project?.clientName}</span>
                        </div>
                    </div>
                </div>

                {!isConfigured && (
                    <div className="ai-advice-modal__notice ai-advice-modal__notice--warning">
                        <AlertCircle size={20} />
                        <div>
                            <p>LLM APIが設定されていません。</p>
                            <button onClick={handleGoToSettings} className="ai-advice-modal__link">
                                <Settings size={14} /> 設定画面へ
                            </button>
                        </div>
                    </div>
                )}

                <div className="ai-advice-modal__context">
                    <h4>分析対象</h4>
                    <div className="ai-advice-modal__context-grid">
                        {project?.risks?.length > 0 && (
                            <div className="ai-advice-modal__context-item">
                                <Badge variant="danger" size="sm">リスク</Badge>
                                <span>{project.risks.length}件</span>
                            </div>
                        )}
                        {project?.issues?.length > 0 && (
                            <div className="ai-advice-modal__context-item">
                                <Badge variant="warning" size="sm">課題</Badge>
                                <span>{project.issues.length}件</span>
                            </div>
                        )}
                        {project?.probability && (
                            <div className="ai-advice-modal__context-item">
                                <Badge variant="info" size="sm">確度</Badge>
                                <span>{project.probability}</span>
                            </div>
                        )}
                    </div>
                </div>

                {!advice && !isLoading && !error && (
                    <div className="ai-advice-modal__cta">
                        <button
                            className="ai-advice-modal__btn ai-advice-modal__btn--primary"
                            onClick={handleGetAdvice}
                            disabled={!isConfigured}
                        >
                            <Sparkles size={18} />
                            AIにアドバイスを求める
                            <span className="ai-advice-modal__btn-badge">β版</span>
                        </button>
                    </div>
                )}

                {isLoading && (
                    <div className="ai-advice-modal__loading">
                        <RefreshCw size={24} className="ai-advice-modal__spinner" />
                        <span>AIがアドバイスを生成中...</span>
                    </div>
                )}

                {error && (
                    <div className="ai-advice-modal__notice ai-advice-modal__notice--error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                {advice && (
                    <div className="ai-advice-modal__result">
                        <div className="ai-advice-modal__result-header">
                            <Sparkles size={16} />
                            <span>AIアドバイス</span>
                        </div>
                        <div className="ai-advice-modal__result-content">
                            {advice.split('\n').map((line, i) => (
                                <p key={i}>{line || <br />}</p>
                            ))}
                        </div>
                        <div className="ai-advice-modal__actions">
                            <button
                                className={`ai-advice-modal__btn ai-advice-modal__btn--save ${isSaved ? 'ai-advice-modal__btn--saved' : ''}`}
                                onClick={handleSaveAdvice}
                                disabled={isSaved}
                            >
                                {isSaved ? <Check size={14} /> : <Save size={14} />}
                                {isSaved ? '保存しました' : '案件に保存'}
                            </button>
                            <button
                                className="ai-advice-modal__btn ai-advice-modal__btn--secondary"
                                onClick={handleGetAdvice}
                            >
                                <RefreshCw size={14} />
                                再生成
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}

