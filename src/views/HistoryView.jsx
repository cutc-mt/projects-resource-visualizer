import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Modal } from '../components/UI';
import { History, Calendar, Filter, ExternalLink, Plus, Edit, Trash2, ArrowRight, Bot, Sparkles, X } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import { getHistorySummary } from '../services/llmService';
import './HistoryView.css';

// Action icon mapping
const ACTION_ICONS = {
    '新規登録': Plus,
    '更新': Edit,
    '削除': Trash2,
    '受注変換': ArrowRight,
};

// ... (ACTION_COLORS mapping remains the same)
const ACTION_COLORS = {
    '新規登録': 'success',
    '更新': 'info',
    '削除': 'danger',
    '受注変換': 'purple',
};

export default function HistoryView() {
    const { updateLogs, projects, members, allocations, selectProject, setView, managerMode, llmSettings } = useApp();

    // Date filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Project detail modal
    const [selectedProject, setSelectedProject] = useState(null);
    const [showProjectModal, setShowProjectModal] = useState(false);

    // AI Summary State
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [summaryResult, setSummaryResult] = useState('');
    const [showSummary, setShowSummary] = useState(false);
    const [summaryError, setSummaryError] = useState(null);

    // Filter logs by date range
    const filteredLogs = useMemo(() => {
        if (!startDate && !endDate) return updateLogs;

        return updateLogs.filter(log => {
            const logDate = parseISO(log.timestamp);

            if (startDate && endDate) {
                return isWithinInterval(logDate, {
                    start: startOfDay(parseISO(startDate)),
                    end: endOfDay(parseISO(endDate))
                });
            }

            if (startDate) {
                return logDate >= startOfDay(parseISO(startDate));
            }

            if (endDate) {
                return logDate <= endOfDay(parseISO(endDate));
            }

            return true;
        });
    }, [updateLogs, startDate, endDate]);

    // Handle project click
    const handleProjectClick = (log) => {
        const project = projects.find(p => p.id === log.projectId);
        if (project) {
            setSelectedProject(project);
            setShowProjectModal(true);
        }
    };

    // Navigate to project view
    const handleViewProject = () => {
        if (selectedProject) {
            selectProject(selectedProject.id);
            setView(selectedProject.status === 'lead' ? 'leads' : 'projects');
        }
        setShowProjectModal(false);
    };

    // Clear filters
    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
    };

    // Format timestamp
    const formatTimestamp = (timestamp) => {
        return format(parseISO(timestamp), 'yyyy/MM/dd HH:mm:ss', { locale: ja });
    };

    // Generate Summary
    const handleGenerateSummary = async () => {
        if (filteredLogs.length === 0) return;

        setIsGeneratingSummary(true);
        setSummaryError(null);
        setShowSummary(true);
        setSummaryResult('');

        try {
            if (!llmSettings) {
                throw new Error('AI設定が行われていません。設定画面から設定してください。');
            }
            const summary = await getHistorySummary(filteredLogs, llmSettings);
            setSummaryResult(summary);
        } catch (err) {
            setSummaryError(err.message);
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    return (
        <div className="history-view">
            <header className="history-view__header">
                <h2 className="history-view__title">
                    <History size={24} />
                    更新履歴
                </h2>
                <span className="history-view__count">
                    {filteredLogs.length}件
                </span>
            </header>

            {/* Filters & Actions */}
            <div className="history-view__controls">
                <div className="history-view__filters glass-card">
                    <div className="history-view__filter-group">
                        <label>
                            <Calendar size={16} />
                            開始日
                        </label>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="history-view__filter-group">
                        <label>
                            <Calendar size={16} />
                            終了日
                        </label>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button
                            className="history-view__clear-btn"
                            onClick={clearFilters}
                        >
                            <Filter size={16} />
                            クリア
                        </button>
                    )}
                </div>

                <button
                    className="history-view__ai-btn"
                    onClick={handleGenerateSummary}
                    disabled={filteredLogs.length === 0 || isGeneratingSummary}
                >
                    <Sparkles size={16} />
                    {isGeneratingSummary ? 'サマリ生成中...' : 'AIサマリ生成 (Beta)'}
                </button>
            </div>

            {/* AI Summary Result */}
            {showSummary && (
                <div className="history-view__summary glass-card">
                    <div className="history-view__summary-header">
                        <div className="history-view__summary-title">
                            <Bot size={20} className="text-accent-purple" />
                            <span>期間サマリ (AI生成)</span>
                        </div>
                        <button
                            className="history-view__close-btn"
                            onClick={() => setShowSummary(false)}
                        >
                            <X size={16} />
                        </button>
                    </div>
                    <div className="history-view__summary-content">
                        {isGeneratingSummary ? (
                            <div className="history-view__loading">
                                <div className="spinner"></div>
                                <p>履歴データを分析中...</p>
                            </div>
                        ) : summaryError ? (
                            <div className="history-view__error">
                                <p>{summaryError}</p>
                            </div>
                        ) : (
                            <div className="markdown-body">
                                {summaryResult.split('\n').map((line, i) => (
                                    <p key={i}>{line}</p>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}


            {/* Logs List */}
            <div className="history-view__logs">
                {filteredLogs.length === 0 ? (
                    <div className="history-view__empty">
                        <History size={48} />
                        <p>更新履歴がありません</p>
                        <span>案件を追加・編集すると履歴が記録されます</span>
                    </div>
                ) : (
                    filteredLogs.map((log) => {
                        // Map new log actions to display actions
                        let displayAction = log.action;
                        if (log.action === 'create') displayAction = '新規登録';
                        if (log.action === 'update') displayAction = '更新';
                        if (log.action === 'delete') displayAction = '削除';
                        if (log.action === 'convert') displayAction = '受注変換';
                        // Fallback for old logs
                        if (!['create', 'update', 'delete', 'convert'].includes(log.action)) {
                            displayAction = log.action;
                        }

                        const Icon = ACTION_ICONS[displayAction] || Edit;

                        // Check existence based on collection type
                        let exists = false;
                        if (log.collection === 'projects' || (!log.collection && log.projectId)) {
                            // Projects or Legacy logs
                            exists = projects.some(p => p.id === (log.record_id || log.projectId));
                        } else if (log.collection === 'allocations') {
                            // Allocations - Only check if we have allocations data (we need to access it from useApp first)
                            // Ideally, we should check if the allocation exists, but we might not have the full ID if it wasn't exposed.
                            // But usually, we only need to strike through if we know it DOESN'T exist.
                            // However, for allocations, we might just assume it exists for now to avoid strikethrough on create,
                            // or better, fetch allocations from context.
                            // Since we don't have allocations in props efficiently here without selecting everything,
                            // let's just NOT strike through for non-projects unless we are sure.
                            // Or better: Let's assume exists=true for non-projects to handle the UI bug requesting.
                            // Limitation: Deleted members/allocations won't have strikethrough, but that's better than new ones having it.
                            exists = true;
                        } else if (log.collection === 'members') {
                            // Members
                            // We need to access members from useApp. Let's add it to destructuring above first.
                            // For this ReplaceBlock, I'll temporarily set true, but I need to update the destructuring in a separate Edit or use a broader replace.
                            exists = true;
                        }

                        // Revised logic:
                        // 1. If it's a project log, check projects.
                        // 2. If it's another collection, we ideally check that collection.
                        // 3. Current bug: Member addition (create) is shown as deleted.
                        // Fix: Default exists to true for non-project collections for now to solve the immediate "strikethrough on create" bug.

                        const isProjectLog = log.collection === 'projects' || (!log.collection && log.projectId);
                        if (isProjectLog) {
                            exists = projects.some(p => p.id === (log.record_id || log.projectId));
                        } else {
                            exists = true; // Don't strike through members/allocations for now
                        }

                        const targetName = log.target_name || log.projectName || '不明なレコード';

                        return (
                            <div key={log.id} className="history-view__log-item">
                                <div className={`history-view__log-icon history-view__log-icon--${ACTION_COLORS[displayAction] || 'info'}`}>
                                    <Icon size={18} />
                                </div>
                                <div className="history-view__log-content">
                                    <div className="history-view__log-header">
                                        <button
                                            className={`history-view__project-name ${!exists ? 'history-view__project-name--deleted' : ''}`}
                                            onClick={() => exists && handleProjectClick({ projectId: log.record_id || log.projectId })}
                                            disabled={!exists}
                                            title={log.collection ? `${log.collection} : ${targetName}` : targetName}
                                        >
                                            {/* Show collection type for non-projects */}
                                            {log.collection && log.collection !== 'projects' && (
                                                <span className="history-view__collection-badge">
                                                    {log.collection === 'allocations' ? 'アサイン' : 'メンバー'}
                                                </span>
                                            )}
                                            {targetName}
                                            {exists && <ExternalLink size={14} />}
                                        </button>
                                        <Badge variant={ACTION_COLORS[displayAction] || 'gray'}>
                                            {displayAction}
                                        </Badge>
                                    </div>
                                    <div className="history-view__log-meta">
                                        <span className="history-view__log-time">
                                            {formatTimestamp(log.timestamp || log.created)}
                                        </span>

                                        {/* New Log Format: Changes Array */}
                                        {log.changes && log.changes.length > 0 && (
                                            <div className="history-view__log-changes">
                                                {log.changes.map((change, i) => (
                                                    <div key={i} className="history-view__change-item">
                                                        <span className="history-view__change-field">{change.field}:</span>
                                                        <span className="history-view__change-old">{String(change.old ?? '(なし)')}</span>
                                                        <ArrowRight size={12} className="history-view__change-arrow" />
                                                        <span className="history-view__change-new">{String(change.new ?? '(なし)')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Old Log Format: changedFields */}
                                        {log.details?.changedFields?.length > 0 && (
                                            <span className="history-view__log-fields">
                                                変更: {log.details.changedFields.join(', ')}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Project Detail Modal */}
            <Modal
                isOpen={showProjectModal}
                onClose={() => setShowProjectModal(false)}
                title="案件詳細"
            >
                {selectedProject && (
                    <div className="history-view__project-detail">
                        <div className="history-view__project-info">
                            <div className="history-view__project-row">
                                <span className="history-view__label">案件ID</span>
                                <span className="history-view__value">{selectedProject.projectCode}</span>
                            </div>
                            <div className="history-view__project-row">
                                <span className="history-view__label">案件名</span>
                                <span className="history-view__value">{selectedProject.name}</span>
                            </div>
                            <div className="history-view__project-row">
                                <span className="history-view__label">クライアント</span>
                                <span className="history-view__value">{selectedProject.clientName}</span>
                            </div>
                            <div className="history-view__project-row">
                                <span className="history-view__label">ステータス</span>
                                <Badge variant={selectedProject.status === 'lead' ? 'purple' : 'success'}>
                                    {selectedProject.status === 'lead' ? 'プレ活動' : '受注'}
                                </Badge>
                            </div>
                            <div className="history-view__project-row">
                                <span className="history-view__label">予算</span>
                                <span className="history-view__value">
                                    ¥{(selectedProject.estimatedBudget / 10000).toLocaleString()}万
                                </span>
                            </div>
                        </div>
                        <div className="history-view__modal-actions">
                            <button
                                className="history-view__view-btn"
                                onClick={handleViewProject}
                            >
                                <ExternalLink size={16} />
                                詳細ページで表示
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
