import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api, { post, get } from '@/lib/api-client';

export type AppRole = 'superadmin' | 'admin' | 'user' | 'viewer';

interface UserProfile {
  id?: string;
  email: string;
  display_name: string | null;
  avatar_url?: string | null;
  is_financial_admin?: boolean;
  security_watermark_enabled?: boolean;
}

/**
 * Shape actually consumed across the app. `display_name` and `role` used to be
 * read from here while only `id` and `email` were ever set — they resolved to
 * undefined at runtime.
 */
interface AuthUser {
  id: string;
  email: string;
  display_name: string | null;
  role: AppRole | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  role: AppRole | null;
  assignedUnits: string[];
  profile: UserProfile | null;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isFinancialAdmin: boolean;
  canEdit: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<AppRole | null>(null);
  const [assignedUnits, setAssignedUnits] = useState<string[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const fetchUserData = useCallback(async () => {
    const response = await get<{ user: {
      id: string;
      email: string;
      display_name: string | null;
      avatar_url: string | null;
      is_financial_admin: boolean;
      security_watermark_enabled?: boolean;
      roles: string[];
      assigned_units: string[];
      business_unit: string | null;
      puesto: string | null;
    } }>('/api/me');

    const userData = response.data.user;

    const priority: AppRole[] = ['superadmin', 'admin', 'user', 'viewer'];
    const bestRole = userData.roles?.length
      ? (priority.find((r) => userData.roles.includes(r)) ?? 'viewer')
      : null;

    setUser({
      id: userData.id,
      email: userData.email,
      display_name: userData.display_name,
      role: bestRole,
    });
    setProfile({
      display_name: userData.display_name,
      avatar_url: userData.avatar_url,
      email: userData.email,
      is_financial_admin: userData.is_financial_admin,
      security_watermark_enabled: userData.security_watermark_enabled ?? false,
    });

    setRole(bestRole);

    setAssignedUnits(userData.assigned_units || []);
  }, []);

  const refreshAuth = useCallback(async () => {
    await fetchUserData();
  }, [fetchUserData]);

  useEffect(() => {
    fetchUserData().catch(() => {
      setUser(null);
      setRole(null);
      setAssignedUnits([]);
      setProfile(null);
    }).finally(() => setLoading(false));
  }, [fetchUserData]);

  const signIn = async (email: string, password: string) => {
    await post('/api/login', { email, password });
    await fetchUserData();
  };

  const signOut = async () => {
    try {
      await post('/api/logout');
    } catch {
      // Logout may fail if session expired, still clear local state
    }
    setUser(null);
    setRole(null);
    setAssignedUnits([]);
    setProfile(null);
  };

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'superadmin' || role === 'admin';
  const isFinancialAdmin = isSuperAdmin || profile?.is_financial_admin === true;
  const canEdit = role !== 'viewer' && role !== null;

  return (
    <AuthContext.Provider value={{
      user, loading, role, assignedUnits, profile,
      isSuperAdmin, isAdmin, isFinancialAdmin, canEdit,
      signIn, signOut, refreshAuth,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
