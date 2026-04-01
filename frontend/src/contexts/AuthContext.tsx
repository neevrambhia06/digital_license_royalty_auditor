import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  id: string;
  email: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  loginAsGuest: () => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  loginAsGuest: () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    loginAsGuest: () => {},
    logout: async () => {}
  });

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      // Check for guest session first
      const isGuest = sessionStorage.getItem('dlra_guest_mode') === 'true';
      if (mounted) {
        if (isGuest) {
          setState(prev => ({
            ...prev,
            user: { email: 'guest@auditor.internal', id: 'guest-uuid' },
            loading: false
          }));
        } else {
          setState(prev => ({
            ...prev,
            loading: false
          }));
        }
      }
    }

    initializeAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const loginAsGuest = () => {
    sessionStorage.setItem('dlra_guest_mode', 'true');
    setState(prev => ({
      ...prev,
      user: { email: 'guest@auditor.internal', id: 'guest-uuid' },
      loading: false
    }));
  };

  const logout = async () => {
    sessionStorage.removeItem('dlra_guest_mode');
    setState({
      user: null,
      loading: false,
      loginAsGuest,
      logout
    });
  };

  return (
    <AuthContext.Provider value={{ ...state, loginAsGuest, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
