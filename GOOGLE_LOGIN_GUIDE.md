# Google Login Integration Guide

## Overview
To enable Google login for the Work Request application, you'll need to integrate Google OAuth 2.0. Here are two approaches:

## Option 1: Using Supabase Auth (Recommended)

### Step 1: Configure Google OAuth in Supabase
1. Go to your Supabase Dashboard → Authentication → Providers
2. Find Google and click "Enable"
3. Go to [Google Cloud Console](https://console.cloud.google.com/)
4. Create a new project or select existing
5. Navigate to "APIs & Services" → "Credentials"
6. Click "Create Credentials" → "OAuth 2.0 Client ID"
7. Configure the consent screen if not done already
8. Select "Web application"
9. Add authorized redirect URIs:
   - `https://[YOUR_PROJECT_REF].supabase.co/auth/v1/callback`
10. Copy the Client ID and Client Secret
11. Paste them into Supabase Google provider settings
12. Save the configuration

### Step 2: Update AuthContext.jsx

Add Google login function:

```javascript
import { supabase } from '../lib/supabaseClient';

// Add to AuthContext
const loginWithGoogle = async () => {
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

// Add to context value
return (
  <AuthContext.Provider
    value={{
      // ... existing values
      loginWithGoogle,
    }}
  >
    {children}
  </AuthContext.Provider>
);
```

### Step 3: Update Login.jsx

Add Google login button:

```javascript
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { login, loginWithGoogle } = useAuth();
  
  const handleGoogleLogin = async () => {
    await loginWithGoogle();
  };

  return (
    // ... existing code
    
    <button
      onClick={handleGoogleLogin}
      className="w-full px-4 py-3 bg-white text-gray-700 font-bold border-2 border-gray-400 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
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
  );
};
```

### Step 4: Handle Auth State Changes

Update AuthContext to listen for auth changes:

```javascript
useEffect(() => {
  // Listen for auth state changes
  if (!supabase) return;
  
  const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      const user = session.user;
      
      // Map Google user to your system
      const userData = {
        email: user.email,
        full_name: user.user_metadata?.full_name || user.email,
        role: 'sales', // Default role, or check against app_users table
        is_active: true
      };
      
      localStorage.setItem('user_email', user.email);
      setUser(userData);
      setUserRole(userData.role);
      setUserEmail(userData.email);
    } else if (event === 'SIGNED_OUT') {
      logout();
    }
  });

  return () => {
    authListener.subscription.unsubscribe();
  };
}, []);
```

---

## Option 2: Using Google Identity Services (Alternative)

### Step 1: Install Google Identity package

```bash
npm install @react-oauth/google
```

### Step 2: Wrap app with GoogleOAuthProvider

In `App.jsx`:

```javascript
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  return (
    <GoogleOAuthProvider clientId="YOUR_GOOGLE_CLIENT_ID">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}
```

### Step 3: Add Google Login Button

In `Login.jsx`:

```javascript
import { GoogleLogin } from '@react-oauth/google';
import jwt_decode from 'jwt-decode';

const Login = () => {
  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwt_decode(credentialResponse.credential);
    console.log('Google user:', decoded);
    
    // Call your login function with Google user data
    // login(decoded.email);
  };

  return (
    // ... existing code
    
    <GoogleLogin
      onSuccess={handleGoogleSuccess}
      onError={() => {
        console.log('Login Failed');
        alert('Google login failed');
      }}
      useOneTap
    />
  );
};
```

---

## Security Considerations

1. **Role Management**: Decide how to assign roles to Google users:
   - Check email domain (`@gilanimobility.ae` = factory)
   - Maintain whitelist in Supabase `app_users` table
   - Default all Google users to 'sales' role

2. **Email Verification**: Google handles email verification automatically

3. **Session Management**: Store user session in localStorage + Supabase auth

4. **Environment Variables**: Never commit Google Client IDs/Secrets to git
   - Use `.env.local` file
   - Add to `.gitignore`

---

## Recommended Implementation

For your use case, **Option 1 (Supabase Auth)** is recommended because:
- Already using Supabase
- Built-in session management
- Easy to implement
- Handles token refresh automatically
- Works with existing auth flow

Let me know if you want me to implement Option 1 for you!
