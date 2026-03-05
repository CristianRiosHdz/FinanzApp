// Types for the application

export interface Profile {
    id: string;
    full_name: string;
    avatar_url: string | null;
    currency: string;
    monthly_income_target: number | null;
    created_at: string;
    updated_at: string;
}

export interface Income {
    id: string;
    user_id: string;
    amount: number;
    description: string;
    date: string;
    is_recurring: boolean;
    category: 'salario' | 'freelance' | 'otros';
    created_at: string;
}

export interface ExpenseCategory {
    id: string;
    user_id: string;
    name: string;
    icon: string;
    color: string;
    budget_limit: number | null;
    created_at: string;
}

export interface Expense {
    id: string;
    user_id: string;
    category_id: string;
    category?: ExpenseCategory;
    amount: number;
    description: string;
    date: string;
    is_recurring: boolean;
    payment_method: 'efectivo' | 'tarjeta' | 'transferencia';
    notes: string | null;
    receipt_url: string | null;
    created_at: string;
}

export interface SavingsGoal {
    id: string;
    user_id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    deadline: string | null;
    icon: string;
    color: string;
    created_at: string;
}

export interface MonthlyStats {
    totalIncome: number;
    totalExpenses: number;
    available: number;
    savingsPercentage: number;
    previousMonthSavings: number;
}

export type Currency = 'COP' | 'USD' | 'EUR';

export const DEFAULT_CATEGORIES: Omit<ExpenseCategory, 'id' | 'user_id' | 'created_at'>[] = [
    { name: 'Arriendo', icon: '🏠', color: '#6366f1', budget_limit: null },
    { name: 'Servicios', icon: '⚡', color: '#f59e0b', budget_limit: null },
    { name: 'Comida', icon: '🥩', color: '#ef4444', budget_limit: null },
    { name: 'Salud', icon: '💊', color: '#10b981', budget_limit: null },
    { name: 'Transporte', icon: '🚗', color: '#3b82f6', budget_limit: null },
    { name: 'Deudas', icon: '💰', color: '#8b5cf6', budget_limit: null },
    { name: 'Entretenimiento', icon: '🎬', color: '#ec4899', budget_limit: null },
    { name: 'Otros', icon: '📦', color: '#6b7280', budget_limit: null },
];

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
    COP: '$',
    USD: '$',
    EUR: '€',
};

export const CURRENCY_LOCALE: Record<Currency, string> = {
    COP: 'es-CO',
    USD: 'en-US',
    EUR: 'de-DE',
};
