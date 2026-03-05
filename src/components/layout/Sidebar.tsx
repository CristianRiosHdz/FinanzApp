'use client';

import { useAuthStore, useUIStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { PageKey } from './AppShell';

interface SidebarProps {
    currentPage: PageKey;
    onNavigate: (page: PageKey) => void;
    isOpen: boolean;
    onClose: () => void;
}

const navItems: { key: PageKey; icon: string; label: string }[] = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'incomes', icon: '💵', label: 'Ingresos' },
    { key: 'expenses', icon: '💳', label: 'Gastos' },
    { key: 'goals', icon: '🎯', label: 'Metas de Ahorro' },
    { key: 'reports', icon: '📈', label: 'Reportes' },
    { key: 'profile', icon: '👤', label: 'Perfil' },
];

export default function Sidebar({ currentPage, onNavigate, isOpen, onClose }: SidebarProps) {
    const { profile, logout } = useAuthStore();
    const { theme, toggleTheme } = useUIStore();

    return (
        <aside className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>
            {/* Logo */}
            <div
                style={{
                    padding: '24px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: '1px solid var(--border-color)',
                }}
            >
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        flexShrink: 0,
                    }}
                >
                    💰
                </div>
                <div>
                    <h2 className="gradient-text" style={{ fontSize: '18px', fontWeight: 800, lineHeight: 1.2 }}>
                        FinanzApp
                    </h2>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                        Control Financiero
                    </p>
                </div>

                {/* Close button for mobile */}
                <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={onClose}
                    style={{ marginLeft: 'auto', display: 'none' }}
                    aria-label="Cerrar menú"
                    id="close-sidebar-btn"
                >
                    ✕
                </button>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: '12px 0' }}>
                {navItems.map((item) => (
                    <button
                        key={item.key}
                        className={`sidebar-nav-item ${currentPage === item.key ? 'active' : ''}`}
                        onClick={() => {
                            onNavigate(item.key);
                            onClose();
                        }}
                        id={`nav-${item.key}`}
                    >
                        <span className="nav-icon" style={{ fontSize: '18px' }}>{item.icon}</span>
                        <span>{item.label}</span>
                    </button>
                ))}
            </nav>

            {/* Theme Toggle */}
            <div style={{ padding: '12px 16px' }}>
                <button
                    className="sidebar-nav-item"
                    onClick={toggleTheme}
                    style={{ width: '100%', margin: 0 }}
                    id="theme-toggle-btn"
                >
                    <span className="nav-icon" style={{ fontSize: '18px' }}>
                        {theme === 'dark' ? '☀️' : '🌙'}
                    </span>
                    <span>{theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}</span>
                </button>
            </div>

            {/* User Info */}
            <div
                style={{
                    padding: '16px 20px',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}
            >
                <div
                    style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        fontWeight: 700,
                        color: 'white',
                        flexShrink: 0,
                    }}
                >
                    {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <p
                        style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                        }}
                    >
                        {profile?.full_name || 'Usuario'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Personal</p>
                </div>
                <button
                    className="btn btn-ghost btn-icon btn-sm"
                    onClick={async () => {
                        if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                            await supabase.auth.signOut();
                            logout();
                        }
                    }}
                    title="Cerrar sesión"
                    id="logout-btn"
                    style={{ color: 'var(--color-error)' }}
                >
                    ↗
                </button>
            </div>

            <style>{`
        @media (max-width: 1024px) {
          #close-sidebar-btn { display: flex !important; }
        }
      `}</style>
        </aside>
    );
}
