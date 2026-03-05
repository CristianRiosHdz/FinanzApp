'use client';

import { useMemo } from 'react';
import { useAuthStore, useIncomeStore, useExpenseStore, useCategoryStore, useSavingsStore } from '@/lib/store';
import { formatCurrency, getCurrentMonthYear, getMonthYearLabel, calculatePercentage } from '@/lib/utils';
import { Currency } from '@/lib/types';
import { PageKey } from '../layout/AppShell';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    LineChart, Line, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from 'recharts';

interface DashboardProps {
    onNavigate: (page: PageKey) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
    const { profile } = useAuthStore();
    const { incomes, getTotalMonthlyIncome } = useIncomeStore();
    const { expenses, getTotalMonthlyExpenses } = useExpenseStore();
    const { categories } = useCategoryStore();
    const { goals } = useSavingsStore();

    const { year, month } = getCurrentMonthYear();
    const currency = (profile?.currency || 'COP') as Currency;

    const totalIncome = getTotalMonthlyIncome(year, month);
    const totalExpenses = getTotalMonthlyExpenses(year, month);
    const available = totalIncome - totalExpenses;
    const savingsPercentage = calculatePercentage(available, totalIncome);

    // Previous month savings
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevIncome = getTotalMonthlyIncome(prevYear, prevMonth);
    const prevExpenses = getTotalMonthlyExpenses(prevYear, prevMonth);
    const prevSavings = prevIncome > 0 ? calculatePercentage(prevIncome - prevExpenses, prevIncome) : 0;
    const savingsTrend = savingsPercentage - prevSavings;

    // Pie chart data
    const categoryExpenses = useMemo(() => {
        const totals: Record<string, number> = {};
        expenses.forEach((exp) => {
            const d = new Date(exp.date);
            if (d.getFullYear() === year && d.getMonth() === month) {
                totals[exp.category_id] = (totals[exp.category_id] || 0) + exp.amount;
            }
        });
        return totals;
    }, [expenses, year, month]);

    const pieData = useMemo(() => {
        return categories
            .filter((cat) => categoryExpenses[cat.id] > 0)
            .map((cat) => ({
                name: cat.name,
                value: categoryExpenses[cat.id],
                icon: cat.icon,
                color: cat.color,
            }));
    }, [categories, categoryExpenses]);

    // Trend data (last 6 months)
    const trendData = useMemo(() => {
        const data = [];
        for (let i = 5; i >= 0; i--) {
            let m = month - i;
            let y = year;
            if (m < 0) {
                m += 12;
                y -= 1;
            }
            const inc = getTotalMonthlyIncome(y, m);
            const exp = getTotalMonthlyExpenses(y, m);
            data.push({
                name: new Date(y, m).toLocaleDateString('es-CO', { month: 'short' }),
                ingresos: inc,
                gastos: exp,
                ahorro: inc - exp,
            });
        }
        return data;
    }, [month, year, incomes, expenses, getTotalMonthlyIncome, getTotalMonthlyExpenses]);

    // Recent expenses
    const recentExpenses = useMemo(() => {
        return [...expenses]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5)
            .map((exp) => ({
                ...exp,
                category: categories.find((c) => c.id === exp.category_id),
            }));
    }, [expenses, categories]);

    // Alerts
    const alerts = useMemo(() => {
        const list: { type: 'warning' | 'error'; message: string }[] = [];

        if (totalIncome > 0 && totalExpenses > totalIncome * 0.8) {
            list.push({
                type: totalExpenses > totalIncome ? 'error' : 'warning',
                message:
                    totalExpenses > totalIncome
                        ? '⚠️ ¡Tus gastos superan tus ingresos este mes!'
                        : '⚠️ Has gastado más del 80% de tus ingresos',
            });
        }

        if (totalIncome > 0 && savingsPercentage < 20) {
            list.push({
                type: 'warning',
                message: '💡 Tu ahorro está por debajo del 20%. Revisa tus gastos.',
            });
        }

        // Budget alerts
        categories.forEach((cat) => {
            if (cat.budget_limit && categoryExpenses[cat.id] > cat.budget_limit) {
                list.push({
                    type: 'error',
                    message: `🚨 Has superado el presupuesto de ${cat.name}: ${formatCurrency(categoryExpenses[cat.id], currency)} / ${formatCurrency(cat.budget_limit, currency)}`,
                });
            }
        });

        return list;
    }, [totalIncome, totalExpenses, savingsPercentage, categories, categoryExpenses, currency]);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1 className="page-title">
                        {greeting()}, {profile?.full_name?.split(' ')[0] || 'Usuario'} 👋
                    </h1>
                    <p className="page-subtitle">
                        {getMonthYearLabel(year, month)} · Resumen financiero
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn btn-primary" onClick={() => onNavigate('expenses')} id="add-expense-btn">
                        + Nuevo Gasto
                    </button>
                    <button className="btn btn-secondary" onClick={() => onNavigate('incomes')} id="add-income-btn">
                        + Ingreso
                    </button>
                </div>
            </div>

            {/* Alerts */}
            {alerts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
                    {alerts.map((alert, i) => (
                        <div key={i} className={`alert alert-${alert.type}`}>
                            {alert.message}
                        </div>
                    ))}
                </div>
            )}

            {/* Stat Cards */}
            <div className="stat-grid">
                <div className="card stat-card-income animate-slide-up" style={{ animationDelay: '0ms' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Ingresos
                        </span>
                        <span style={{ fontSize: '24px' }}>💵</span>
                    </div>
                    <p className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-success)' }}>
                        {formatCurrency(totalIncome, currency)}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        Este mes
                    </p>
                </div>

                <div className="card stat-card-expense animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Gastos
                        </span>
                        <span style={{ fontSize: '24px' }}>💳</span>
                    </div>
                    <p className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-error)' }}>
                        {formatCurrency(totalExpenses, currency)}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        Este mes
                    </p>
                </div>

                <div className="card stat-card-available animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Disponible
                        </span>
                        <span style={{ fontSize: '24px' }}>💰</span>
                    </div>
                    <p className="font-mono" style={{
                        fontSize: '24px', fontWeight: 700,
                        color: available >= 0 ? 'var(--color-accent)' : 'var(--color-error)'
                    }}>
                        {formatCurrency(available, currency)}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                        Ingresos - Gastos
                    </p>
                </div>

                <div className="card stat-card-savings animate-slide-up" style={{ animationDelay: '300ms' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Ahorro
                        </span>
                        <span style={{ fontSize: '24px' }}>📈</span>
                    </div>
                    <p className="font-mono" style={{ fontSize: '24px', fontWeight: 700, color: '#8B5CF6' }}>
                        {savingsPercentage}%
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <span
                            className="badge"
                            style={{
                                background: savingsTrend >= 0 ? 'var(--color-success-light)' : 'var(--color-error-light)',
                                color: savingsTrend >= 0 ? 'var(--color-success)' : 'var(--color-error)',
                                fontSize: '11px',
                                padding: '2px 6px',
                            }}
                        >
                            {savingsTrend >= 0 ? '↑' : '↓'} {Math.abs(savingsTrend)}%
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>vs mes anterior</span>
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="chart-grid">
                {/* Pie Chart - Gastos por Categoría */}
                <div className="card animate-slide-up" style={{ animationDelay: '400ms' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
                        Gastos por Categoría
                    </h3>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={3}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(Number(value), currency)}
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        boxShadow: 'var(--shadow-lg)',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    formatter={(value: string) => (
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📊</div>
                            <p className="empty-state-title">Sin datos aún</p>
                            <p className="empty-state-text">Registra tus primeros gastos para ver la distribución</p>
                        </div>
                    )}
                </div>

                <div className="card animate-slide-up" style={{ animationDelay: '500ms', minHeight: '350px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
                        Tendencia Mensual
                    </h3>
                    {trendData.some((d) => d.ingresos > 0 || d.gastos > 0) ? (
                        <div style={{ width: '100%', height: '280px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => `$${value >= 1000 ? (value / 1000) + 'k' : value}`}
                                    />
                                    <Tooltip
                                        formatter={(value: any) => formatCurrency(Number(value), currency)}
                                        contentStyle={{
                                            background: 'var(--bg-card)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '12px',
                                            boxShadow: 'var(--shadow-lg)',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                    <Area type="monotone" dataKey="ingresos" stroke="#10B981" fill="url(#colorIngresos)" strokeWidth={3} dot={{ r: 4, fill: '#10B981' }} activeDot={{ r: 6 }} />
                                    <Area type="monotone" dataKey="gastos" stroke="#EF4444" fill="url(#colorGastos)" strokeWidth={3} dot={{ r: 4, fill: '#EF4444' }} activeDot={{ r: 6 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📈</div>
                            <p className="empty-state-title">Sin tendencia</p>
                            <p className="empty-state-text">Registra ingresos y gastos para ver la evolución</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {/* Recent Expenses */}
                <div className="card animate-slide-up" style={{ animationDelay: '600ms', gridColumn: recentExpenses.length === 0 ? 'span 2' : undefined }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Gastos Recientes</h3>
                        <button
                            className="btn btn-ghost btn-sm"
                            onClick={() => onNavigate('expenses')}
                            style={{ color: 'var(--color-accent)' }}
                        >
                            Ver todos →
                        </button>
                    </div>

                    {recentExpenses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {recentExpenses.map((exp) => (
                                <div
                                    key={exp.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '10px 12px',
                                        borderRadius: 'var(--radius-lg)',
                                        background: 'var(--bg-secondary)',
                                        transition: 'background 0.2s ease',
                                    }}
                                >
                                    <div
                                        style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '12px',
                                            background: exp.category?.color ? `${exp.category.color}20` : 'var(--bg-tertiary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            flexShrink: 0,
                                        }}
                                    >
                                        {exp.category?.icon || '📦'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '14px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {exp.description}
                                        </p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                            {exp.category?.name || 'Sin categoría'} · {new Date(exp.date + 'T00:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                                        </p>
                                    </div>
                                    <p className="font-mono" style={{ fontWeight: 600, color: 'var(--color-error)', fontSize: '14px', flexShrink: 0 }}>
                                        -{formatCurrency(exp.amount, currency)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state" style={{ padding: '32px 16px' }}>
                            <div className="empty-state-icon">💳</div>
                            <p className="empty-state-title">No hay gastos</p>
                            <p className="empty-state-text">Registra tu primer gasto para verlo aquí</p>
                            <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => onNavigate('expenses')}>
                                + Registrar Gasto
                            </button>
                        </div>
                    )}
                </div>

                {/* Savings Goals */}
                {goals.length > 0 && (
                    <div className="card animate-slide-up" style={{ animationDelay: '700ms' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Metas de Ahorro</h3>
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => onNavigate('goals')}
                                style={{ color: 'var(--color-accent)' }}
                            >
                                Ver todas →
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {goals.slice(0, 3).map((goal) => {
                                const progress = calculatePercentage(goal.current_amount, goal.target_amount);
                                return (
                                    <div key={goal.id}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '14px', fontWeight: 600 }}>
                                                {goal.icon} {goal.name}
                                            </span>
                                            <span className="font-mono" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                {progress}%
                                            </span>
                                        </div>
                                        <div className="progress-bar">
                                            <div
                                                className="progress-fill"
                                                style={{
                                                    width: `${Math.min(progress, 100)}%`,
                                                    background: `linear-gradient(90deg, ${goal.color}, ${goal.color}dd)`,
                                                }}
                                            />
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                                {formatCurrency(goal.current_amount, currency)}
                                            </span>
                                            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                                                {formatCurrency(goal.target_amount, currency)}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @media (max-width: 768px) {
          .chart-grid, div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
        </div>
    );
}
