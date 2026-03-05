'use client';

import { useState, useEffect } from 'react';
import { useAuthStore, useUIStore } from '@/lib/store';
import Sidebar from './Sidebar';
import Dashboard from '../dashboard/Dashboard';
import IncomesPage from '../incomes/IncomesPage';
import ExpensesPage from '../expenses/ExpensesPage';
import GoalsPage from '../goals/GoalsPage';
import ReportsPage from '../reports/ReportsPage';
import ProfilePage from '../profile/ProfilePage';

export type PageKey = 'dashboard' | 'incomes' | 'expenses' | 'goals' | 'reports' | 'profile';

export default function AppShell() {
    const { theme } = useUIStore();
    const [currentPage, setCurrentPage] = useState<PageKey>('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    // Close sidebar on mobile when page changes
    useEffect(() => {
        setSidebarOpen(false);
    }, [currentPage]);

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <Dashboard onNavigate={setCurrentPage} />;
            case 'incomes':
                return <IncomesPage />;
            case 'expenses':
                return <ExpensesPage />;
            case 'goals':
                return <GoalsPage />;
            case 'reports':
                return <ReportsPage />;
            case 'profile':
                return <ProfilePage />;
            default:
                return <Dashboard onNavigate={setCurrentPage} />;
        }
    };

    return (
        <div className="app-layout">
            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'var(--bg-overlay)',
                        zIndex: 35,
                    }}
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <Sidebar
                currentPage={currentPage}
                onNavigate={setCurrentPage}
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <main className={`main-content`}>
                {/* Mobile Header */}
                <div
                    style={{
                        display: 'none',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '20px',
                    }}
                    className="mobile-header"
                >
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => setSidebarOpen(true)}
                        aria-label="Abrir menú"
                    >
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M3 12h18M3 6h18M3 18h18" />
                        </svg>
                    </button>
                    <span className="gradient-text" style={{ fontWeight: 700, fontSize: '18px' }}>
                        FinanzApp
                    </span>
                    <div style={{ width: '40px' }} />
                </div>

                {renderPage()}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav className="bottom-nav">
                {[
                    { key: 'dashboard' as PageKey, icon: '📊', label: 'Inicio' },
                    { key: 'incomes' as PageKey, icon: '💵', label: 'Ingresos' },
                    { key: 'expenses' as PageKey, icon: '💳', label: 'Gastos' },
                    { key: 'goals' as PageKey, icon: '🎯', label: 'Metas' },
                    { key: 'reports' as PageKey, icon: '📈', label: 'Reportes' },
                ].map((item) => (
                    <button
                        key={item.key}
                        onClick={() => setCurrentPage(item.key)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '2px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '4px 8px',
                            borderRadius: 'var(--radius-md)',
                            color: currentPage === item.key ? 'var(--color-accent)' : 'var(--text-tertiary)',
                            fontSize: '10px',
                            fontWeight: currentPage === item.key ? 600 : 400,
                            fontFamily: 'Inter, sans-serif',
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <span style={{ fontSize: '20px' }}>{item.icon}</span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <style>{`
        @media (max-width: 1024px) {
          .mobile-header { display: flex !important; }
        }
      `}</style>
        </div>
    );
}
