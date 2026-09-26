import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import toast from 'react-hot-toast';
import { FiShield, FiMail, FiLock, FiAlertTriangle, FiArrowRight } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';

function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, googleLogin } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');

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
    try {
      await googleLogin(googleProfile);
      setShowGoogleModal(false);
      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Google authentication failed.';
      toast.error(msg);
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
          onClick={() => setShowGoogleModal(true)}
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
            <div className="google-modal-header">
              <FcGoogle size={32} />
              <div>
                <h3>Google Workspace Sign-In</h3>
                <p>Select your administrator account</p>
              </div>
            </div>

            <div className="google-profiles-list">
              <button
                type="button"
                className="google-profile-card"
                onClick={() =>
                  handleGoogleSubmit({
                    email: 'admin@deepkore.com',
                    name: 'System Administrator',
                    googleId: 'google-admin-001',
                    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
                  })
                }
              >
                <div className="google-profile-avatar">A</div>
                <div className="google-profile-details">
                  <strong>System Administrator (Super Admin)</strong>
                  <span>admin@deepkore.com</span>
                </div>
              </button>
            </div>

            <div className="google-custom-box">
              <label>Or enter custom Administrator @gmail.com:</label>
              <div className="form-row">
                <input
                  type="email"
                  placeholder="admin.enterprise@gmail.com"
                  value={customGoogleEmail}
                  onChange={(e) => setCustomGoogleEmail(e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={!customGoogleEmail.includes('@')}
                  onClick={() =>
                    handleGoogleSubmit({
                      email: customGoogleEmail.trim().toLowerCase(),
                      name: customGoogleEmail.split('@')[0],
                      googleId: `google-custom-${Date.now()}`,
                    })
                  }
                >
                  Continue
                </button>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '1rem' }}
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
