import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import msBg from '../assets/ms-bg.webp';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      alert('Please enter username and password');
      return;
    }

    setLoading(true);
    const success = await login(username, password);
    setLoading(false);

    if (success) {
      navigate('/requests');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    await loginWithGoogle();
    // Note: Redirect happens automatically via Supabase
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ 
      backgroundImage: `url(${msBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div className="bg-white shadow-lg max-w-md w-full" style={{ border: '2px solid #333' }}>
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-4 py-3 border-b-2 border-gray-400">
          <h1 className="text-white font-bold text-xl tracking-wide">Work Request</h1>
        </div>

        {/* Content Area */}
        <div className="p-8">
          <div className="text-center mb-6">
            <div className="inline-block bg-blue-800 text-white px-6 py-2 mb-4" style={{ border: '2px solid #333', boxShadow: '3px 3px 0 #666' }}>
              <h2 className="text-lg font-bold">Work Request Portal</h2>
            </div>
            <p className="text-gray-700 text-sm font-medium">Please enter your credentials</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Username:</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-gray-400 focus:border-blue-600 focus:outline-none disabled:bg-gray-200"
                style={{ boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-800 mb-2">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                disabled={loading}
                className="w-full px-3 py-2 border-2 border-gray-400 focus:border-blue-600 focus:outline-none disabled:bg-gray-200"
                style={{ boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1)' }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-3 bg-blue-700 text-white font-bold border-2 border-gray-800 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              style={{ boxShadow: '3px 3px 0 #333' }}
            >
              {loading ? 'Logging in...' : 'LOGIN'}
            </button>
          </form>

          <div className="mt-4 flex items-center">
            <div className="flex-1 border-t-2 border-gray-400"></div>
            <span className="px-3 text-gray-600 text-sm font-bold">OR</span>
            <div className="flex-1 border-t-2 border-gray-400"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-4 w-full px-4 py-3 bg-white text-gray-700 font-bold border-2 border-gray-400 hover:bg-gray-50 disabled:bg-gray-200 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            style={{ boxShadow: '3px 3px 0 #333' }}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>

          <div className="mt-6 text-center">
            <div className="inline-block bg-gray-100 px-4 py-2 border-2 border-gray-400" style={{ boxShadow: '2px 2px 0 #999' }}>
              <p className="text-xs text-gray-700 font-medium">
                Authorized Personnel Only
              </p>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="bg-gray-300 px-4 py-2 border-t-2 border-gray-400 text-center">
          <p className="text-xs text-gray-700 font-medium">© 2026 Gilani Mobility Trading Co. LLC</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
