import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';
import {
    Profile,
    Income,
    Expense,
    ExpenseCategory,
    SavingsGoal,
    DEFAULT_CATEGORIES,
    Currency,
} from '@/lib/types';

// ============ AUTH STORE ============
interface AuthState {
    user: { id: string; email?: string } | null;
    profile: Profile | null;
    isAuthenticated: boolean;
    setUser: (user: { id: string; email?: string } | null) => void;
    setProfile: (profile: Profile | null) => void;
    logout: () => void;
    updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            profile: null,
            isAuthenticated: false,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setProfile: (profile) => set({ profile }),
            logout: () => {
                set({ user: null, profile: null, isAuthenticated: false });
                // Force clear all persisted storages
                localStorage.removeItem('auth-storage');
                localStorage.removeItem('categories-storage');
                localStorage.removeItem('incomes-storage');
                localStorage.removeItem('expenses-storage');
                localStorage.removeItem('savings-storage');
            },
            updateProfile: async (updates) => {
                const userId = useAuthStore.getState().user?.id;
                if (!userId) return;

                const { data, error } = await supabase
                    .from('profiles')
                    .update({ ...updates, updated_at: new Date().toISOString() })
                    .eq('id', userId)
                    .select()
                    .single();

                if (!error && data) {
                    set({ profile: data });
                }
            },
        }),
        { name: 'auth-storage' }
    )
);

// ============ CATEGORIES STORE ============
interface CategoryState {
    categories: ExpenseCategory[];
    loading: boolean;
    initializeCategories: (userId: string) => Promise<void>;
    addCategory: (category: Omit<ExpenseCategory, 'id' | 'created_at'>) => Promise<void>;
    updateCategory: (id: string, updates: Partial<ExpenseCategory>) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
}

export const useCategoryStore = create<CategoryState>()(
    persist(
        (set, get) => ({
            categories: [],
            loading: false,
            initializeCategories: async (userId: string) => {
                set({ loading: true });
                const { data, error } = await supabase
                    .from('expense_categories')
                    .select('*')
                    .eq('user_id', userId);

                if (!error && data && data.length > 0) {
                    set({ categories: data });
                } else if (!error && (!data || data.length === 0)) {
                    // Create defaults if none exist in Supabase
                    const defaultCategories = DEFAULT_CATEGORIES.map((cat) => ({
                        ...cat,
                        user_id: userId,
                    }));
                    const { data: created } = await supabase
                        .from('expense_categories')
                        .insert(defaultCategories)
                        .select();
                    if (created) set({ categories: created });
                }
                set({ loading: false });
            },
            addCategory: async (category) => {
                const { data } = await supabase
                    .from('expense_categories')
                    .insert([category])
                    .select()
                    .single();
                if (data) set((state) => ({ categories: [...state.categories, data] }));
            },
            updateCategory: async (id, updates) => {
                const { error } = await supabase.from('expense_categories').update(updates).eq('id', id);
                if (!error) {
                    set((state) => ({
                        categories: state.categories.map((cat) =>
                            cat.id === id ? { ...cat, ...updates } : cat
                        ),
                    }));
                }
            },
            deleteCategory: async (id) => {
                const { error } = await supabase.from('expense_categories').delete().eq('id', id);
                if (!error) {
                    set((state) => ({
                        categories: state.categories.filter((cat) => cat.id !== id),
                    }));
                }
            },
        }),
        { name: 'categories-storage' }
    )
);

// ============ INCOME STORE ============
interface IncomeState {
    incomes: Income[];
    loading: boolean;
    fetchIncomes: (userId: string) => Promise<void>;
    addIncome: (income: Omit<Income, 'id' | 'created_at'>) => Promise<void>;
    updateIncome: (id: string, updates: Partial<Income>) => Promise<void>;
    deleteIncome: (id: string) => Promise<void>;
    getTotalMonthlyIncome: (year: number, month: number) => number;
}

export const useIncomeStore = create<IncomeState>()(
    persist(
        (set, get) => ({
            incomes: [],
            loading: false,
            fetchIncomes: async (userId) => {
                set({ loading: true });
                const { data, error } = await supabase
                    .from('incomes')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: false });

                if (error) {
                    set({ loading: false });
                    throw error;
                }

                if (data) set({ incomes: data });
                set({ loading: false });
            },
            addIncome: async (income) => {
                const { data, error } = await supabase
                    .from('incomes')
                    .insert([income])
                    .select()
                    .single();
                if (error) throw error;
                if (data) {
                    set((state) => ({ incomes: [data, ...state.incomes] }));
                }
            },
            updateIncome: async (id, updates) => {
                const { error } = await supabase
                    .from('incomes')
                    .update(updates)
                    .eq('id', id);
                if (error) throw error;
                set((state) => ({
                    incomes: state.incomes.map((inc) =>
                        inc.id === id ? { ...inc, ...updates } : inc
                    ),
                }));
            },
            deleteIncome: async (id) => {
                const { error } = await supabase.from('incomes').delete().eq('id', id);
                if (error) throw error;
                set((state) => ({
                    incomes: state.incomes.filter((inc) => inc.id !== id),
                }));
            },
            getTotalMonthlyIncome: (year, month) => {
                return get().incomes
                    .filter((inc) => {
                        const d = new Date(inc.date);
                        return d.getFullYear() === year && d.getMonth() === month;
                    })
                    .reduce((sum, inc) => sum + inc.amount, 0);
            },
        }),
        { name: 'incomes-storage' }
    )
);

// ============ EXPENSE STORE ============
interface ExpenseState {
    expenses: Expense[];
    loading: boolean;
    fetchExpenses: (userId: string) => Promise<void>;
    addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => Promise<void>;
    updateExpense: (id: string, updates: Partial<Expense>) => Promise<void>;
    deleteExpense: (id: string) => Promise<void>;
    getTotalMonthlyExpenses: (year: number, month: number) => number;
}

export const useExpenseStore = create<ExpenseState>()(
    persist(
        (set, get) => ({
            expenses: [],
            loading: false,
            fetchExpenses: async (userId) => {
                set({ loading: true });
                const { data, error } = await supabase
                    .from('expenses')
                    .select('*')
                    .eq('user_id', userId)
                    .order('date', { ascending: false });

                if (error) {
                    set({ loading: false });
                    throw error;
                }

                if (data) set({ expenses: data });
                set({ loading: false });
            },
            addExpense: async (expense) => {
                const { data, error } = await supabase
                    .from('expenses')
                    .insert([expense])
                    .select()
                    .single();
                if (error) throw error;
                if (data) {
                    set((state) => ({ expenses: [data, ...state.expenses] }));
                }
            },
            updateExpense: async (id, updates) => {
                const { error } = await supabase
                    .from('expenses')
                    .update(updates)
                    .eq('id', id);
                if (error) throw error;
                set((state) => ({
                    expenses: state.expenses.map((exp) =>
                        exp.id === id ? { ...exp, ...updates } : exp
                    ),
                }));
            },
            deleteExpense: async (id) => {
                const { error } = await supabase.from('expenses').delete().eq('id', id);
                if (error) throw error;
                set((state) => ({
                    expenses: state.expenses.filter((exp) => exp.id !== id),
                }));
            },
            getTotalMonthlyExpenses: (year, month) => {
                return get().expenses
                    .filter((exp) => {
                        const d = new Date(exp.date);
                        return d.getFullYear() === year && d.getMonth() === month;
                    })
                    .reduce((sum, exp) => sum + exp.amount, 0);
            },
        }),
        { name: 'expenses-storage' }
    )
);

// ============ SAVINGS GOALS STORE ============
interface SavingsGoalState {
    goals: SavingsGoal[];
    loading: boolean;
    fetchGoals: (userId: string) => Promise<void>;
    addGoal: (goal: Omit<SavingsGoal, 'id' | 'created_at'>) => Promise<void>;
    updateGoal: (id: string, updates: Partial<SavingsGoal>) => Promise<void>;
    deleteGoal: (id: string) => Promise<void>;
    contributeToGoal: (id: string, amount: number) => Promise<void>;
}

export const useSavingsStore = create<SavingsGoalState>()(
    persist(
        (set, get) => ({
            goals: [],
            loading: false,
            fetchGoals: async (userId) => {
                set({ loading: true });
                const { data, error } = await supabase
                    .from('savings_goals')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: true });
                if (!error && data) set({ goals: data });
                set({ loading: false });
            },
            addGoal: async (goal) => {
                const { data, error } = await supabase
                    .from('savings_goals')
                    .insert([goal])
                    .select()
                    .single();
                if (!error && data) {
                    set((state) => ({ goals: [...state.goals, data] }));
                }
            },
            updateGoal: async (id, updates) => {
                const { error } = await supabase
                    .from('savings_goals')
                    .update(updates)
                    .eq('id', id);
                if (!error) {
                    set((state) => ({
                        goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
                    }));
                }
            },
            deleteGoal: async (id) => {
                const { error } = await supabase.from('savings_goals').delete().eq('id', id);
                if (!error) {
                    set((state) => ({
                        goals: state.goals.filter((g) => g.id !== id),
                    }));
                }
            },
            contributeToGoal: async (id, amount) => {
                const goal = get().goals.find((g) => g.id === id);
                if (goal) {
                    const newAmount = goal.current_amount + amount;
                    const { error } = await supabase
                        .from('savings_goals')
                        .update({ current_amount: newAmount })
                        .eq('id', id);
                    if (!error) {
                        set((state) => ({
                            goals: state.goals.map((g) =>
                                g.id === id ? { ...g, current_amount: newAmount } : g
                            ),
                        }));
                    }
                }
            },
        }),
        { name: 'savings-storage' }
    )
);

// ============ UI STORE ============
interface UIState {
    theme: 'light' | 'dark';
    sidebarOpen: boolean;
    toggleTheme: () => void;
    toggleSidebar: () => void;
    setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            theme: 'dark',
            sidebarOpen: true,
            toggleTheme: () =>
                set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
        }),
        { name: 'ui-storage' }
    )
);
