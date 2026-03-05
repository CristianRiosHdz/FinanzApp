import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
    Profile,
    Income,
    Expense,
    ExpenseCategory,
    SavingsGoal,
    DEFAULT_CATEGORIES,
    Currency,
} from '@/lib/types';

// Generate UUID
function generateId(): string {
    return crypto.randomUUID();
}

// ============ AUTH STORE ============
interface AuthState {
    user: { id: string; email?: string } | null;
    profile: Profile | null;
    isAuthenticated: boolean;
    setUser: (user: { id: string; email?: string } | null) => void;
    setProfile: (profile: Profile | null) => void;
    logout: () => void;
    updateProfile: (updates: Partial<Profile>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            profile: null,
            isAuthenticated: false,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setProfile: (profile) => set({ profile }),
            logout: () => set({ user: null, profile: null, isAuthenticated: false }),
            updateProfile: (updates) =>
                set((state) => ({
                    profile: state.profile
                        ? { ...state.profile, ...updates, updated_at: new Date().toISOString() }
                        : null,
                })),
        }),
        { name: 'auth-storage' }
    )
);

// ============ CATEGORIES STORE ============
interface CategoryState {
    categories: ExpenseCategory[];
    initializeCategories: (userId: string) => void;
    addCategory: (category: Omit<ExpenseCategory, 'id' | 'created_at'>) => void;
    updateCategory: (id: string, updates: Partial<ExpenseCategory>) => void;
    deleteCategory: (id: string) => void;
}

export const useCategoryStore = create<CategoryState>()(
    persist(
        (set, get) => ({
            categories: [],
            initializeCategories: (userId: string) => {
                if (get().categories.length === 0) {
                    const defaultCategories: ExpenseCategory[] = DEFAULT_CATEGORIES.map((cat) => ({
                        ...cat,
                        id: generateId(),
                        user_id: userId,
                        created_at: new Date().toISOString(),
                    }));
                    set({ categories: defaultCategories });
                }
            },
            addCategory: (category) =>
                set((state) => ({
                    categories: [
                        ...state.categories,
                        { ...category, id: generateId(), created_at: new Date().toISOString() },
                    ],
                })),
            updateCategory: (id, updates) =>
                set((state) => ({
                    categories: state.categories.map((cat) =>
                        cat.id === id ? { ...cat, ...updates } : cat
                    ),
                })),
            deleteCategory: (id) =>
                set((state) => ({
                    categories: state.categories.filter((cat) => cat.id !== id),
                })),
        }),
        { name: 'categories-storage' }
    )
);

// ============ INCOME STORE ============
interface IncomeState {
    incomes: Income[];
    addIncome: (income: Omit<Income, 'id' | 'created_at'>) => void;
    updateIncome: (id: string, updates: Partial<Income>) => void;
    deleteIncome: (id: string) => void;
    getMonthlyIncomes: (year: number, month: number) => Income[];
    getTotalMonthlyIncome: (year: number, month: number) => number;
}

export const useIncomeStore = create<IncomeState>()(
    persist(
        (set, get) => ({
            incomes: [],
            addIncome: (income) =>
                set((state) => ({
                    incomes: [
                        { ...income, id: generateId(), created_at: new Date().toISOString() },
                        ...state.incomes,
                    ],
                })),
            updateIncome: (id, updates) =>
                set((state) => ({
                    incomes: state.incomes.map((inc) =>
                        inc.id === id ? { ...inc, ...updates } : inc
                    ),
                })),
            deleteIncome: (id) =>
                set((state) => ({
                    incomes: state.incomes.filter((inc) => inc.id !== id),
                })),
            getMonthlyIncomes: (year, month) => {
                return get().incomes.filter((inc) => {
                    const d = new Date(inc.date);
                    return d.getFullYear() === year && d.getMonth() === month;
                });
            },
            getTotalMonthlyIncome: (year, month) => {
                return get()
                    .getMonthlyIncomes(year, month)
                    .reduce((sum, inc) => sum + inc.amount, 0);
            },
        }),
        { name: 'incomes-storage' }
    )
);

// ============ EXPENSE STORE ============
interface ExpenseState {
    expenses: Expense[];
    addExpense: (expense: Omit<Expense, 'id' | 'created_at'>) => void;
    updateExpense: (id: string, updates: Partial<Expense>) => void;
    deleteExpense: (id: string) => void;
    getMonthlyExpenses: (year: number, month: number) => Expense[];
    getTotalMonthlyExpenses: (year: number, month: number) => number;
    getExpensesByCategory: (year: number, month: number) => Record<string, number>;
}

export const useExpenseStore = create<ExpenseState>()(
    persist(
        (set, get) => ({
            expenses: [],
            addExpense: (expense) =>
                set((state) => ({
                    expenses: [
                        { ...expense, id: generateId(), created_at: new Date().toISOString() },
                        ...state.expenses,
                    ],
                })),
            updateExpense: (id, updates) =>
                set((state) => ({
                    expenses: state.expenses.map((exp) =>
                        exp.id === id ? { ...exp, ...updates } : exp
                    ),
                })),
            deleteExpense: (id) =>
                set((state) => ({
                    expenses: state.expenses.filter((exp) => exp.id !== id),
                })),
            getMonthlyExpenses: (year, month) => {
                return get().expenses.filter((exp) => {
                    const d = new Date(exp.date);
                    return d.getFullYear() === year && d.getMonth() === month;
                });
            },
            getTotalMonthlyExpenses: (year, month) => {
                return get()
                    .getMonthlyExpenses(year, month)
                    .reduce((sum, exp) => sum + exp.amount, 0);
            },
            getExpensesByCategory: (year, month) => {
                const monthly = get().getMonthlyExpenses(year, month);
                const byCategory: Record<string, number> = {};
                monthly.forEach((exp) => {
                    byCategory[exp.category_id] = (byCategory[exp.category_id] || 0) + exp.amount;
                });
                return byCategory;
            },
        }),
        { name: 'expenses-storage' }
    )
);

// ============ SAVINGS GOALS STORE ============
interface SavingsGoalState {
    goals: SavingsGoal[];
    addGoal: (goal: Omit<SavingsGoal, 'id' | 'created_at'>) => void;
    updateGoal: (id: string, updates: Partial<SavingsGoal>) => void;
    deleteGoal: (id: string) => void;
    contributeToGoal: (id: string, amount: number) => void;
}

export const useSavingsStore = create<SavingsGoalState>()(
    persist(
        (set) => ({
            goals: [],
            addGoal: (goal) =>
                set((state) => ({
                    goals: [
                        ...state.goals,
                        { ...goal, id: generateId(), created_at: new Date().toISOString() },
                    ],
                })),
            updateGoal: (id, updates) =>
                set((state) => ({
                    goals: state.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
                })),
            deleteGoal: (id) =>
                set((state) => ({
                    goals: state.goals.filter((g) => g.id !== id),
                })),
            contributeToGoal: (id, amount) =>
                set((state) => ({
                    goals: state.goals.map((g) =>
                        g.id === id ? { ...g, current_amount: g.current_amount + amount } : g
                    ),
                })),
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
