'use client';

import { useState } from 'react';
import { useAuthStore, useCategoryStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { Currency } from '@/lib/types';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { profile, user, updateProfile, logout } = useAuthStore();
    const { categories, updateCategory } = useCategoryStore();

    const [name, setName] = useState(profile?.full_name || '');
    const [currency, setCurrency] = useState<Currency>((profile?.currency || 'COP') as Currency);
    const [monthlyTarget, setMonthlyTarget] = useState(profile?.monthly_income_target?.toString() || '');
    const [editingCat, setEditingCat] = useState<string | null>(null);
    const [catBudget, setCatBudget] = useState('');

    const handleSaveProfile = () => {
        if (!name || name.length < 2) {
            toast.error('Ingresa un nombre válido');
            return;
        }
        updateProfile({
            full_name: name,
            currency,
            monthly_income_target: monthlyTarget ? parseFloat(monthlyTarget) : null,
        });
        toast.success('Perfil actualizado');
    };

    const handleSaveBudget = (catId: string) => {
        updateCategory(catId, {
            budget_limit: catBudget ? parseFloat(catBudget) : null,
        });
        setEditingCat(null);
        setCatBudget('');
        toast.success('Presupuesto actualizado');
    };

    const handleDeleteAccount = () => {
        if (confirm('⚠️ ¿Estás seguro de que deseas eliminar tu cuenta? Esta acción eliminará todos tus datos y no se puede deshacer.')) {
            // Clear all localStorage
            localStorage.clear();
            supabase.auth.signOut().then(() => {
                logout();
                toast.success('Cuenta eliminada exitosamente');
            });
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Perfil</h1>
                    <p className="page-subtitle">Gestiona tu información personal y preferencias</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '960px' }}>
                {/* Personal Info */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
                        Información Personal
                    </h3>

                    {/* Avatar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div
                            style={{
                                width: '72px',
                                height: '72px',
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '28px',
                                fontWeight: 700,
                                color: 'white',
                            }}
                        >
                            {name.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                            <p style={{ fontWeight: 600, fontSize: '18px' }}>{name || 'Usuario'}</p>
                            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>{user?.email || 'email@example.com'}</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="input-group">
                            <label className="input-label">Nombre completo</label>
                            <input
                                type="text"
                                className="input"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                id="profile-name-input"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Correo electrónico</label>
                            <input
                                type="email"
                                className="input"
                                value={user?.email || ''}
                                disabled
                                style={{ opacity: 0.6 }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div className="input-group">
                                <label className="input-label">Moneda</label>
                                <select
                                    className="input"
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value as Currency)}
                                >
                                    <option value="COP">🇨🇴 COP - Peso Colombiano</option>
                                    <option value="USD">🇺🇸 USD - Dólar</option>
                                    <option value="EUR">🇪🇺 EUR - Euro</option>
                                </select>
                            </div>

                            <div className="input-group">
                                <label className="input-label">Ingreso mensual objetivo</label>
                                <input
                                    type="number"
                                    className="input font-mono"
                                    placeholder="0"
                                    value={monthlyTarget}
                                    onChange={(e) => setMonthlyTarget(e.target.value)}
                                />
                            </div>
                        </div>

                        <button className="btn btn-primary" onClick={handleSaveProfile} style={{ alignSelf: 'flex-start' }} id="save-profile-btn">
                            Guardar Cambios
                        </button>
                    </div>
                </div>

                {/* Categories / Budgets */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
                        Presupuestos por Categoría
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Establece límites de presupuesto para recibir alertas cuando los excedas.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {categories.map((cat) => (
                            <div
                                key={cat.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    borderRadius: 'var(--radius-lg)',
                                    background: 'var(--bg-secondary)',
                                }}
                            >
                                <div
                                    style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        background: `${cat.color}20`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '18px',
                                        flexShrink: 0,
                                    }}
                                >
                                    {cat.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontSize: '14px', fontWeight: 600 }}>{cat.name}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                        {cat.budget_limit
                                            ? `Presupuesto: ${formatCurrency(cat.budget_limit, currency)}`
                                            : 'Sin presupuesto definido'}
                                    </p>
                                </div>

                                {editingCat === cat.id ? (
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <input
                                            type="number"
                                            className="input font-mono"
                                            placeholder="Monto"
                                            value={catBudget}
                                            onChange={(e) => setCatBudget(e.target.value)}
                                            style={{ width: '120px', padding: '6px 10px', fontSize: '13px' }}
                                            autoFocus
                                        />
                                        <button className="btn btn-primary btn-sm" onClick={() => handleSaveBudget(cat.id)}>✓</button>
                                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditingCat(null); setCatBudget(''); }}>✕</button>
                                    </div>
                                ) : (
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => {
                                            setEditingCat(cat.id);
                                            setCatBudget(cat.budget_limit?.toString() || '');
                                        }}
                                    >
                                        ✏️
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', gridColumn: 'span 2' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px', color: 'var(--color-error)' }}>
                        Zona de Peligro
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Estas acciones son irreversibles. Procede con precaución.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            className="btn btn-danger"
                            onClick={handleDeleteAccount}
                            id="delete-account-btn"
                        >
                            🗑️ Eliminar Cuenta y Datos
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={async () => {
                                if (confirm('¿Cerrar sesión?')) {
                                    await supabase.auth.signOut();
                                    logout();
                                }
                            }}
                            id="logout-profile-btn"
                        >
                            ↗ Cerrar Sesión
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
        @media (max-width: 768px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
          div[style*="grid-column: span 2"] {
            grid-column: span 1 !important;
          }
        }
      `}</style>
        </div>
    );
}
