import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [validationError, setValidationError] = useState('');

  const { login, isAuthenticated, user, loading, error, setError } = useAuth();
  const navigate = useNavigate();

  // If already authenticated, redirect immediately to dashboard
  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = user.role === 'student' ? '/student/dashboard' : '/mentor/dashboard';
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  // Clear errors on page load
  useEffect(() => {
    setError(null);
    setValidationError('');
  }, [setError]);

  const validateForm = () => {
    if (!email) {
      setValidationError('Email is required');
      return false;
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    if (!password) {
      setValidationError('Password is required');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await login(email, password, rememberMe);
    if (result && result.success) {
      // Navigation is handled by the useEffect redirect hook above
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        <div className="auth-card-header">
          <Link to="/" className="auth-logo">
            <div className="logo-icon-wrapper">
              <GraduationCap size={22} strokeWidth={2.5} />
            </div>
            <span>MentorConnect</span>
          </Link>
          <h2>Welcome back!</h2>
          <p>Sign in to connect with your mentor network</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Display validation or server errors */}
          {(validationError || error) && (
            <div className="auth-error-alert">
              <span>{validationError || error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                  setValidationError('');
                }}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                  setValidationError('');
                }}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-actions-row">
            <label className="checkbox-container">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span className="checkmark"></span>
              Remember me
            </label>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Password: <code>123456</code>
            </span>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <div className="auth-button-spinner"></div>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Accounts for Quick Presentation Login */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px', textAlign: 'center' }}>
            ⚡ 1-Click Demo Login (For Presentation)
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', fontSize: '12px', justifyContent: 'flex-start', padding: '8px 12px' }}
              onClick={() => {
                setEmail('sneha.student@example.com');
                setPassword('123456');
                login('sneha.student@example.com', '123456', true);
              }}
            >
              🎓 <strong>Demo Student:</strong> Sneha Kapoor (student)
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', fontSize: '12px', justifyContent: 'flex-start', padding: '8px 12px' }}
              onClick={() => {
                setEmail('sarah.jenkins@example.com');
                setPassword('123456');
                login('sarah.jenkins@example.com', '123456', true);
              }}
            >
              👩‍🏫 <strong>Demo Mentor:</strong> Dr. Sarah Jenkins (Google)
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', fontSize: '12px', justifyContent: 'flex-start', padding: '8px 12px' }}
              onClick={() => {
                setEmail('alex.rivera@example.com');
                setPassword('123456');
                login('alex.rivera@example.com', '123456', true);
              }}
            >
              👨‍🏫 <strong>Demo Mentor:</strong> Alex Rivera (Netflix)
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', fontSize: '12px', justifyContent: 'flex-start', padding: '8px 12px' }}
              onClick={() => {
                setEmail('priya.patel@example.com');
                setPassword('123456');
                login('priya.patel@example.com', '123456', true);
              }}
            >
              👩‍💼 <strong>Demo Mentor:</strong> Priya Patel (Airbnb)
            </button>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              style={{ width: '100%', fontSize: '12px', justifyContent: 'flex-start', padding: '8px 12px' }}
              onClick={() => {
                setEmail('marcus.chen@example.com');
                setPassword('123456');
                login('marcus.chen@example.com', '123456', true);
              }}
            >
              👨‍💻 <strong>Demo Mentor:</strong> Marcus Chen (AWS)
            </button>
          </div>
        </div>

        <div className="auth-card-footer">
          <p>
            Don't have an account? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
