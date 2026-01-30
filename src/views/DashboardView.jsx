import { TrendingUp, FolderKanban, Users, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { StatCard } from '../components/UI';
import LeadsBubbleChart from '../components/Dashboard/LeadsBubbleChart';
import ResourceMatrix from '../components/Dashboard/ResourceMatrix';
import './DashboardView.css';

export default function DashboardView() {
    const { leads, activeProjects, members, selectProject, setView } = useApp();

    // Calculate stats
    const totalLeadValue = leads.reduce((sum, l) => sum + l.estimatedBudget, 0);
    const weightedPipeline = leads.reduce((sum, l) => sum + (l.estimatedBudget * l.probability / 100), 0);
    const activeRevenue = activeProjects.reduce((sum, p) => sum + (p.actualRevenue || p.estimatedBudget), 0);

    const handleSelectLead = (leadId) => {
        selectProject(leadId);
        setView('leads');
    };

    return (
        <div className="dashboard-view">
            {/* Stats Row */}
            <div className="dashboard-view__stats">
                <StatCard
                    title="プレ活動"
                    value={leads.length}
                    subtitle="件の商談中"
                    icon={TrendingUp}
                    accentColor="purple"
                />
                <StatCard
                    title="パイプライン"
                    value={`¥${(weightedPipeline / 10000).toLocaleString()}万`}
                    subtitle="加重見込額"
                    icon={DollarSign}
                    accentColor="green"
                />
                <StatCard
                    title="受注案件"
                    value={activeProjects.length}
                    subtitle={`売上: ¥${(activeRevenue / 10000).toLocaleString()}万`}
                    icon={FolderKanban}
                    accentColor="blue"
                />
                <StatCard
                    title="チームメンバー"
                    value={members.length}
                    subtitle="名のリソース"
                    icon={Users}
                    accentColor="yellow"
                />
            </div>

            {/* Leads Bubble Chart */}
            <section className="dashboard-view__section">
                <div className="dashboard-view__section-header">
                    <h3 className="dashboard-view__section-title">プレ活動パイプライン</h3>
                    <p className="dashboard-view__section-subtitle">
                        バブルの大きさ = 予算規模、色 = 受注確度
                    </p>
                </div>
                <div className="dashboard-view__chart glass-card">
                    <LeadsBubbleChart onSelectLead={handleSelectLead} />
                </div>
            </section>

            {/* Resource Matrix */}
            <section className="dashboard-view__section">
                <div className="dashboard-view__section-header">
                    <h3 className="dashboard-view__section-title">リソース稼働状況</h3>
                    <p className="dashboard-view__section-subtitle">
                        クリックで詳細展開（プロジェクト別稼働率）
                    </p>
                </div>
                <div className="dashboard-view__matrix glass-card">
                    <ResourceMatrix />
                </div>
            </section>
        </div>
    );
}
