import {
    LayoutDashboard,
    Users,
    FolderKanban,
    TrendingUp,
    Settings,
    History,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './Sidebar.css';

const allMenuItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { id: 'leads', label: 'プレ活動', icon: TrendingUp },
    { id: 'projects', label: '受注案件', icon: FolderKanban },
    { id: 'resources', label: 'リソース管理', icon: Users, managerOnly: true },
    { id: 'history', label: '更新履歴', icon: History, managerOnly: true },
];

export default function Sidebar({ isCollapsed, onToggle }) {
    const { currentView, setView, managerMode } = useApp();

    // Filter menu items based on manager mode
    const menuItems = allMenuItems.filter(item => !item.managerOnly || managerMode);

    return (
        <aside className={`sidebar ${isCollapsed ? 'sidebar--collapsed' : ''}`}>
            <div className="sidebar__header">
                {!isCollapsed && (
                    <h1 className="sidebar__logo">
                        <span className="text-gradient">PRV</span>
                    </h1>
                )}
                <button className="sidebar__toggle" onClick={onToggle}>
                    {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav className="sidebar__nav">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            className={`sidebar__item ${isActive ? 'sidebar__item--active' : ''}`}
                            onClick={() => setView(item.id)}
                            title={item.label}
                        >
                            <Icon size={22} className="sidebar__icon" />
                            {!isCollapsed && <span className="sidebar__label">{item.label}</span>}
                            {isActive && <div className="sidebar__indicator" />}
                        </button>
                    );
                })}
            </nav>

            <div className="sidebar__footer">
                {managerMode && (
                    <button
                        className={`sidebar__item ${currentView === 'settings' ? 'sidebar__item--active' : ''}`}
                        title="設定"
                        onClick={() => setView('settings')}
                    >
                        <Settings size={22} className="sidebar__icon" />
                        {!isCollapsed && <span className="sidebar__label">設定</span>}
                        {currentView === 'settings' && <div className="sidebar__indicator" />}
                    </button>
                )}
            </div>
        </aside>
    );
}
