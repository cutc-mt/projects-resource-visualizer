import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Badge, Modal } from '../components/UI';
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
    GanttChart
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
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

export default function ProjectsView() {
    const { activeProjects, getAllocationsForProject, getMemberById, selectProject, selectedProjectId } = useApp();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewMode, setViewMode] = useState('panel'); // 'panel' or 'gantt'

    const selectedProject = activeProjects.find(p => p.id === selectedProjectId);

    const handleSelectProject = (projectId) => {
        selectProject(projectId);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        selectProject(null);
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

    return (
        <div className="projects-view">
            <div className="projects-view__header">
                <h2 className="projects-view__title">受注案件一覧</h2>
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
                                    <CardTitle>{project.name}</CardTitle>
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

            {/* Project Detail Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={closeModal}
                title={selectedProject?.name || ''}
                size="xl"
            >
                {selectedProject && (
                    <ProjectDetail
                        project={selectedProject}
                        team={getProjectTeam(selectedProject.id)}
                    />
                )}
            </Modal>
        </div>
    );
}

// Project Detail Component
function ProjectDetail({ project, team }) {
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

    return (
        <div className="project-detail">
            <div className="project-detail__header">
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

            {/* Team */}
            <div className="project-detail__section">
                <h4 className="project-detail__section-title">プロジェクトチーム</h4>
                <div className="project-detail__team">
                    {team.map(member => (
                        <div key={member.id} className="project-detail__member">
                            <div className="project-detail__member-avatar">
                                {member.name.charAt(0)}
                            </div>
                            <div className="project-detail__member-info">
                                <span className="project-detail__member-name">{member.name}</span>
                                <span className="project-detail__member-role">{member.projectRole}</span>
                            </div>
                            <Badge size="sm">{member.latestPercentage}%</Badge>
                        </div>
                    ))}
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
        </div>
    );
}
