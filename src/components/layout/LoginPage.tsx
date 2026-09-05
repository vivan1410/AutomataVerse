import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { apiService } from '../../services/api';

interface LoginPageProps {
  onLoginSuccess: (email: string) => void;
  onNavigateToRegister: () => void;
  onNavigateToLanding: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToLanding,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      setErrorMsg('Google sign-in was cancelled.');
      return;
    }

    setIsGoogleLoading(true);
    setErrorMsg('');

    try {
      const res = await apiService.googleLogin(response.credential);
      if (res.success && res.profile) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('av_user_email', res.profile.email);
        onLoginSuccess(res.profile.email);
      } else {
        setErrorMsg(res.error || 'Unable to sign in with Google. Please try again.');
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        setErrorMsg('Unable to connect to authentication server. Please make sure the server is running.');
      } else {
        setErrorMsg(err.message || 'Unable to sign in with Google. Please try again.');
      }
      setIsGoogleLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    console.log("Google OAuth configured:", Boolean(clientId));

    if (!clientId) {
      console.error("Google OAuth Client ID is missing");
      return;
    }

    const initializeGoogle = () => {
      if (!active) return;
      if (typeof window !== 'undefined' && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
            auto_select: false,
          });

          const btnParent = document.getElementById('google-signin-btn');
          if (btnParent) {
            (window as any).google.accounts.id.renderButton(btnParent, {
              theme: 'outline',
              size: 'large',
              text: 'continue_with',
              width: 336,
            });
          }
        } catch (e) {
          console.error('[Google GIS Init Error]', e);
        }
      } else {
        setTimeout(initializeGoogle, 200);
      }
    };

    initializeGoogle();
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      alert('Please fill out all fields.');
      return;
    }
    setErrorMsg('');
    try {
      const response = await apiService.login(email, password);
      if (response.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('av_user_email', email.trim().toLowerCase());
        if (rememberMe) {
          localStorage.setItem('rememberedEmail', email);
        }
        onLoginSuccess(email.trim().toLowerCase());
      } else {
        setErrorMsg(response.error || 'Invalid credentials.');
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.message?.includes('fetch')) {
        setErrorMsg('Unable to connect to authentication server. Please make sure the server is running.');
      } else {
        setErrorMsg(err.message || 'Server error occurred.');
      }
    }
  };

  const handleGuestLogin = async () => {
    setErrorMsg('');
    try {
      const guestEmail = 'guest@automataverse.io';
      const response = await apiService.login(guestEmail, 'guest');
      if (response.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('av_user_email', guestEmail);
        onLoginSuccess(guestEmail);
      }
    } catch (err: any) {
      setErrorMsg('Failed to connect to the backend server. Verify it is running.');
    }
  };

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'var(--bg-app)',
      padding: '20px',
      boxSizing: 'border-box',
    }}>
      <Card glass style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }} onClick={onNavigateToLanding}>
            <span style={{ fontSize: '20px' }}>⚡</span>
            <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-main)' }}>AutomataVerse</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dimmed)', cursor: 'pointer' }} onClick={onNavigateToLanding}>← Back to Home</span>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '8px' }}>Welcome Back</h1>
        {errorMsg && (
          <div style={{ color: 'var(--accent-error)', fontSize: '13px', background: 'rgba(255, 77, 77, 0.08)', border: '1px solid rgba(255, 77, 77, 0.15)', borderRadius: '4px', padding: '8px 12px', marginBottom: '16px' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dimmed)' }}>Email Address</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@university.edu"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '13px',
                color: 'var(--text-main)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-dimmed)' }}>Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-medium)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '13px',
                color: 'var(--text-main)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              Remember Me
            </label>
            <span 
              onClick={() => alert('Password recovery is not implemented for the class project.')}
              style={{ fontSize: '12px', color: 'var(--accent-cyan)', cursor: 'pointer' }}
            >
              Forgot Password?
            </span>
          </div>

          <Button variant="primary" size="md" glow type="submit" style={{ marginTop: '8px', padding: '10px' }}>
            Log In
          </Button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span style={{ padding: '0 12px', fontSize: '11px', color: 'var(--text-dimmed)', textTransform: 'uppercase' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        {isGoogleLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '13px', color: 'var(--accent-cyan)' }}>
            <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🔄</span> Signing in with Google...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', alignItems: 'center' }}>
            {!(import.meta as any).env.VITE_GOOGLE_CLIENT_ID && (
              <div style={{ color: 'var(--text-dimmed)', fontSize: '11px', textAlign: 'center', padding: '8px 12px', background: 'rgba(255, 77, 77, 0.04)', borderRadius: '4px', border: '1px dashed rgba(255, 77, 77, 0.2)', width: '100%', boxSizing: 'border-box' }}>
                ⚠️ Google Sign-In is not configured. Define <code style={{ color: 'var(--accent-purple)' }}>VITE_GOOGLE_CLIENT_ID</code> in <code style={{ color: 'var(--accent-purple)' }}>.env</code> and restart the server.
              </div>
            )}
            <div id="google-signin-btn" style={{ width: '100%', display: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID ? 'flex' : 'none', justifyContent: 'center', minHeight: '40px' }}></div>
            <Button variant="outline" size="md" onClick={handleGuestLogin} style={{ width: '100%', padding: '10px' }}>
              Continue as Guest
            </Button>
          </div>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <span 
            onClick={onNavigateToRegister}
            style={{ color: 'var(--accent-purple)', cursor: 'pointer', fontWeight: 600 }}
          >
            Create Account
          </span>
        </div>
      </Card>
    </div>
  );
};
export default LoginPage;
