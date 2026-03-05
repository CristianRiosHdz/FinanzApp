'use client';

import { useState } from 'react';
import { useAuthStore, useCategoryStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

export default function LoginPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);

    const { setUser, setProfile, logout } = useAuthStore();
    const { initializeCategories } = useCategoryStore();

    // Force clear session when landing on login page to ensure fresh start
    useState(() => {
        if (typeof window !== 'undefined') {
            supabase.auth.signOut().then(() => {
                logout();
            });
        }
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Por favor completa todos los campos');
            return;
        }

        if (!isLogin && !name) {
            toast.error('Por favor ingresa tu nombre');
            return;
        }

        if (password.length < 6) {
            toast.error('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);

        try {
            if (isLogin) {
                // Real Login with Supabase
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                if (data.user) {
                    setUser({ id: data.user.id, email: data.user.email });

                    // Fetch profile
                    const { data: profileData } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();

                    if (profileData) {
                        setProfile(profileData);
                    }

                    toast.success('¡Bienvenido de vuelta!');
                }
            } else {
                // Real Registration with Supabase
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: name,
                        },
                    },
                });

                if (error) throw error;

                if (data.user) {
                    setUser({ id: data.user.id, email: data.user.email });

                    // Initialize default categories for new user
                    initializeCategories(data.user.id);

                    toast.success('¡Cuenta creada exitosamente! Revisa tu correo de confirmación si es necesario.');
                }
            }
        } catch (error: any) {
            console.error('Auth error:', error.message);
            toast.error(error.message || 'Error en la autenticación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" data-theme="dark">
            {/* Background orbs */}
            <div
                className="login-bg-orb"
                style={{
                    width: '500px',
                    height: '500px',
                    background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                    top: '-150px',
                    right: '-100px',
                }}
            />
            <div
                className="login-bg-orb"
                style={{
                    width: '400px',
                    height: '400px',
                    background: 'linear-gradient(135deg, #10B981, #3B82F6)',
                    bottom: '-100px',
                    left: '-100px',
                }}
            />

            <div className="login-card animate-scale-in">
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: '36px' }}>
                    <div
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            fontSize: '28px',
                            boxShadow: '0 8px 32px rgba(59,130,246,0.3)',
                        }}
                    >
                        💰
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
                        <span className="gradient-text">FinanzApp</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
                        {isLogin ? 'Inicia sesión en tu cuenta' : 'Crea tu cuenta gratuita'}
                    </p>
                </div>

                {/* Form Card */}
                <div className="card" style={{ padding: '32px' }}>
                    <form onSubmit={handleSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            {!isLogin && (
                                <div className="input-group animate-fade-in">
                                    <label className="input-label" htmlFor="name">
                                        Nombre completo
                                    </label>
                                    <input
                                        id="name"
                                        type="text"
                                        className="input"
                                        placeholder="Ej: Cristian Rios"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        autoComplete="name"
                                    />
                                </div>
                            )}

                            <div className="input-group">
                                <label className="input-label" htmlFor="email">
                                    Correo electrónico
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    className="input"
                                    placeholder="correo@ejemplo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email"
                                />
                            </div>

                            <div className="input-group">
                                <label className="input-label" htmlFor="password">
                                    Contraseña
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    className="input"
                                    placeholder="Mínimo 6 caracteres"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                                />
                            </div>

                            {isLogin && (
                                <div style={{ textAlign: 'right' }}>
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        style={{ padding: '4px 0', fontSize: '13px', color: 'var(--color-accent)' }}
                                        onClick={() => toast('Funcionalidad próximamente disponible')}
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </button>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="btn btn-primary btn-lg"
                                disabled={loading}
                                style={{ width: '100%', marginTop: '8px' }}
                            >
                                {loading ? (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                border: '2px solid rgba(255,255,255,0.3)',
                                                borderTopColor: 'white',
                                                borderRadius: '50%',
                                                display: 'inline-block',
                                                animation: 'spin 0.8s linear infinite',
                                            }}
                                        />
                                        {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
                                    </span>
                                ) : isLogin ? (
                                    'Iniciar Sesión'
                                ) : (
                                    'Crear Cuenta'
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Divider */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '16px',
                            margin: '24px 0',
                        }}
                    >
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                            O CONTINÚA CON
                        </span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
                    </div>

                    {/* Google button */}
                    <button
                        className="btn btn-secondary"
                        style={{ width: '100%' }}
                        onClick={() => toast('Integración con Google próximamente')}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        Continuar con Google
                    </button>
                </div>

                {/* Toggle */}
                <p
                    style={{
                        textAlign: 'center',
                        marginTop: '24px',
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                    }}
                >
                    {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                    <button
                        onClick={() => setIsLogin(!isLogin)}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--color-accent)',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '14px',
                        }}
                    >
                        {isLogin ? 'Regístrate' : 'Inicia sesión'}
                    </button>
                </p>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        </div>
    );
}
