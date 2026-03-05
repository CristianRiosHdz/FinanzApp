import { Currency, CURRENCY_LOCALE, CURRENCY_SYMBOLS } from './types';

export function formatCurrency(amount: number, currency: Currency = 'COP'): string {
    return new Intl.NumberFormat(CURRENCY_LOCALE[currency], {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: currency === 'COP' ? 0 : 2,
        maximumFractionDigits: currency === 'COP' ? 0 : 2,
    }).format(amount);
}

export function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export function formatDateShort(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat('es-CO', {
        day: 'numeric',
        month: 'short',
    }).format(date);
}

export function getMonthName(month: number): string {
    const date = new Date(2024, month);
    return new Intl.DateTimeFormat('es-CO', { month: 'long' }).format(date);
}

export function getMonthYearLabel(year: number, month: number): string {
    const date = new Date(year, month);
    return new Intl.DateTimeFormat('es-CO', { month: 'long', year: 'numeric' }).format(date);
}

export function getCurrentMonthYear(): { year: number; month: number } {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
}

export function getTodayISO(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
}

export function calculatePercentage(value: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
}

export function getDaysRemaining(deadline: string): number {
    const today = new Date();
    const target = new Date(deadline + 'T00:00:00');
    const diff = target.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
    return classes.filter(Boolean).join(' ');
}
