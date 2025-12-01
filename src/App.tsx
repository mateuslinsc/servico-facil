import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './utils/supabase/info';
import { Toaster, toast } from 'sonner@2.0.3';

// Import pages
import { WelcomePage } from './components/WelcomePage';
import { LoginPage } from './components/LoginPage';
import { SignUpPage } from './components/SignUpPage';
import { DashboardPage } from './components/DashboardPage';
import { ServiceDetailPage } from './components/ServiceDetailPage';
import { AppointmentsPage } from './components/AppointmentsPage';
import { FavoritesPage } from './components/FavoritesPage';
import { MapPage } from './components/MapPage';
import { AdminDashboard } from './components/AdminDashboard';
import { NotificationsPage } from './components/NotificationsPage';

const supabase = createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

export type User = {
  id: string;
  email: string;
  name: string;
  type: 'client' | 'institution';
  institutionId?: string;
  favorites?: string[];
};

export type AuthContextType = {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, name: string, type: 'client' | 'institution') => Promise<void>;
  updateProfile: (updates: Partial<User>) => void;
};

export const AuthContext = React.createContext<AuthContextType>({
  user: null,
  accessToken: null,
  login: async () => {},
  logout: async () => {},
  signup: async () => {},
  updateProfile: () => {},
});

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setAccessToken(session.access_token);
        await fetchProfile(session.access_token);
      }
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfile = async (token: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/profile`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('App - Profile loaded:', data.profile);
        setUser(data.profile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Translate common error messages to Portuguese
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('E-mail ou senha incorretos. Verifique suas credenciais e tente novamente.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('E-mail não confirmado. Verifique sua caixa de entrada.');
        } else {
          throw error;
        }
      }

      if (data.session) {
        setAccessToken(data.session.access_token);
        await fetchProfile(data.session.access_token);
        toast.success('Login realizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.message || 'Erro ao fazer login';
      toast.error(errorMessage);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name: string, type: 'client' | 'institution') => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-4ede0739/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({ email, password, name, type }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao criar conta');
      }

      // Now login
      await login(email, password);
      toast.success('Conta criada com sucesso!');
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Erro ao criar conta');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setAccessToken(null);
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, signup, updateProfile }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <WelcomePage />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <LoginPage />} />
          <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <SignUpPage />} />
          <Route
            path="/dashboard"
            element={user ? <DashboardPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/service/:id"
            element={user ? <ServiceDetailPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/appointments"
            element={user ? <AppointmentsPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/favorites"
            element={user ? <FavoritesPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/map"
            element={user ? <MapPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin"
            element={user && user.type === 'institution' ? <AdminDashboard /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/notifications"
            element={user ? <NotificationsPage /> : <Navigate to="/login" />}
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" />
    </AuthContext.Provider>
  );
}

export default App;