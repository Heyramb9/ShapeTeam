'use client';

import { useEffect, useState, useCallback } from 'react';
import { SignIn, SignUp, useUser, useClerk } from '@clerk/nextjs';
import { Sparkles, ArrowLeft, Loader2, Mail, ShieldCheck, LogOut, CheckCircle2 } from 'lucide-react';
import apiService, { SessionUser, Organization } from '../services/api';

interface ClerkAuthViewProps {
  authenticated: (user: SessionUser, organization: Organization) => void;
  onBack?: () => void;
  initialMode?: 'signin' | 'signup';
}

export default function ClerkAuthView({ authenticated, onBack, initialMode = 'signin' }: ClerkAuthViewProps) {
  const [isSignUp, setIsSignUp] = useState(initialMode === 'signup');
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    setIsSignUp(initialMode === 'signup');
  }, [initialMode]);

  const handleSync = useCallback(async (activeUser: NonNullable<typeof user>) => {
    setSyncing(true);
    setSyncError('');
    try {
      const email = activeUser.primaryEmailAddress?.emailAddress || activeUser.emailAddresses?.[0]?.emailAddress || '';
      const name = activeUser.fullName || activeUser.firstName || email.split('@')[0];
      const avatarUrl = activeUser.imageUrl;

      const res = await apiService.clerkAuth({
        clerkId: activeUser.id,
        email,
        name,
        avatarUrl,
      });
      authenticated(res.user, res.organization);
    } catch (err) {
      console.error('Failed to sync Clerk user with backend:', err);
      setSyncError(err instanceof Error ? err.message : 'Authentication sync failed.');
      setSyncing(false);
    }
  }, [authenticated]);

  const handleSwitchAccount = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="auth-page clerk-auth-page">
      <aside>
        <button className="brand" onClick={onBack} aria-label="Go to landing">
          <b><span>Shape</span>Team</b>
          <small>Enterprise AI</small>
        </button>
        <div>
          <small>Clerk Authentication • Single Sign-On</small>
          <h1>{isSignUp ? 'Create your account' : 'Welcome back'}</h1>
          <p>
            {isSignUp
              ? 'Sign up with your Gmail address to instantly provision your AI-powered workforce intelligence workspace.'
              : 'Sign in with your Gmail address to continue to your role-based workspace.'}
          </p>
          <div className="clerk-badges" style={{ marginTop: '24px', display: 'grid', gap: '10px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#d8e5ff' }}>
              <Mail size={16} color="#75b9ff" /> One-click Google & Gmail sign-in
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#d8e5ff' }}>
              <Sparkles size={16} color="#75b9ff" /> Organization Admin access automatically assigned
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#d8e5ff' }}>
              <ShieldCheck size={16} color="#75b9ff" /> Secure token verification & multi-session support
            </span>
          </div>
        </div>
        <footer>Secured by Clerk & Google OAuth · Zero passwords to remember</footer>
      </aside>

      <main className="clerk-embed-main" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '30px 20px' }}>
        <div style={{ width: '100%', maxWidth: '440px' }}>
          {onBack && (
            <button
              type="button"
              className="auth-back"
              onClick={onBack}
              style={{ marginBottom: '16px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ArrowLeft size={16} /> Back to overview
            </button>
          )}

          {/* If the user is already signed into Clerk / Google */}
          {isLoaded && isSignedIn && user ? (
            <div style={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '28px 24px', boxShadow: '0 8px 30px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #1e3a8a)', color: '#fff', fontSize: '20px', fontWeight: 'bold', display: 'grid', placeItems: 'center', margin: '0 auto 14px' }}>
                {(user.fullName || user.primaryEmailAddress?.emailAddress || 'U')[0].toUpperCase()}
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '19px', color: '#1e293b' }}>
                {user.fullName || user.firstName || 'Signed in'}
              </h3>
              <p style={{ margin: '0 0 20px', fontSize: '13px', color: '#64748b' }}>
                {user.primaryEmailAddress?.emailAddress}
              </p>

              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', padding: '10px', fontSize: '12px', color: '#166534', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'left' }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                <span>Active Google session detected. Click continue or switch accounts below.</span>
              </div>

              {syncError && (
                <p className="form-error" style={{ marginBottom: '14px' }}>{syncError}</p>
              )}

              <div style={{ display: 'grid', gap: '10px' }}>
                <button
                  className="primary"
                  onClick={() => handleSync(user)}
                  disabled={syncing}
                  style={{ width: '100%', height: '44px', fontSize: '14px' }}
                >
                  {syncing ? <Loader2 className="spin" /> : <Sparkles />}
                  {syncing ? 'Connecting to ShapeTeam...' : `Continue as ${user.firstName || 'User'}`}
                </button>

                <button
                  type="button"
                  className="secondary"
                  onClick={handleSwitchAccount}
                  disabled={signingOut}
                  style={{ width: '100%', height: '40px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  {signingOut ? <Loader2 className="spin" /> : <LogOut size={14} />}
                  {signingOut ? 'Signing out of Google...' : 'Use a different Google / Gmail account'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="clerk-component-container" style={{ display: 'flex', justifyContent: 'center' }}>
                {isSignUp ? (
                  <SignUp
                    routing="hash"
                    signInUrl="#/sign-in"
                    afterSignUpUrl="/"
                  />
                ) : (
                  <SignIn
                    routing="hash"
                    signUpUrl="#/sign-up"
                    afterSignInUrl="/"
                  />
                )}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <button
                  type="button"
                  className="text-action"
                  onClick={() => setIsSignUp(!isSignUp)}
                  style={{ fontSize: '0.88rem', margin: 'auto' }}
                >
                  {isSignUp ? 'Already have an account? Sign in with Gmail' : "New to ShapeTeam? Sign up with Gmail"}
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
