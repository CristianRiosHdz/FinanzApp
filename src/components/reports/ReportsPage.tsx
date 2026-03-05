'use client';

import { useState, useMemo } from 'react';
import { useAuthStore, useIncomeStore, useExpenseStore, useCategoryStore } from '@/lib/store';
import { Currency } from '@/lib/types';
import { formatCurrency, getCurrentMonthYear, getMonthYearLabel, calculatePercentage } from '@/lib/utils';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
    PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import toast from 'react-hot-toast';

export default function ReportsPage() {
    const { profile } = useAuthStore();
    const { incomes, getTotalMonthlyIncome } = useIncomeStore();
    const { expenses, getTotalMonthlyExpenses } = useExpenseStore();
    const { categories } = useCategoryStore();
    const currency = (profile?.currency || 'COP') as Currency;

    const { year: currentYear, month: currentMonth } = getCurrentMonthYear();
    const [filterYear, setFilterYear] = useState(currentYear);
    const [filterMonth, setFilterMonth] = useState(currentMonth);

    const totalIncome = getTotalMonthlyIncome(filterYear, filterMonth);
    const totalExpenses = getTotalMonthlyExpenses(filterYear, filterMonth);
    const available = totalIncome - totalExpenses;
    const savingsRate = calculatePercentage(available, totalIncome);

    // Category breakdown
    const catExpenses = useMemo(() => {
        const totals: Record<string, number> = {};
        expenses.forEach((exp) => {
            const d = new Date(exp.date);
            if (d.getFullYear() === filterYear && d.getMonth() === filterMonth) {
                totals[exp.category_id] = (totals[exp.category_id] || 0) + exp.amount;
            }
        });
        return totals;
    }, [expenses, filterYear, filterMonth]);

    const categoryData = useMemo(() => {
        return categories
            .map((cat) => ({
                name: `${cat.icon} ${cat.name}`,
                value: catExpenses[cat.id] || 0,
                color: cat.color,
                percentage: calculatePercentage(catExpenses[cat.id] || 0, totalExpenses),
            }))
            .filter((d) => d.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [categories, catExpenses, totalExpenses]);

    // Monthly comparison (last 6 months)
    const comparisonData = useMemo(() => {
        const data = [];
        for (let i = 5; i >= 0; i--) {
            let m = filterMonth - i;
            let y = filterYear;
            if (m < 0) { m += 12; y -= 1; }
            data.push({
                name: new Date(y, m).toLocaleDateString('es-CO', { month: 'short' }),
                ingresos: getTotalMonthlyIncome(y, m),
                gastos: getTotalMonthlyExpenses(y, m),
                ahorro: getTotalMonthlyIncome(y, m) - getTotalMonthlyExpenses(y, m),
            });
        }
        return data;
    }, [filterYear, filterMonth, getTotalMonthlyIncome, getTotalMonthlyExpenses]);

    // Daily evolution for the month
    const dailyData = useMemo(() => {
        const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
        const data = [];
        let cumExpenses = 0;
        let cumIncome = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${filterYear}-${String(filterMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const dayExpenses = expenses
                .filter((e) => e.date === dateStr)
                .reduce((sum, e) => sum + e.amount, 0);
            const dayIncome = incomes
                .filter((i) => i.date === dateStr)
                .reduce((sum, i) => sum + i.amount, 0);
            cumExpenses += dayExpenses;
            cumIncome += dayIncome;
            data.push({
                day: d,
                gastos: cumExpenses,
                ingresos: cumIncome,
            });
        }
        return data;
    }, [filterYear, filterMonth, expenses, incomes]);

    // Export to CSV
    const exportCSV = () => {
        const monthExpenses = expenses.filter((e) => {
            const d = new Date(e.date);
            return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
        });
        const monthIncomes = incomes.filter((i) => {
            const d = new Date(i.date);
            return d.getFullYear() === filterYear && d.getMonth() === filterMonth;
        });

        let csv = 'Tipo,Descripción,Categoría,Monto,Fecha,Método de Pago\n';

        monthIncomes.forEach((i) => {
            csv += `Ingreso,"${i.description}",${i.category},${i.amount},${i.date},-\n`;
        });

        monthExpenses.forEach((e) => {
            const cat = categories.find((c) => c.id === e.category_id);
            csv += `Gasto,"${e.description}",${cat?.name || 'N/A'},${e.amount},${e.date},${e.payment_method}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `reporte_${filterYear}_${filterMonth + 1}.csv`;
        link.click();
        toast.success('Reporte exportado como CSV');
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Reportes</h1>
                    <p className="page-subtitle">{getMonthYearLabel(filterYear, filterMonth)}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <select className="input" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))} style={{ width: '150px' }}>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>{new Date(2024, i).toLocaleDateString('es-CO', { month: 'long' })}</option>
                        ))}
                    </select>
                    <select className="input" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))} style={{ width: '100px' }}>
                        {[2024, 2025, 2026, 2027].map((y) => (<option key={y} value={y}>{y}</option>))}
                    </select>
                    <button className="btn btn-primary" onClick={exportCSV} id="export-csv-btn">
                        📥 Exportar CSV
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="stat-grid">
                <div className="card stat-card-income">
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Ingresos
                    </p>
                    <p className="font-mono amount-positive" style={{ fontSize: '22px', fontWeight: 700 }}>
                        {formatCurrency(totalIncome, currency)}
                    </p>
                </div>
                <div className="card stat-card-expense">
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Gastos
                    </p>
                    <p className="font-mono amount-negative" style={{ fontSize: '22px', fontWeight: 700 }}>
                        {formatCurrency(totalExpenses, currency)}
                    </p>
                </div>
                <div className="card stat-card-available">
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Balance
                    </p>
                    <p className="font-mono" style={{ fontSize: '22px', fontWeight: 700, color: available >= 0 ? 'var(--color-accent)' : 'var(--color-error)' }}>
                        {formatCurrency(available, currency)}
                    </p>
                </div>
                <div className="card stat-card-savings">
                    <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        Tasa de Ahorro
                    </p>
                    <p className="font-mono" style={{ fontSize: '22px', fontWeight: 700, color: '#8B5CF6' }}>
                        {savingsRate}%
                    </p>
                </div>
            </div>

            <div className="chart-grid">
                {/* Bar Chart - Comparativa mensual */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
                        Comparativa Mensual
                    </h3>
                    {comparisonData.some((d) => d.ingresos > 0 || d.gastos > 0) ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={comparisonData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                                <XAxis dataKey="name" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                                <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(Number(value), currency)}
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                <Legend />
                                <Bar dataKey="ingresos" fill="#10B981" radius={[6, 6, 0, 0]} />
                                <Bar dataKey="gastos" fill="#EF4444" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">📊</div>
                            <p className="empty-state-text">Sin datos para mostrar</p>
                        </div>
                    )}
                </div>

                {/* Pie - Distribución */}
                <div className="card">
                    <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
                        Distribución de Gastos
                    </h3>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    innerRadius={50}
                                    dataKey="value"
                                    paddingAngle={3}
                                    stroke="none"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    formatter={(value: any) => formatCurrency(Number(value), currency)}
                                    contentStyle={{
                                        background: 'var(--bg-card)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: '12px',
                                        color: 'var(--text-primary)',
                                    }}
                                />
                                <Legend formatter={(value: string) => (
                                    <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{value}</span>
                                )} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-state-icon">🥧</div>
                            <p className="empty-state-text">Sin gastos registrados</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Daily Evolution */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
                    Evolución Diaria del Mes
                </h3>
                {dailyData.some((d) => d.gastos > 0 || d.ingresos > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={dailyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                            <XAxis dataKey="day" tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                            <YAxis tick={{ fill: 'var(--text-tertiary)', fontSize: 12 }} />
                            <Tooltip
                                formatter={(value: any) => formatCurrency(Number(value), currency)}
                                contentStyle={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    color: 'var(--text-primary)',
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="ingresos" stroke="#10B981" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="gastos" stroke="#EF4444" strokeWidth={2} dot={false} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon">📈</div>
                        <p className="empty-state-text">Sin datos para este mes</p>
                    </div>
                )}
            </div>

            {/* Category Breakdown Table */}
            {categoryData.length > 0 && (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '20px 24px 12px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 700 }}>Desglose por Categoría</h3>
                    </div>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Categoría</th>
                                <th style={{ textAlign: 'right' }}>Monto</th>
                                <th style={{ textAlign: 'right' }}>Porcentaje</th>
                                <th>Distribución</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categoryData.map((cat, i) => (
                                <tr key={i}>
                                    <td style={{ fontWeight: 600 }}>{cat.name}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="font-mono" style={{ fontWeight: 600 }}>
                                            {formatCurrency(cat.value, currency)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="badge" style={{ background: `${cat.color}20`, color: cat.color }}>
                                            {cat.percentage}%
                                        </span>
                                    </td>
                                    <td>
                                        <div className="progress-bar" style={{ height: '6px', maxWidth: '200px' }}>
                                            <div className="progress-fill" style={{ width: `${cat.percentage}%`, background: cat.color }} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
