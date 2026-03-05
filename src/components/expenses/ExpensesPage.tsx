'use client';

import { useState, useMemo } from 'react';
import { useAuthStore, useExpenseStore, useCategoryStore } from '@/lib/store';
import { Expense, Currency } from '@/lib/types';
import { formatCurrency, formatDate, getCurrentMonthYear, getMonthYearLabel, getTodayISO } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function ExpensesPage() {
    const { user, profile } = useAuthStore();
    const { expenses, addExpense, updateExpense, deleteExpense, getTotalMonthlyExpenses } = useExpenseStore();
    const userId = user?.id || '';
    const { categories } = useCategoryStore();
    const currency = (profile?.currency || 'COP') as Currency;

    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterPayment, setFilterPayment] = useState<string>('all');
    const { year: currentYear, month: currentMonth } = getCurrentMonthYear();
    const [filterYear, setFilterYear] = useState(currentYear);
    const [filterMonth, setFilterMonth] = useState(currentMonth);

    // Form state
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [date, setDate] = useState(getTodayISO());
    const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'transferencia'>('efectivo');
    const [isRecurring, setIsRecurring] = useState(false);
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // userId is now defined at the top from the hook

    const filteredExpenses = useMemo(() => {
        return expenses
            .filter((exp) => {
                const d = new Date(exp.date);
                const matchMonth = d.getFullYear() === filterYear && d.getMonth() === filterMonth;
                const matchSearch = exp.description.toLowerCase().includes(searchTerm.toLowerCase());
                const matchCategory = filterCategory === 'all' || exp.category_id === filterCategory;
                const matchPayment = filterPayment === 'all' || exp.payment_method === filterPayment;
                return matchMonth && matchSearch && matchCategory && matchPayment;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [expenses, filterYear, filterMonth, searchTerm, filterCategory, filterPayment]);

    const monthlyTotal = getTotalMonthlyExpenses(filterYear, filterMonth);

    // Category totals for sidebar
    const categoryTotals = useMemo(() => {
        const totals: Record<string, number> = {};
        filteredExpenses.forEach((exp) => {
            totals[exp.category_id] = (totals[exp.category_id] || 0) + exp.amount;
        });
        return totals;
    }, [filteredExpenses]);

    const resetForm = () => {
        setAmount('');
        setDescription('');
        setCategoryId(categories[0]?.id || '');
        setDate(getTodayISO());
        setPaymentMethod('efectivo');
        setIsRecurring(false);
        setNotes('');
        setEditingExpense(null);
    };

    const openAdd = () => {
        resetForm();
        setShowModal(true);
    };

    const openEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setAmount(expense.amount.toString());
        setDescription(expense.description);
        setCategoryId(expense.category_id);
        setDate(expense.date);
        setPaymentMethod(expense.payment_method);
        setIsRecurring(expense.is_recurring);
        setNotes(expense.notes || '');
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitting) return;

        if (!amount || parseFloat(amount) <= 0) {
            toast.error('Ingresa un monto válido');
            return;
        }
        if (!description || description.length < 3) {
            toast.error('La descripción debe tener al menos 3 caracteres');
            return;
        }

        const currentCategoryId = categoryId || categories[0]?.id;
        if (!currentCategoryId) {
            toast.error('Selecciona una categoría');
            return;
        }

        setIsSubmitting(true);
        const loadingToast = toast.loading(editingExpense ? 'Actualizando...' : 'Registrando...');

        try {
            if (!userId) {
                throw new Error('Sesión no encontrada. Por favor, recarga la página.');
            }

            if (editingExpense) {
                await updateExpense(editingExpense.id, {
                    amount: parseFloat(amount),
                    description,
                    category_id: currentCategoryId,
                    date,
                    payment_method: paymentMethod,
                    is_recurring: isRecurring,
                    notes: notes || null,
                });
                toast.success('Gasto actualizado', { id: loadingToast });
            } else {
                await addExpense({
                    user_id: userId,
                    amount: parseFloat(amount),
                    description,
                    category_id: currentCategoryId,
                    date,
                    payment_method: paymentMethod,
                    is_recurring: isRecurring,
                    notes: notes || null,
                    receipt_url: null,
                });
                toast.success('Gasto registrado', { id: loadingToast });
            }
            setShowModal(false);
            resetForm();
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(`Error: ${error.message || 'No se pudo guardar'}`, { id: loadingToast });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de eliminar este gasto?')) {
            deleteExpense(id);
            toast.success('Gasto eliminado');
        }
    };

    const handleDuplicate = (expense: Expense) => {
        addExpense({
            user_id: expense.user_id,
            amount: expense.amount,
            description: expense.description,
            category_id: expense.category_id,
            date: getTodayISO(),
            payment_method: expense.payment_method,
            is_recurring: expense.is_recurring,
            notes: expense.notes,
            receipt_url: null,
        });
        toast.success('Gasto duplicado');
    };

    const paymentLabels: Record<string, string> = {
        efectivo: '💵 Efectivo',
        tarjeta: '💳 Tarjeta',
        transferencia: '🏦 Transferencia',
    };

    const getCat = (id: string) => categories.find((c) => c.id === id);

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Gastos</h1>
                    <p className="page-subtitle">{getMonthYearLabel(filterYear, filterMonth)}</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd} id="add-expense-modal-btn">
                    + Nuevo Gasto
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <div className="card stat-card-expense">
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Total del Mes</p>
                    <p className="font-mono" style={{ fontSize: '28px', fontWeight: 700, color: 'var(--color-error)', marginTop: '4px' }}>
                        {formatCurrency(monthlyTotal, currency)}
                    </p>
                </div>

                {/* Category breakdown */}
                {categories.slice(0, 3).filter(c => categoryTotals[c.id]).map((cat) => (
                    <div className="card" key={cat.id} style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <span style={{ fontSize: '18px' }}>{cat.icon}</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>{cat.name}</span>
                        </div>
                        <p className="font-mono" style={{ fontSize: '18px', fontWeight: 700 }}>
                            {formatCurrency(categoryTotals[cat.id] || 0, currency)}
                        </p>
                        {cat.budget_limit && (
                            <div style={{ marginTop: '8px' }}>
                                <div className="progress-bar" style={{ height: '4px' }}>
                                    <div className="progress-fill" style={{
                                        width: `${Math.min(((categoryTotals[cat.id] || 0) / cat.budget_limit) * 100, 100)}%`,
                                        background: (categoryTotals[cat.id] || 0) > cat.budget_limit ? 'var(--color-error)' : cat.color,
                                    }} />
                                </div>
                                <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                    de {formatCurrency(cat.budget_limit, currency)}
                                </p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="filter-row">
                <input
                    type="text"
                    className="input"
                    placeholder="🔍 Buscar..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ flex: 1, minWidth: '160px' }}
                    id="search-expenses-input"
                />
                <select className="input" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ width: '160px' }}>
                    <option value="all">Categoría</option>
                    {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                    ))}
                </select>
                <select className="input" value={filterPayment} onChange={(e) => setFilterPayment(e.target.value)} style={{ width: '160px' }}>
                    <option value="all">Método de pago</option>
                    <option value="efectivo">💵 Efectivo</option>
                    <option value="tarjeta">💳 Tarjeta</option>
                    <option value="transferencia">🏦 Transferencia</option>
                </select>
                <select className="input" value={filterMonth} onChange={(e) => setFilterMonth(parseInt(e.target.value))} style={{ width: '140px' }}>
                    {Array.from({ length: 12 }, (_, i) => (
                        <option key={i} value={i}>{new Date(2024, i).toLocaleDateString('es-CO', { month: 'long' })}</option>
                    ))}
                </select>
                <select className="input" value={filterYear} onChange={(e) => setFilterYear(parseInt(e.target.value))} style={{ width: '100px' }}>
                    {[2024, 2025, 2026, 2027].map((y) => (<option key={y} value={y}>{y}</option>))}
                </select>
            </div>

            {/* List */}
            {filteredExpenses.length > 0 ? (
                <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Gasto</th>
                                <th>Categoría</th>
                                <th>Método</th>
                                <th>Fecha</th>
                                <th style={{ textAlign: 'right' }}>Monto</th>
                                <th style={{ textAlign: 'right' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredExpenses.map((expense) => {
                                const cat = getCat(expense.category_id);
                                return (
                                    <tr key={expense.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '10px',
                                                    background: cat?.color ? `${cat.color}20` : 'var(--bg-tertiary)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '18px', flexShrink: 0,
                                                }}>
                                                    {cat?.icon || '📦'}
                                                </div>
                                                <div>
                                                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{expense.description}</span>
                                                    {expense.is_recurring && (
                                                        <span className="badge badge-accent" style={{ fontSize: '10px', marginLeft: '6px' }}>🔄</span>
                                                    )}
                                                    {expense.notes && (
                                                        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                                            {expense.notes}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className="tag">{cat?.name || 'Sin categoría'}</span></td>
                                        <td><span className="tag">{paymentLabels[expense.payment_method]}</span></td>
                                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{formatDate(expense.date)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                            <span className="font-mono amount-negative" style={{ fontWeight: 600 }}>
                                                -{formatCurrency(expense.amount, currency)}
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '2px', justifyContent: 'flex-end' }}>
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(expense)} title="Editar">✏️</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDuplicate(expense)} title="Duplicar">📋</button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(expense.id)} title="Eliminar">🗑️</button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="card empty-state">
                    <div className="empty-state-icon">💳</div>
                    <p className="empty-state-title">No hay gastos registrados</p>
                    <p className="empty-state-text">
                        {searchTerm || filterCategory !== 'all' || filterPayment !== 'all'
                            ? 'No se encontraron gastos con los filtros seleccionados'
                            : 'Registra tu primer gasto para comenzar el seguimiento'}
                    </p>
                    {!searchTerm && filterCategory === 'all' && (
                        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={openAdd}>
                            + Registrar Gasto
                        </button>
                    )}
                </div>
            )}

            {/* FAB for mobile */}
            <button className="fab" onClick={openAdd} aria-label="Nuevo gasto">
                <svg width="24" height="24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                </svg>
            </button>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingExpense ? 'Editar Gasto' : 'Nuevo Gasto'}</h2>
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
                                        id="expense-amount-input"
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Descripción *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Ej: Almuerzo ejecutivo"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        id="expense-description-input"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="input-group">
                                        <label className="input-label">Categoría *</label>
                                        <select
                                            className="input"
                                            value={categoryId}
                                            onChange={(e) => setCategoryId(e.target.value)}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {categories.map((cat) => (
                                                <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">Fecha *</label>
                                        <input
                                            type="date"
                                            className="input"
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Método de Pago</label>
                                    <select
                                        className="input"
                                        value={paymentMethod}
                                        onChange={(e) => setPaymentMethod(e.target.value as 'efectivo' | 'tarjeta' | 'transferencia')}
                                    >
                                        <option value="efectivo">💵 Efectivo</option>
                                        <option value="tarjeta">💳 Tarjeta</option>
                                        <option value="transferencia">🏦 Transferencia</option>
                                    </select>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Notas (opcional)</label>
                                    <textarea
                                        className="input"
                                        placeholder="Notas adicionales..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={2}
                                    />
                                </div>

                                <label className="checkbox-wrapper">
                                    <input
                                        type="checkbox"
                                        className="checkbox"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                    />
                                    <span style={{ fontSize: '14px' }}>Es gasto recurrente</span>
                                </label>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" id="save-expense-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Guardando...' : (editingExpense ? 'Guardar Cambios' : 'Registrar Gasto')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
