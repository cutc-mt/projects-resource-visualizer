import { Bell, Search, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './Header.css';

const viewTitles = {
    dashboard: 'ダッシュボード',
    leads: 'プレ活動管理',
    projects: '受注案件管理',
    resources: 'リソース管理',
    member: 'メンバー詳細',
};

export default function Header() {
    const { currentView } = useApp();

    const today = new Date();
    const dateString = today.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    });

    return (
        <header className="header">
            <div className="header__left">
                <h2 className="header__title">{viewTitles[currentView] || 'ダッシュボード'}</h2>
                <span className="header__date">{dateString}</span>
            </div>

            <div className="header__right">
                <div className="header__search">
                    <Search size={18} className="header__search-icon" />
                    <input
                        type="text"
                        placeholder="プロジェクト・メンバーを検索..."
                        className="header__search-input"
                    />
                </div>

                <button className="header__icon-btn">
                    <Bell size={20} />
                    <span className="header__notification-badge">3</span>
                </button>

                <button className="header__user">
                    <div className="header__avatar">
                        <User size={20} />
                    </div>
                </button>
            </div>
        </header>
    );
}
