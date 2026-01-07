import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user email is in localStorage (simple auth for demo)
    const storedEmail = localStorage.getItem('user_email');
    if (storedEmail) {
      loadUserRole(storedEmail);
    } else {
      setLoading(false);
    }

    // Listen for Supabase auth state changes (for Google login)
    if (supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          const user = session.user;
          
          // Map Google user to your system (default to sales role)
          const userData = {
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email,
            role: 'sales', // Default role for Google users
            is_active: true
          };
          
          localStorage.setItem('user_email', user.email);
          setUser(userData);
          setUserRole(userData.role);
          setUserEmail(userData.email);
          setLoading(false);
        } else if (event === 'SIGNED_OUT') {
          logout();
        }
      });

      return () => {
        authListener?.subscription?.unsubscribe();
      };
    }
  }, []);

  const loadUserRole = async (email) => {
    try {
      // Map email back to hardcoded user data
      const userMap = {
        'factory@gilanimobility.ae': { email: 'factory@gilanimobility.ae', full_name: 'Factory Admin', role: 'factory_admin', is_active: true },
        'sales@gilanimobility.ae': { email: 'sales@gilanimobility.ae', full_name: 'Sales Team', role: 'sales', is_active: true }
      };

      const userData = userMap[email];

      if (!userData) {
        console.warn('User not found');
        setUser(null);
        setUserRole(null);
        setUserEmail(null);
        localStorage.removeItem('user_email');
      } else {
        setUser(userData);
        setUserRole(userData.role);
        setUserEmail(userData.email);
      }
    } catch (err) {
      console.error('Failed to load user role:', err);
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    try {
      // Hardcoded credentials for factory and sales
      const credentials = {
        factory: { password: 'gilanifactory@2026', role: 'factory_admin', email: 'factory@gilanimobility.ae', full_name: 'Factory Admin' },
        sales: { password: 'gilanisales@2026', role: 'sales', email: 'sales@gilanimobility.ae', full_name: 'Sales Team' }
      };

      const user = credentials[username.toLowerCase()];
      
      if (!user || user.password !== password) {
        alert('Invalid username or password.');
        setLoading(false);
        return false;
      }

      // Store email in localStorage
      localStorage.setItem('user_email', user.email);
      setUser({ email: user.email, full_name: user.full_name, role: user.role, is_active: true });
      setUserRole(user.role);
      setUserEmail(user.email);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed: ' + err.message);
      setLoading(false);
      return false;
    }
  };

  const loginWithGoogle = async () => {
    if (!supabase) {
      alert('Supabase is not configured');
      return false;
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/requests`
        }
      });
      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Google login failed:', err);
      alert('Google login failed: ' + err.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('user_email');
    setUser(null);
    setUserRole(null);
    setUserEmail(null);
  };

  const isFactoryAdmin = () => userRole === 'factory_admin';
  const isSales = () => userRole === 'sales';
  const isLoggedIn = () => !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        userRole,
        userEmail,
        loading,
        login,
        loginWithGoogle,
        logout,
        isFactoryAdmin,
        isSales,
        isLoggedIn,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
