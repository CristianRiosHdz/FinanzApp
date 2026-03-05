'use client';

import { useState, useMemo } from 'react';
import { useAuthStore, useIncomeStore } from '@/lib/store';
import { Income, Currency } from '@/lib/types';
import { formatCurrency, formatDate, getCurrentMonthYear, getMonthYearLabel, getTodayISO } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function IncomesPage() {
    const { profile } = useAuthStore();
    const { incomes, addIncome, updateIncome, deleteIncome, getTotalMonthlyIncome } = useIncomeStore();
    const currency = (profile?.currency || 'COP') as Currency;

    const [showModal, setShowModal] = useState(false);
    const [editingIncome, setEditingIncome] = useState<Income | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { year: currentYear, month: currentMonth } = getCurrentMonthYear();
    const [filterYear, setFilterYear] = useState(currentYear);
    const [filterMonth, setFilterMonth] = useState(currentMonth);

    // Form state
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(getTodayISO());
    const [isRecurring, setIsRecurring] = useState(false);
    const [category, setCategory] = useState<'salario' | 'freelance' | 'otros'>('salario');

    const userId = useAuthStore.getState().user?.id || '';

    const filteredIncomes = useMemo(() => {
        return incomes
            .filter((inc) => {
                const d = new Date(inc.date);
                const matchMonth = d.getFullYear() === filterYear && d.getMonth() === filterMonth;
                const matchSearch = inc.description.toLowerCase().includes(searchTerm.toLowerCase());
                return matchMonth && matchSearch;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [incomes, filterYear, filterMonth, searchTerm]);

    const monthlyTotal = getTotalMonthlyIncome(filterYear, filterMonth);

    const resetForm = () => {
        setAmount('');
        setDescription('');
        setDate(getTodayISO());
        setIsRecurring(false);
        setCategory('salario');
        setEditingIncome(null);
    };

    const openAdd = () => {
        resetForm();
        setShowModal(true);
    };

    const openEdit = (income: Income) => {
        setEditingIncome(income);
        setAmount(income.amount.toString());
        setDescription(income.description);
        setDate(income.date);
        setIsRecurring(income.is_recurring);
        setCategory(income.category);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Ingresa un monto válido');
            return;
        }
        if (!description || description.length < 3) {
            toast.error('La descripción debe tener al menos 3 caracteres');
            return;
        }

        try {
            if (editingIncome) {
                await updateIncome(editingIncome.id, {
                    amount: parseFloat(amount),
                    description,
                    date,
                    is_recurring: isRecurring,
                    category,
                });
                toast.success('Ingreso actualizado');
            } else {
                await addIncome({
                    user_id: userId,
                    amount: parseFloat(amount),
                    description,
                    date,
                    is_recurring: isRecurring,
                    category,
                });
                toast.success('Ingreso registrado');
            }
            setShowModal(false);
            resetForm();
        } catch (error) {
            toast.error('Error al guardar el ingreso');
            console.error(error);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este ingreso?')) {
            deleteIncome(id);
            toast.success('Ingreso eliminado');
        }
    };

    const categoryLabels: Record<string, string> = {
        salario: '💼 Salario',
        freelance: '💻 Freelance',
        otros: '📦 Otros',
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Ingresos</h1>
                    <p className="page-subtitle">{getMonthYearLabel(filterYear, filterMonth)}</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd} id="add-income-modal-btn">
                    + Nuevo Ingreso
                </button>
            </div>

            {/* Stats */}
            <div className="card stat-card-income" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            Total de Ingresos del Mes
                        </p>
                        <p className="font-mono" style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-success)', marginTop: '4px' }}>
                            {formatCurrency(monthlyTotal, currency)}
                        </p>
                    </div>
                    <span style={{ fontSize: '40px' }}>💵</span>
                </div>
            </div>

            {/* Filters */}
            <div className="filter-row">
                <input
                    type="text"
                    className="input"
                    placeholder="🔍 Buscar por descripción..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, minWidth: '200px' }}
                    id="search-incomes-input"
                />
                <select
                    className="input"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(parseInt(e.target.value))}
                    style={{ width: '160px' }}
                >
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>
                            {new Date(2024, i).toLocaleDateString('es-CO', { month: 'long' })}
                        </option>
                    ))}
                </select>
                <select
                    className="input"
                    value={filterYear}
                    onChange={(e) => setFilterYear(parseInt(e.target.value))}
                    style={{ width: '120px' }}
                >
                    {[2024, 2025, 2026, 2027].map((y) => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </select>
            </div>

            {/* List */}
            {filteredIncomes.length > 0 ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Descripción</th>
                                <th>Categoría</th>
                                <th>Fecha</th>
                                <th style={{ textAlign: 'right' }}>Monto</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredIncomes.map((income) => (
                                <tr key={income.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 600 }}>{income.description}</span>
                                            {income.is_recurring && (
                                                <span className="badge badge-accent" style={{ fontSize: '10px' }}>
                                                    🔄 Recurrente
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <span className="tag">{categoryLabels[income.category] || income.category}</span>
                                    </td>
                                    <td style={{ color: 'var(--text-secondary)' }}>{formatDate(income.date)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <span className="font-mono amount-positive" style={{ fontWeight: 600 }}>
                                            +{formatCurrency(income.amount, currency)}
                                        </span>
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(income)}>✏️</button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(income.id)}>🗑️</button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card empty-state">
                    <div className="empty-state-icon">💵</div>
                    <p className="empty-state-title">No hay ingresos registrados</p>
                    <p className="empty-state-text">
                        {searchTerm
                            ? 'No se encontraron resultados para tu búsqueda'
                            : 'Comienza registrando tus ingresos del mes'}
                    </p>
                    {!searchTerm && (
                        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={openAdd}>
                            + Registrar Ingreso
                        </button>
                    )}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingIncome ? 'Editar Ingreso' : 'Nuevo Ingreso'}</h2>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Monto *</label>
                                    <input
                                        type="number"
                                        className="input font-mono"
                                        placeholder="0"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        min="0"
                                        step="any"
                                        autoFocus
                                        id="income-amount-input"
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Descripción *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Ej: Salario mensual"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        id="income-description-input"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="input-group">
                                        <label className="input-label">Fecha *</label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Categoría</label>
                                        <select
                                            className="input"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value as 'salario' | 'freelance' | 'otros')}
                                        >
                                            <option value="salario">💼 Salario</option>
                                            <option value="freelance">💻 Freelance</option>
                                            <option value="otros">📦 Otros</option>
                                        </select>
                                    </div>
                                </div>

                                <label className="checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        className="checkbox"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                    />
                                    <span style={{ fontSize: '14px' }}>Es ingreso recurrente</span>
                                </label>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" id="save-income-btn">
                                    {editingIncome ? 'Guardar Cambios' : 'Registrar Ingreso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
