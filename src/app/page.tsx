'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, useIncomeStore, useExpenseStore, useSavingsStore, useCategoryStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import LoginPage from '@/components/auth/LoginPage';
import AppShell from '@/components/layout/AppShell';
import toast from 'react-hot-toast';

export default function Home() {
  const { isAuthenticated, setUser, setProfile } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Initial session check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userId = session.user.id;
        setUser({ id: userId, email: session.user.email });

        // Load all data with explicit error handling
        const userIdFetch = session.user.id;
        toast.promise(
          Promise.all([
            supabase.from('profiles').select('*').eq('id', userIdFetch).maybeSingle(),
            useIncomeStore.getState().fetchIncomes(userIdFetch),
            useExpenseStore.getState().fetchExpenses(userIdFetch),
            useSavingsStore.getState().fetchGoals(userIdFetch),
            useCategoryStore.getState().initializeCategories(userIdFetch)
          ]),
          {
            loading: 'Sincronizando...',
            success: 'Datos cargados',
            error: (err) => `Error: ${err.message}`
          }
        ).then(([profileRes]) => {
          if (profileRes && profileRes.data) setProfile(profileRes.data);
        });
      } else {
        // No session found, ensure everything is cleared
        setUser(null);
        setProfile(null);
      }
    };

    checkSession();

    // Listener for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user) {
        const userId = session.user.id;
        setUser({ id: userId, email: session.user.email });

        // Sync data
        useIncomeStore.getState().fetchIncomes(userId);
        useExpenseStore.getState().fetchExpenses(userId);
        useSavingsStore.getState().fetchGoals(userId);
        useCategoryStore.getState().initializeCategories(userId);

        const { data: profile, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (profile) {
          setProfile(profile);
        } else if (!pError) {
          // Create default profile if missing
          const { data: newProfile } = await supabase
            .from('profiles')
            .upsert({
              id: userId,
              full_name: session.user.email?.split('@')[0] || 'Usuario',
              currency: 'COP'
            })
            .select()
            .single();
          if (newProfile) setProfile(newProfile);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, setProfile]);

  if (!mounted) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0B1120'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid rgba(59,130,246,0.2)',
          borderTopColor: '#3B82F6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <AppShell />;
}
