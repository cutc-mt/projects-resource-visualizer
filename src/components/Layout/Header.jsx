import { Bell, Search, User, Shield, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const viewTitles = {
    dashboard: 'ダッシュボード',
    leads: 'プレ活動管理',
    projects: '受注案件管理',
    resources: 'リソース管理',
    member: 'メンバー詳細',
};

export default function Header() {
    const { currentView, managerMode } = useApp();
    const { isManager, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const today = new Date();
    const dateString = today.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
    });

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleLoginClick = () => {
        navigate('/login');
    };

    return (
        <header className="header">
            <div className="header__left">
                <h2 className="header__title">{viewTitles[currentView] || 'ダッシュボード'}</h2>
                <span className="header__date">{dateString}</span>
                {managerMode && (
                    <span className="header__manager-badge">
                        <Shield size={14} />
                        マネージャーモード
                    </span>
                )}
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

                {isManager ? (
                    <button className="header__logout-btn" onClick={handleLogout} title="ログアウト">
                        <LogOut size={18} />
                        <span>ログアウト</span>
                    </button>
                ) : (
                    <button className="header__login-btn" onClick={handleLoginClick} title="マネージャーログイン">
                        <Shield size={18} />
                        <span>管理者</span>
                    </button>
                )}

                <button className="header__user">
                    <div className="header__avatar">
                        <User size={20} />
                    </div>
                </button>
            </div>
        </header>
    );
}
