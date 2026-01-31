import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, Badge, Modal } from '../components/UI';
import { History, Calendar, Filter, ExternalLink, Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import './HistoryView.css';

// Action icon mapping
const ACTION_ICONS = {
    '新規登録': Plus,
    '更新': Edit,
    '削除': Trash2,
    '受注変換': ArrowRight,
};

// Action color mapping
const ACTION_COLORS = {
    '新規登録': 'success',
    '更新': 'info',
    '削除': 'danger',
    '受注変換': 'purple',
};

export default function HistoryView() {
    const { updateLogs, projects, selectProject, setView, managerMode } = useApp();

    // Date filter state
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Project detail modal
    const [selectedProject, setSelectedProject] = useState(null);
    const [showProjectModal, setShowProjectModal] = useState(false);

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

    // Get project exists
    const projectExists = (projectId) => {
        return projects.some(p => p.id === projectId);
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

            {/* Filters */}
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
                        const Icon = ACTION_ICONS[log.action] || Edit;
                        const exists = projectExists(log.projectId);

                        return (
                            <div key={log.id} className="history-view__log-item">
                                <div className={`history-view__log-icon history-view__log-icon--${ACTION_COLORS[log.action]}`}>
                                    <Icon size={18} />
                                </div>
                                <div className="history-view__log-content">
                                    <div className="history-view__log-header">
                                        <button
                                            className={`history-view__project-name ${!exists ? 'history-view__project-name--deleted' : ''}`}
                                            onClick={() => exists && handleProjectClick(log)}
                                            disabled={!exists}
                                        >
                                            {log.projectName}
                                            {exists && <ExternalLink size={14} />}
                                        </button>
                                        <Badge variant={ACTION_COLORS[log.action]}>
                                            {log.action}
                                        </Badge>
                                    </div>
                                    <div className="history-view__log-meta">
                                        <span className="history-view__log-time">
                                            {formatTimestamp(log.timestamp)}
                                        </span>
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
