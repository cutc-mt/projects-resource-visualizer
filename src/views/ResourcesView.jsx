import { useApp } from '../context/AppContext';
import ResourceMatrix from '../components/Dashboard/ResourceMatrix';
import './ResourcesView.css';

export default function ResourcesView() {
    const { members, managerMode } = useApp();

    return (
        <div className="resources-view">
            <div className="resources-view__header">
                <h2 className="resources-view__title">リソース管理</h2>
                <p className="resources-view__subtitle">
                    チームメンバーの月別稼働状況。行をクリックするとプロジェクト別の内訳を表示します。
                    {managerMode && ' 管理者モードではアサインの追加・編集・削除が可能です。'}
                </p>
            </div>

            <div className="resources-view__summary">
                <div className="resources-view__summary-item">
                    <span className="resources-view__summary-label">総メンバー数</span>
                    <span className="resources-view__summary-value">{members.length}名</span>
                </div>
            </div>

            <div className="resources-view__matrix glass-card">
                <ResourceMatrix managerMode={managerMode} />
            </div>
        </div>
    );
}

