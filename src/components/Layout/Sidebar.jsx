import {
    LayoutDashboard,
    Users,
    FolderKanban,
    TrendingUp,
    Settings,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import './Sidebar.css';

const menuItems = [
    { id: 'dashboard', label: 'ダッシュボード', icon: LayoutDashboard },
    { id: 'leads', label: 'プレ活動', icon: TrendingUp },
    { id: 'projects', label: '受注案件', icon: FolderKanban },
    { id: 'resources', label: 'リソース管理', icon: Users },
];

export default function Sidebar({ isCollapsed, onToggle }) {
    const { currentView, setView } = useApp();

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
                <button className="sidebar__item" title="設定">
                    <Settings size={22} className="sidebar__icon" />
                    {!isCollapsed && <span className="sidebar__label">設定</span>}
                </button>
            </div>
        </aside>
    );
}
