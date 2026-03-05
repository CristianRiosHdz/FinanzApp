'use client';

import { useState } from 'react';
import { useAuthStore, useSavingsStore } from '@/lib/store';
import { SavingsGoal, Currency } from '@/lib/types';
import { formatCurrency, calculatePercentage, getDaysRemaining, getTodayISO } from '@/lib/utils';
import toast from 'react-hot-toast';

const GOAL_ICONS = ['🎯', '🏠', '🚗', '✈️', '💻', '📱', '🎓', '💍', '🏥', '🛍️', '🎮', '📚'];
const GOAL_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export default function GoalsPage() {
    const { user, profile } = useAuthStore();
    const { goals, addGoal, updateGoal, deleteGoal, contributeToGoal } = useSavingsStore();
    const currency = (profile?.currency || 'COP') as Currency;
    const userId = user?.id || '';

    const [showModal, setShowModal] = useState(false);
    const [showContribute, setShowContribute] = useState<string | null>(null);
    const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null);
    const [contributeAmount, setContributeAmount] = useState('');

    // Form
    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [currentAmount, setCurrentAmount] = useState('0');
    const [deadline, setDeadline] = useState('');
    const [icon, setIcon] = useState('🎯');
    const [color, setColor] = useState('#3B82F6');

    const resetForm = () => {
        setName('');
        setTargetAmount('');
        setCurrentAmount('0');
        setDeadline('');
        setIcon('🎯');
        setColor('#3B82F6');
        setEditingGoal(null);
    };

    const openAdd = () => {
        resetForm();
        setShowModal(true);
    };

    const openEdit = (goal: SavingsGoal) => {
        setEditingGoal(goal);
        setName(goal.name);
        setTargetAmount(goal.target_amount.toString());
        setCurrentAmount(goal.current_amount.toString());
        setDeadline(goal.deadline || '');
        setIcon(goal.icon);
        setColor(goal.color);
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name) { toast.error('Ingresa el nombre de la meta'); return; }
        if (!targetAmount || parseFloat(targetAmount) <= 0) { toast.error('Ingresa un monto válido'); return; }

        try {
            if (!userId) {
                toast.error('Sesión no encontrada. Por favor, inicia sesión de nuevo.');
                return;
            }

            if (editingGoal) {
                await updateGoal(editingGoal.id, {
                    name,
                    target_amount: parseFloat(targetAmount),
                    current_amount: parseFloat(currentAmount),
                    deadline: deadline || null,
                    icon,
                    color,
                });
                toast.success('Meta actualizada');
            } else {
                await addGoal({
                    user_id: userId,
                    name,
                    target_amount: parseFloat(targetAmount),
                    current_amount: parseFloat(currentAmount),
                    deadline: deadline || null,
                    icon,
                    color,
                });
                toast.success('Meta creada');
            }
            setShowModal(false);
            resetForm();
        } catch (error: any) {
            console.error('Error guardando meta:', error);
            toast.error(`Error: ${error.message || 'No se pudo guardar la meta'}`);
        }
    };

    const handleContribute = async (goalId: string) => {
        if (!contributeAmount || parseFloat(contributeAmount) <= 0) {
            toast.error('Ingresa un monto válido');
            return;
        }
        try {
            await contributeToGoal(goalId, parseFloat(contributeAmount));
            toast.success(`Aporte de ${formatCurrency(parseFloat(contributeAmount), currency)} registrado`);
            setShowContribute(null);
            setContributeAmount('');
        } catch (error: any) {
            toast.error('Error al registrar el aporte');
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta meta?')) {
            deleteGoal(id);
            toast.success('Meta eliminada');
        }
    };

    return (
        <div className="animate-fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Metas de Ahorro</h1>
                    <p className="page-subtitle">Establece y sigue tus objetivos financieros</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd} id="add-goal-btn">
                    + Nueva Meta
                </button>
            </div>

            {goals.length > 0 ? (
                <div className="goals-grid">
                    {goals.map((goal) => {
                        const progress = calculatePercentage(goal.current_amount, goal.target_amount);
                        const remaining = goal.target_amount - goal.current_amount;
                        const daysLeft = goal.deadline ? getDaysRemaining(goal.deadline) : null;
                        const monthlySuggestion = daysLeft && daysLeft > 0 && remaining > 0
                            ? remaining / Math.ceil(daysLeft / 30)
                            : null;
                        const isCompleted = goal.current_amount >= goal.target_amount;

                        return (
                            <div
                                key={goal.id}
                                className="card animate-scale-in"
                                style={{
                                    border: `1px solid ${goal.color}30`,
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}
                            >
                                {/* Colored bar */}
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '4px',
                                    background: `linear-gradient(90deg, ${goal.color}, ${goal.color}88)`,
                                }} />

                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '44px', height: '44px', borderRadius: '12px',
                                            background: `${goal.color}20`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '22px',
                                        }}>
                                            {goal.icon}
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '16px', fontWeight: 700 }}>{goal.name}</h3>
                                            {isCompleted && (
                                                <span className="badge badge-success" style={{ fontSize: '10px' }}>
                                                    ✅ ¡Meta cumplida!
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '2px' }}>
                                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => openEdit(goal)}>✏️</button>
                                        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => handleDelete(goal.id)}>🗑️</button>
                                    </div>
                                </div>

                                {/* Progress */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <span className="font-mono" style={{ fontWeight: 700, fontSize: '18px' }}>
                                            {formatCurrency(goal.current_amount, currency)}
                                        </span>
                                        <span className="font-mono" style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            {progress}%
                                        </span>
                                    </div>
                                    <div className="progress-bar" style={{ height: '10px' }}>
                                        <div className="progress-fill" style={{
                                            width: `${Math.min(progress, 100)}%`,
                                            background: isCompleted
                                                ? 'linear-gradient(90deg, #10B981, #34D399)'
                                                : `linear-gradient(90deg, ${goal.color}, ${goal.color}bb)`,
                                        }} />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                            {remaining > 0 ? `Faltan ${formatCurrency(remaining, currency)}` : 'Meta alcanzada'}
                                        </span>
                                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                                            Meta: {formatCurrency(goal.target_amount, currency)}
                                        </span>
                                    </div>
                                </div>

                                {/* Info */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    {daysLeft !== null && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '14px' }}>⏰</span>
                                            <span style={{
                                                fontSize: '13px',
                                                color: daysLeft < 30 ? 'var(--color-warning)' : 'var(--text-secondary)'
                                            }}>
                                                {daysLeft > 0 ? `${daysLeft} días restantes` : 'Plazo vencido'}
                                            </span>
                                        </div>
                                    )}
                                    {monthlySuggestion && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontSize: '14px' }}>💡</span>
                                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                Ahorra {formatCurrency(monthlySuggestion, currency)}/mes
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Contribute button */}
                                {!isCompleted && (
                                    <>
                                        {showContribute === goal.id ? (
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <input
                                                    type="number"
                                                    className="input font-mono"
                                                    placeholder="Monto"
                                                    value={contributeAmount}
                                                    onChange={(e) => setContributeAmount(e.target.value)}
                                                    style={{ flex: 1 }}
                                                    autoFocus
                                                />
                                                <button className="btn btn-primary btn-sm" onClick={() => handleContribute(goal.id)}>
                                                    ✓
                                                </button>
                                                <button className="btn btn-secondary btn-sm" onClick={() => { setShowContribute(null); setContributeAmount(''); }}>
                                                    ✕
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                className="btn btn-secondary"
                                                style={{ width: '100%' }}
                                                onClick={() => setShowContribute(goal.id)}
                                            >
                                                + Aportar a esta meta
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="card empty-state">
                    <div className="empty-state-icon animate-float">🎯</div>
                    <p className="empty-state-title">No tienes metas de ahorro</p>
                    <p className="empty-state-text">
                        Crea tu primera meta y comienza a ahorrar para lo que más deseas
                    </p>
                    <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={openAdd}>
                        + Crear Meta
                    </button>
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">{editingGoal ? 'Editar Meta' : 'Nueva Meta de Ahorro'}</h2>
                            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label className="input-label">Nombre de la meta *</label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="Ej: Vacaciones en la playa"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoFocus
                                        id="goal-name-input"
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                    <div className="input-group">
                                        <label className="input-label">Monto objetivo *</label>
                                        <input
                                            type="number"
                                            className="input font-mono"
                                            placeholder="0"
                                            value={targetAmount}
                                            onChange={(e) => setTargetAmount(e.target.value)}
                                            min="0"
                                            step="any"
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Monto actual</label>
                                        <input
                                            type="number"
                                            className="input font-mono"
                                            placeholder="0"
                                            value={currentAmount}
                                            onChange={(e) => setCurrentAmount(e.target.value)}
                                            min="0"
                                            step="any"
                                        />
                                    </div>
                                </div>

                                <div className="input-group">
                                    <label className="input-label">Fecha límite (opcional)</label>
                                    <input
                                        type="date"
                                        className="input"
                                        value={deadline}
                                        onChange={(e) => setDeadline(e.target.value)}
                                    />
                                </div>

                                {/* Icon picker */}
                                <div className="input-group">
                                    <label className="input-label">Icono</label>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                        {GOAL_ICONS.map((ic) => (
                                            <button
                                                key={ic}
                                                type="button"
                                                onClick={() => setIcon(ic)}
                                                style={{
                                                    width: '40px', height: '40px', borderRadius: '10px',
                                                    border: icon === ic ? `2px solid ${color}` : '2px solid var(--border-color)',
                                                    background: icon === ic ? `${color}20` : 'var(--bg-tertiary)',
                                                    fontSize: '20px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                }}
                                            >
                                                {ic}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Color picker */}
                                <div className="input-group">
                                    <label className="input-label">Color</label>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        {GOAL_COLORS.map((c) => (
                                            <button
                                                key={c}
                                                type="button"
                                                onClick={() => setColor(c)}
                                                style={{
                                                    width: '32px', height: '32px', borderRadius: '50%',
                                                    background: c,
                                                    border: color === c ? '3px solid var(--text-primary)' : '3px solid transparent',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.15s ease',
                                                    outline: color === c ? `2px solid ${c}` : 'none',
                                                    outlineOffset: '2px',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" id="save-goal-btn">
                                    {editingGoal ? 'Guardar Cambios' : 'Crear Meta'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
