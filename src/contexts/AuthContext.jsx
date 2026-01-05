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
    if (storedEmail && supabase) {
      loadUserRole(storedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserRole = async (email) => {
    try {
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('email, full_name, role, is_active')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.warn('User not found or inactive:', error);
        setUser(null);
        setUserRole(null);
        setUserEmail(null);
        localStorage.removeItem('user_email');
      } else {
        setUser(data);
        setUserRole(data.role);
        setUserEmail(data.email);
      }
    } catch (err) {
      console.error('Failed to load user role:', err);
      setUser(null);
      setUserRole(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email) => {
    setLoading(true);
    try {
      // Verify user exists in app_users table
      if (!supabase) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('app_users')
        .select('email, full_name, role, is_active')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        alert('User not found or inactive. Please contact administrator.');
        setLoading(false);
        return false;
      }

      // Store email in localStorage
      localStorage.setItem('user_email', email);
      setUser(data);
      setUserRole(data.role);
      setUserEmail(data.email);
      setLoading(false);
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed: ' + err.message);
      setLoading(false);
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
