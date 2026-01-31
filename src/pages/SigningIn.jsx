import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const SigningIn = () => {
  const navigate = useNavigate();
  const { isFactoryAdmin, isSales } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate('/requests');
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  const roleLabel = isFactoryAdmin() ? 'Factory' : isSales() ? 'Sales' : 'User';
  const roleTextClass = isFactoryAdmin() ? 'text-pink-400' : isSales() ? 'text-blue-400' : 'text-white';
  const roleGradientClass = isFactoryAdmin()
    ? 'from-indigo-500 via-purple-500 to-pink-500'
    : 'from-blue-500 via-cyan-500 to-emerald-500';

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="text-center px-6">
        <div className="relative inline-flex rounded-2xl p-0.5 shadow-2xl">
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${roleGradientClass} bg-[length:200%_200%] animate-gradient opacity-60`} />
          <div className="relative rounded-2xl bg-black/70 px-6 py-4 backdrop-blur-sm border border-white/10">
            <p className="text-white/90 text-sm tracking-wide">Signing in as</p>
            <h1 className={`mt-1 text-4xl md:text-5xl font-extrabold tracking-tight ${roleTextClass}`}>{roleLabel}</h1>
          </div>
        </div>
        <p className="mt-6 text-white/70 text-sm">Preparing your dashboard…</p>
      </div>
    </div>
  );
};

export default SigningIn;
