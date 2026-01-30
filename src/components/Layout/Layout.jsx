import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import './Layout.css';

export default function Layout({ children }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    return (
        <div className={`layout ${isSidebarCollapsed ? 'layout--collapsed' : ''}`}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            />
            <div className="layout__main">
                <Header />
                <main className="layout__content">
                    {children}
                </main>
            </div>
        </div>
    );
}
