import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import toast from 'react-hot-toast';
import { FiShield, FiMail, FiLock, FiAlertTriangle, FiArrowRight, FiX, FiCheckCircle } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [adminClearanceKey, setAdminClearanceKey] = useState('');
  const [authError, setAuthError] = useState('');

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
      toast.error('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Authentication failed.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail('admin@deepkore.com');
    setPassword('admin123');
  };

  const handleGoogleSubmit = async (googleProfile) => {
    setLoading(true);
    setAuthError('');
    try {
      await googleLogin({
        ...googleProfile,
        role: 'admin',
        adminKey: googleProfile.adminKey !== undefined ? googleProfile.adminKey : adminClearanceKey.trim(),
      });
      setShowGoogleModal(false);
      navigate('/dashboard');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Administrative clearance failed.';
      setAuthError(msg);
      toast.error(msg, { duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-screen">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <img src="/deepkore-icon.png" alt="Deepkore" style={{ width: '56px', height: '56px', borderRadius: '14px', marginBottom: '0.85rem', boxShadow: '0 4px 16px rgba(0,0,0,0.35)' }} />
          <h2>Deepkore Administration</h2>
          <p className="admin-login-subtitle">
            Restricted Access • System Operations &amp; Governance Portal
          </p>
        </div>

        <div className="admin-clearance-notice">
          <FiAlertTriangle className="notice-icon" />
          <span>
            Authorized personnel only. All access attempts and administrative modifications are audited.
          </span>
        </div>

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="form-group">
            <label htmlFor="admin-email">Admin Email Address</label>
            <div className="input-with-icon">
              <FiMail className="input-icon" />
              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@deepkore.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="admin-password">Secure Password</label>
            <div className="input-with-icon">
              <FiLock className="input-icon" />
              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="admin-submit-btn" disabled={loading}>
            {loading ? 'Authenticating Clearance...' : 'Authenticate & Enter Admin Console'}
            <FiArrowRight />
          </button>
        </form>

        <div className="admin-divider">
          <span>OR SINGLE SIGN-ON</span>
        </div>

        <button
          type="button"
          className="admin-google-btn"
          onClick={() => {
            setAuthError('');
            setShowGoogleModal(true);
          }}
          disabled={loading}
        >
          <FcGoogle size={20} />
          <span>Sign In with Admin Google Account</span>
        </button>

        <div className="admin-quick-fill-box">
          <span className="quick-fill-label">Demo Clearance Profile:</span>
          <button type="button" className="quick-fill-chip" onClick={handleQuickFill}>
            <strong>admin@deepkore.com</strong> (Pre-fill Credentials)
          </button>
        </div>

        <div className="admin-login-footer">
          <span>Are you an Employee or Manager?</span>
          <a href="http://localhost:5173" target="_blank" rel="noopener noreferrer">
            Go to Operations Portal &rarr;
          </a>
        </div>
      </div>

      {/* Google Sign-In Simulation Modal */}
      {showGoogleModal && (
        <div className="modal-overlay" onClick={() => setShowGoogleModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="google-modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <FcGoogle size={32} />
                <div>
                  <h3>Google Workspace Sign-In</h3>
                  <p>Administrative Clearance Verification</p>
                </div>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setShowGoogleModal(false)}
                title="Close"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <FiX />
              </button>
            </div>

            {authError && (
              <div className="admin-denied-alert">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                  <FiAlertTriangle />
                  <span>Administrative Clearance Failed</span>
                </div>
                <span>{authError}</span>
              </div>
            )}

            <div className="google-profiles-list">
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Pre-authorized Master Administrator:
              </span>
              <button
                type="button"
                className="google-profile-card"
                onClick={() =>
                  handleGoogleSubmit({
                    email: 'admin@deepkore.com',
                    name: 'System Administrator',
                    role: 'admin',
                    adminKey: 'DEEPKORE-ADMIN-2026',
                    googleId: 'google-admin-001',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
                  })
                }
              >
                <div className="google-profile-avatar">A</div>
                <div className="google-profile-details">
                  <strong>System Administrator (Super Admin)</strong>
                  <span>admin@deepkore.com / admin@smartops.com</span>
                </div>
                <span className="badge-admin" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700 }}>
                  VERIFIED ADMIN
                </span>
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (customGoogleEmail && customGoogleEmail.includes('@')) {
                  handleGoogleSubmit({
                    email: customGoogleEmail.trim().toLowerCase(),
                    name: customGoogleEmail.split('@')[0],
                    role: 'admin',
                    adminKey: adminClearanceKey.trim(),
                    googleId: `google-custom-${Date.now()}`,
                  });
                }
              }}
              className="admin-clearance-box"
            >
              <div className="clearance-header">
                <FiShield className="clearance-icon" />
                <div>
                  <div className="clearance-title">Verify New Administrative Account</div>
                  <div className="clearance-desc">Security clearance key is required for new administrator emails.</div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <label htmlFor="admin-custom-email">Google Email Address *</label>
                <div className="input-with-icon">
                  <FiMail className="input-icon" />
                  <input
                    id="admin-custom-email"
                    type="email"
                    placeholder="yourname@gmail.com"
                    value={customGoogleEmail}
                    onChange={(e) => {
                      setCustomGoogleEmail(e.target.value);
                      setAuthError('');
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="admin-clearance-key">Admin Clearance Key *</label>
                  <button
                    type="button"
                    className="demo-key-btn"
                    onClick={() => {
                      setAdminClearanceKey('DEEPKORE-ADMIN-2026');
                      setAuthError('');
                    }}
                    title="Insert Master Demo Key"
                  >
                    Auto-fill Demo Key
                  </button>
                </div>
                <div className="input-with-icon">
                  <FiLock className="input-icon" />
                  <input
                    id="admin-clearance-key"
                    type="password"
                    placeholder="Enter security clearance key"
                    value={adminClearanceKey}
                    onChange={(e) => {
                      setAdminClearanceKey(e.target.value);
                      setAuthError('');
                    }}
                    autoComplete="off"
                  />
                </div>
                <span className="admin-field-hint">
                  Required to verify administrator identity (Master Key: <code>DEEPKORE-ADMIN-2026</code>).
                </span>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={!customGoogleEmail.includes('@') || loading}
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '0.75rem' }}
              >
                {loading ? 'Verifying Admin Clearance...' : 'Verify & Authorize Admin Access'}
              </button>
            </form>

            <div className="admin-portal-switch">
              <span>Are you an Employee or Manager?</span>
              <a href="http://localhost:5173/login" target="_blank" rel="noopener noreferrer">
                Go to Operations Portal &rarr;
              </a>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '0.75rem' }}
              onClick={() => setShowGoogleModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLoginPage;


