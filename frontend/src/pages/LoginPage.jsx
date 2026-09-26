import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { FiMail, FiLock, FiX } from 'react-icons/fi';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleRole, setGoogleRole] = useState('employee');

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Close modal when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showGoogleModal) {
        setShowGoogleModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showGoogleModal]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (selectedEmail, selectedName, selectedRole) => {
    const targetEmail = (selectedEmail || googleEmail || '').trim().toLowerCase();
    const targetName = (selectedName || googleName || targetEmail.split('@')[0] || '').trim();
    const targetRole = selectedRole || googleRole || 'employee';

    if (!targetEmail || !targetEmail.includes('@')) {
      toast.error('Please enter a valid Google email address');
      return;
    }

    setGoogleLoading(true);
    try {
      await loginWithGoogle({
        email: targetEmail,
        name: targetName,
        role: targetRole,
      });
      toast.success(`Signed in with Google as ${targetName}!`);
      setShowGoogleModal(false);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Google authentication failed';
      toast.error(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const fillCredentials = (roleEmail, rolePass) => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo">
            <img src="/deepkore-icon.png" alt="Deepkore" className="auth-logo-icon" />
            Deepkore
          </h1>
          <p className="auth-subtitle">Business Operations &amp; Management</p>
        </div>

        <div className="auth-card">
          <h2>Welcome </h2>
          <p className="auth-description">Sign in to your role based portal</p>

          {/* Direct Google Login Button */}
          <button
            type="button"
            className="btn-google-signin"
            onClick={() => setShowGoogleModal(true)}
            disabled={googleLoading}
          >
            <svg className="google-svg" viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google Mail</span>
          </button>

          <div className="auth-divider">
            <span>or sign in with credentials</span>
          </div>

          {/* Quick Demo Fill Chips */}
          <div className="demo-accounts-bar">
            <span className="demo-label">Quick Sign In:</span>
            <div className="demo-chips">
              <button
                type="button"
                className="demo-chip chip-manager"
                onClick={() => fillCredentials('rahul@smartops.com', 'manager123')}
              >
                Manager
              </button>
              <button
                type="button"
                className="demo-chip chip-employee"
                onClick={() => fillCredentials('amit@smartops.com', 'employee123')}
              >
                Employee
              </button>
            </div>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="input-with-icon">
                <FiMail className="input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-with-icon">
                <FiLock className="input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
            </button>

            <p className="auth-switch">
              Don't have an account? <Link to="/register">Create an account</Link>
            </p>
          </form>
        </div>
      </div>

      {/* Google Sign-In Interactive Modal Overlay */}
      {showGoogleModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowGoogleModal(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="modal-content google-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="google-modal-title">
                <svg className="google-svg" viewBox="0 0 24 24" width="22" height="22">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3>Sign in with Google Mail</h3>
              </div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowGoogleModal(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <p className="google-modal-desc">
              Choose an active Google account to enter <strong>Deepkore SmartOps</strong>:
            </p>

            {/* Quick Google Profiles linked to seeded database accounts */}
            <div className="google-account-list">
              <button
                type="button"
                className="google-account-item"
                disabled={googleLoading}
                onClick={() =>
                  handleGoogleSignIn('rahul.sharma@gmail.com', 'Rahul Sharma', 'manager')
                }
              >
                <div className="google-avatar google-avatar-blue">R</div>
                <div className="google-account-info">
                  <span className="google-account-name">Rahul Sharma (Operations Lead)</span>
                  <span className="google-account-email">rahul.sharma@gmail.com / rahul@smartops.com</span>
                </div>
                <span className="badge-manager">MANAGER</span>
              </button>

              <button
                type="button"
                className="google-account-item"
                disabled={googleLoading}
                onClick={() =>
                  handleGoogleSignIn('amit.kumar@gmail.com', 'Amit Kumar', 'employee')
                }
              >
                <div className="google-avatar google-avatar-green">A</div>
                <div className="google-account-info">
                  <span className="google-account-name">Amit Kumar (Full-Stack Engineer)</span>
                  <span className="google-account-email">amit.kumar@gmail.com / amit@smartops.com</span>
                </div>
                <span className="badge-employee">EMPLOYEE</span>
              </button>

              <button
                type="button"
                className="google-account-item"
                disabled={googleLoading}
                onClick={() =>
                  handleGoogleSignIn('priya.patel@gmail.com', 'Priya Patel', 'manager')
                }
              >
                <div className="google-avatar google-avatar-purple">P</div>
                <div className="google-account-info">
                  <span className="google-account-name">Priya Patel (Project Manager)</span>
                  <span className="google-account-email">priya.patel@gmail.com / priya@smartops.com</span>
                </div>
                <span className="badge-manager">MANAGER</span>
              </button>
            </div>

            <div className="auth-divider">
              <span>or enter custom Google Mail</span>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleGoogleSignIn();
              }}
              className="google-custom-form"
            >
              <div className="form-group">
                <label htmlFor="google-email-input">Google Email Address</label>
                <input
                  id="google-email-input"
                  type="email"
                  placeholder="yourname@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="google-name-input">Full Name (Optional)</label>
                <input
                  id="google-name-input"
                  type="text"
                  placeholder="Your Full Name"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label htmlFor="google-role-select">Access Level</label>
                <select
                  id="google-role-select"
                  value={googleRole}
                  onChange={(e) => setGoogleRole(e.target.value)}
                  className="filter-select"
                >
                  <option value="employee">Employee (Operational Staff)</option>
                  <option value="manager">Manager (Project Lead)</option>
                </select>
              </div>

              <div className="modal-actions" style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowGoogleModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={googleLoading}>
                  {googleLoading ? 'Signing in...' : 'Sign In with Google'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoginPage;
