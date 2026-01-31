import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { ROLES } from '../data/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Modal, ProjectForm } from '../components/UI';
import ProjectsGantt from '../components/Dashboard/ProjectsGantt';
import {
    Calendar,
    DollarSign,
    Users,
    AlertTriangle,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Minus,
    LayoutGrid,
    GanttChart,
    Plus,
    Edit2,
    Trash2
} from 'lucide-react';
import { format, parseISO, differenceInDays, addMonths, startOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell,
    Legend
} from 'recharts';
import './ProjectsView.css';

// Generate months between start and end dates
const generateMonthsBetween = (startDate, endDate) => {
    const months = [];
    const start = startOfMonth(parseISO(startDate));
    const end = startOfMonth(parseISO(endDate));
    let current = start;
    while (current <= end) {
        months.push(format(current, 'yyyy-MM'));
        current = addMonths(current, 1);
    }
    return months;
};

export default function ProjectsView() {
    const {
        activeProjects,
        members,
        getAllocationsForProject,
        getMemberById,
        addAllocation,
        updateAllocation,
        deleteAllocation,
        selectProject,
        selectedProjectId,
        addProject,
        updateProject,
        deleteProject,
        managerMode
    } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('panel'); // 'panel' or 'gantt'

    // State for project CRUD
    const [isAddingProject, setIsAddingProject] = useState(false);
    const [isEditingProject, setIsEditingProject] = useState(false);

    const selectedProject = activeProjects.find(p => p.id === selectedProjectId);

    const handleSelectProject = (projectId) => {
        selectProject(projectId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        selectProject(null);
        setIsEditingProject(false);
    };

    // Calculate days remaining
    const getDaysRemaining = (endDate) => {
        const days = differenceInDays(parseISO(endDate), new Date());
        return days;
    };

    // Calculate cost variance
    const getCostVariance = (planned, actual) => {
        if (!planned || !actual) return 0;
        return ((actual - planned) / planned * 100).toFixed(1);
    };

    // Get project team
    const getProjectTeam = (projectId) => {
        const allocations = getAllocationsForProject(projectId);
        // Group by member, get unique members
        const memberMap = new Map();
        allocations.forEach(a => {
            if (!memberMap.has(a.memberId)) {
                const member = getMemberById(a.memberId);
                memberMap.set(a.memberId, {
                    ...member,
                    projectRole: a.role,
                    latestPercentage: a.percentage
                });
            }
        });
        return Array.from(memberMap.values());
    };

    // === Project CRUD Handlers ===
    const handleAddProject = () => {
        setIsAddingProject(true);
    };

    const handleEditProject = () => {
        setIsEditingProject(true);
    };

    const handleDeleteProject = () => {
        if (selectedProject && window.confirm(`「${selectedProject.name}」を削除してもよろしいですか？\n関連するアロケーションもすべて削除されます。`)) {
            deleteProject(selectedProject.id);
            closeModal();
        }
    };

    const handleProjectFormSubmit = (formData) => {
        if (isEditingProject && selectedProject) {
            // Update existing project
            updateProject({
                ...selectedProject,
                ...formData,
                id: selectedProject.id,
            });
            setIsEditingProject(false);
        } else {
            // Add new project
            const newProject = {
                ...formData,
                id: `project-${Date.now()}`,
                status: 'active',
                logs: [],
            };
            addProject(newProject);
            setIsAddingProject(false);
        }
    };

    const handleProjectFormCancel = () => {
        setIsAddingProject(false);
        setIsEditingProject(false);
    };

    return (
        <div className="projects-view">
            <div className="projects-view__header">
                <h2 className="projects-view__title">受注案件一覧</h2>
                <div className="projects-view__header-actions">
                    {managerMode && (
                        <button className="projects-view__add-btn" onClick={handleAddProject}>
                            <Plus size={18} />
                            新規登録
                        </button>
                    )}
                    <div className="projects-view__view-toggle">
                        <button
                            className={`projects-view__toggle-btn ${viewMode === 'panel' ? 'projects-view__toggle-btn--active' : ''}`}
                            onClick={() => setViewMode('panel')}
                            title="パネル表示"
                        >
                            <LayoutGrid size={18} />
                            パネル
                        </button>
                        <button
                            className={`projects-view__toggle-btn ${viewMode === 'gantt' ? 'projects-view__toggle-btn--active' : ''}`}
                            onClick={() => setViewMode('gantt')}
                            title="ガントチャート表示"
                        >
                            <GanttChart size={18} />
                            タイムライン
                        </button>
                    </div>
                </div>
            </div>

            {viewMode === 'panel' ? (
                <div className="projects-view__grid">
                    {activeProjects.map(project => {
                        const daysRemaining = getDaysRemaining(project.endDate);
                        const costVariance = getCostVariance(project.plannedCost, project.actualCost);
                        const team = getProjectTeam(project.id);

                        return (
                            <Card
                                key={project.id}
                                hoverable
                                onClick={() => handleSelectProject(project.id)}
                                className="projects-view__card"
                            >
                                <CardHeader>
                                    <div>
                                        {project.projectCode && (
                                            <span className="projects-view__project-code">{project.projectCode}</span>
                                        )}
                                        <CardTitle>{project.name}</CardTitle>
                                    </div>
                                    <Badge variant={daysRemaining < 30 ? 'warning' : 'info'}>
                                        残り{daysRemaining}日
                                    </Badge>
                                </CardHeader>
                                <CardContent>
                                    <p className="projects-view__client">{project.clientName}</p>
                                    <p className="projects-view__description">{project.description}</p>

                                    {/* Financials Summary */}
                                    <div className="projects-view__financials">
                                        <div className="projects-view__financial-item">
                                            <span className="projects-view__financial-label">売上</span>
                                            <span className="projects-view__financial-value">
                                                ¥{((project.actualRevenue || project.estimatedBudget) / 10000).toLocaleString()}万
                                            </span>
                                        </div>
                                        <div className="projects-view__financial-item">
                                            <span className="projects-view__financial-label">コスト差異</span>
                                            <span className={`projects-view__financial-value ${costVariance > 0 ? 'projects-view__financial-value--negative' :
                                                costVariance < 0 ? 'projects-view__financial-value--positive' : ''
                                                }`}>
                                                {costVariance > 0 ? <TrendingUp size={14} /> :
                                                    costVariance < 0 ? <TrendingDown size={14} /> :
                                                        <Minus size={14} />}
                                                {Math.abs(costVariance)}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Issues/Risks indicators */}
                                    {(project.issues.length > 0 || project.risks.length > 0) && (
                                        <div className="projects-view__alerts">
                                            {project.issues.length > 0 && (
                                                <span className="projects-view__alert projects-view__alert--issue">
                                                    <AlertCircle size={14} /> {project.issues.length}件の課題
                                                </span>
                                            )}
                                            {project.risks.length > 0 && (
                                                <span className="projects-view__alert projects-view__alert--risk">
                                                    <AlertTriangle size={14} /> {project.risks.length}件のリスク
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter>
                                    <div className="projects-view__team">
                                        <Users size={14} />
                                        <span>{team.length}名参画</span>
                                    </div>
                                    <div className="projects-view__period">
                                        <Calendar size={14} />
                                        <span>
                                            {format(parseISO(project.startDate), 'M/d', { locale: ja })} -
                                            {format(parseISO(project.endDate), 'M/d', { locale: ja })}
                                        </span>
                                    </div>
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="projects-view__gantt glass-card">
                    <ProjectsGantt onSelectProject={handleSelectProject} />
                </div>
            )}

            {/* Add Project Modal */}
            <Modal
                isOpen={isAddingProject}
                onClose={() => setIsAddingProject(false)}
                title="新規受注案件登録"
                size="lg"
            >
                <ProjectForm
                    mode="project"
                    onSubmit={handleProjectFormSubmit}
                    onCancel={handleProjectFormCancel}
                />
            </Modal>

            {/* Project Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={selectedProject?.name || ''}
                size="xl"
            >
                {selectedProject && isEditingProject ? (
                    <ProjectForm
                        initialData={selectedProject}
                        mode="project"
                        onSubmit={handleProjectFormSubmit}
                        onCancel={handleProjectFormCancel}
                    />
                ) : selectedProject && (
                    <ProjectDetail
                        project={selectedProject}
                        members={members}
                        getAllocationsForProject={getAllocationsForProject}
                        getMemberById={getMemberById}
                        addAllocation={addAllocation}
                        updateAllocation={updateAllocation}
                        deleteAllocation={deleteAllocation}
                        managerMode={managerMode}
                        onEdit={handleEditProject}
                        onDelete={handleDeleteProject}
                    />
                )}
            </Modal>
        </div>
    );
}

// Project Detail Component
function ProjectDetail({
    project,
    members,
    getAllocationsForProject,
    getMemberById,
    addAllocation,
    updateAllocation,
    deleteAllocation,
    managerMode,
    onEdit,
    onDelete
}) {
    const [isAddingAllocation, setIsAddingAllocation] = useState(false);
    const [editingAllocationId, setEditingAllocationId] = useState(null);
    const [allocationForm, setAllocationForm] = useState({
        memberId: '',
        role: '',
        month: '',
        percentage: 50
    });

    // Get all allocations for this project
    const projectAllocations = useMemo(() => {
        return getAllocationsForProject(project.id).filter(a => !a.isProspect && !a.isPreSales);
    }, [project.id, getAllocationsForProject]);

    // Available months for allocation (project period)
    const availableMonths = useMemo(() => {
        return generateMonthsBetween(project.startDate, project.endDate);
    }, [project.startDate, project.endDate]);

    // Group allocations by member
    const allocationsByMember = useMemo(() => {
        const map = new Map();
        projectAllocations.forEach(a => {
            const member = getMemberById(a.memberId);
            if (!map.has(a.memberId)) {
                map.set(a.memberId, { member, allocations: [] });
            }
            map.get(a.memberId).allocations.push(a);
        });
        return Array.from(map.values());
    }, [projectAllocations, getMemberById]);

    // Get team for summary display
    const team = useMemo(() => {
        return allocationsByMember.map(({ member, allocations }) => ({
            ...member,
            projectRole: allocations[0]?.role,
            latestPercentage: allocations[allocations.length - 1]?.percentage
        }));
    }, [allocationsByMember]);

    const costVariance = project.plannedCost && project.actualCost
        ? ((project.actualCost - project.plannedCost) / project.plannedCost * 100).toFixed(1)
        : 0;

    const financialData = [
        {
            name: '売上',
            計画: project.estimatedBudget / 10000,
            実績: (project.actualRevenue || project.estimatedBudget) / 10000
        },
        {
            name: 'コスト',
            計画: (project.plannedCost || 0) / 10000,
            実績: (project.actualCost || 0) / 10000
        }
    ];

    // Allocation handlers
    const handleAddAllocation = () => {
        setIsAddingAllocation(true);
        setEditingAllocationId(null);
        setAllocationForm({
            memberId: members[0]?.id || '',
            role: Object.values(ROLES)[0],
            month: availableMonths[0] || '',
            percentage: 50
        });
    };

    const handleEditAllocation = (allocation) => {
        setEditingAllocationId(allocation.id);
        setIsAddingAllocation(false);
        setAllocationForm({
            memberId: allocation.memberId,
            role: allocation.role,
            month: allocation.month,
            percentage: allocation.percentage
        });
    };

    const handleSaveAllocation = () => {
        if (!allocationForm.memberId || !allocationForm.role || !allocationForm.month) return;

        if (editingAllocationId) {
            updateAllocation({
                id: editingAllocationId,
                ...allocationForm,
                projectId: project.id
            });
        } else {
            addAllocation({
                id: `alloc-${Date.now()}`,
                ...allocationForm,
                projectId: project.id
            });
        }
        setIsAddingAllocation(false);
        setEditingAllocationId(null);
    };

    const handleDeleteAllocation = (allocationId) => {
        if (window.confirm('このアサインを削除してもよろしいですか？')) {
            deleteAllocation(allocationId);
        }
    };

    const handleCancelEdit = () => {
        setIsAddingAllocation(false);
        setEditingAllocationId(null);
    };

    return (
        <div className="project-detail">
            <div className="project-detail__header">
                <div>
                    {project.projectCode && (
                        <>
                            <span className="project-detail__label">案件ID</span>
                            <span className="project-detail__value project-detail__project-code">{project.projectCode}</span>
                        </>
                    )}
                </div>
                <div>
                    <span className="project-detail__label">顧客名</span>
                    <span className="project-detail__value">{project.clientName}</span>
                </div>
                <div>
                    <span className="project-detail__label">期間</span>
                    <span className="project-detail__value">
                        {format(parseISO(project.startDate), 'yyyy/MM/dd')} 〜
                        {format(parseISO(project.endDate), 'yyyy/MM/dd')}
                    </span>
                </div>
            </div>

            {/* Manager Actions */}
            {managerMode && (
                <div className="project-detail__actions">
                    <button className="project-detail__action-btn project-detail__action-btn--edit" onClick={onEdit}>
                        <Edit2 size={16} />
                        編集
                    </button>
                    <button className="project-detail__action-btn project-detail__action-btn--delete" onClick={onDelete}>
                        <Trash2 size={16} />
                        削除
                    </button>
                </div>
            )}

            <div className="project-detail__section">
                <h4 className="project-detail__section-title">概要</h4>
                <p>{project.description}</p>
            </div>

            {/* Financial Chart */}
            <div className="project-detail__section">
                <h4 className="project-detail__section-title">収支状況（万円）</h4>
                <div className="project-detail__chart">
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={financialData} layout="vertical">
                            <XAxis type="number" stroke="var(--color-text-muted)" />
                            <YAxis
                                type="category"
                                dataKey="name"
                                stroke="var(--color-text-muted)"
                                width={60}
                            />
                            <Tooltip
                                contentStyle={{
                                    background: 'var(--color-bg-secondary)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: 'var(--radius-md)'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="計画" fill="var(--color-accent-blue)" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="実績" radius={[0, 4, 4, 0]}>
                                {financialData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={index === 1 && costVariance > 5
                                            ? 'var(--color-accent-red)'
                                            : 'var(--color-accent-purple)'
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Issues */}
            {project.issues.length > 0 && (
                <div className="project-detail__section project-detail__section--issue">
                    <h4 className="project-detail__section-title">
                        <AlertCircle size={16} /> 課題
                    </h4>
                    <ul className="project-detail__list">
                        {project.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Risks */}
            {project.risks.length > 0 && (
                <div className="project-detail__section project-detail__section--risk">
                    <h4 className="project-detail__section-title">
                        <AlertTriangle size={16} /> リスク
                    </h4>
                    <ul className="project-detail__list">
                        {project.risks.map((risk, i) => (
                            <li key={i}>{risk}</li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Team with allocation management */}
            <div className="project-detail__section project-detail__section--team">
                <div className="project-detail__section-header">
                    <h4 className="project-detail__section-title">
                        <Users size={16} /> プロジェクトチーム
                    </h4>
                    {managerMode && (
                        <button className="project-detail__add-btn" onClick={handleAddAllocation}>
                            <Plus size={16} /> メンバー追加
                        </button>
                    )}
                </div>

                {/* Add/Edit Allocation Form */}
                {(isAddingAllocation || editingAllocationId) && (
                    <div className="allocation-form">
                        <div className="allocation-form__row">
                            <div className="allocation-form__field">
                                <label>メンバー</label>
                                <select
                                    value={allocationForm.memberId}
                                    onChange={e => setAllocationForm({ ...allocationForm, memberId: e.target.value })}
                                >
                                    {members.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="allocation-form__field">
                                <label>ロール</label>
                                <select
                                    value={allocationForm.role}
                                    onChange={e => setAllocationForm({ ...allocationForm, role: e.target.value })}
                                >
                                    {Object.values(ROLES).map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="allocation-form__field">
                                <label>月</label>
                                <select
                                    value={allocationForm.month}
                                    onChange={e => setAllocationForm({ ...allocationForm, month: e.target.value })}
                                >
                                    {availableMonths.map(month => (
                                        <option key={month} value={month}>
                                            {format(parseISO(month + '-01'), 'yyyy年M月', { locale: ja })}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="allocation-form__field">
                                <label>従事率 ({allocationForm.percentage}%)</label>
                                <input
                                    type="range"
                                    min="10"
                                    max="100"
                                    step="10"
                                    value={allocationForm.percentage}
                                    onChange={e => setAllocationForm({ ...allocationForm, percentage: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>
                        <div className="allocation-form__actions">
                            <button className="allocation-form__btn allocation-form__btn--save" onClick={handleSaveAllocation}>
                                保存
                            </button>
                            <button className="allocation-form__btn allocation-form__btn--cancel" onClick={handleCancelEdit}>
                                キャンセル
                            </button>
                        </div>
                    </div>
                )}

                {/* Team Members List */}
                {allocationsByMember.length > 0 ? (
                    <div className="allocation-list">
                        {allocationsByMember.map(({ member, allocations }) => (
                            <div key={member.id} className="allocation-list__member">
                                <div className="allocation-list__member-header">
                                    <div className="allocation-list__member-avatar">
                                        {member.name.charAt(0)}
                                    </div>
                                    <div className="allocation-list__member-info">
                                        <span className="allocation-list__member-name">{member.name}</span>
                                        <span className="allocation-list__member-role">{member.role}</span>
                                    </div>
                                </div>
                                <div className="allocation-list__items">
                                    {allocations.map(a => (
                                        <div key={a.id} className="allocation-list__item">
                                            <Badge size="sm" variant="purple">
                                                {format(parseISO(a.month + '-01'), 'M月', { locale: ja })}
                                            </Badge>
                                            <span className="allocation-list__item-role">{a.role}</span>
                                            <span className="allocation-list__item-pct">{a.percentage}%</span>
                                            {managerMode && (
                                                <div className="allocation-list__item-actions">
                                                    <button
                                                        className="allocation-list__item-btn"
                                                        onClick={() => handleEditAllocation(a)}
                                                        title="編集"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        className="allocation-list__item-btn allocation-list__item-btn--delete"
                                                        onClick={() => handleDeleteAllocation(a.id)}
                                                        title="削除"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="allocation-list__empty">
                        チームメンバーがいません。「メンバー追加」ボタンからアサインしてください。
                    </p>
                )}
            </div>
        </div>
    );
}
