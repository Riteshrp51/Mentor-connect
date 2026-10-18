import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff, ArrowRight, GraduationCap, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './AuthPages.css';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'mentor' ? 'mentor' : 'student';
  const [role, setRole] = useState(initialRole); // 'student' or 'mentor'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationError, setValidationError] = useState('');

  const { register, isAuthenticated, user, loading, error, setError } = useAuth();
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
    if (!name.trim()) {
      setValidationError('Full name is required');
      return false;
    }
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
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long');
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    if (role !== 'student' && role !== 'mentor') {
      setValidationError('Please select a valid role');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const result = await register(name, email, password, role);
    if (result && result.success) {
      // Navigation is handled by the useEffect redirect hook above
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card" style={{ maxWidth: '520px' }}>
        <div className="auth-card-header">
          <Link to="/" className="auth-logo">
            <div className="logo-icon-wrapper">
              <GraduationCap size={22} strokeWidth={2.5} />
            </div>
            <span>MentorConnect</span>
          </Link>
          <h2>Create your account</h2>
          <p>Get started by selecting your role below</p>
        </div>

        {/* Role Selector Tabs/Cards */}
        <div className="role-selector-container">
          <button
            type="button"
            className={`role-select-box ${role === 'student' ? 'active' : ''}`}
            onClick={() => {
              setRole('student');
              setError(null);
              setValidationError('');
            }}
            disabled={loading}
          >
            <div className="role-icon-box">
              <GraduationCap size={24} />
            </div>
            <div className="role-desc">
              <h4>Student</h4>
              <p>Find guidance & seek mentorship</p>
            </div>
          </button>

          <button
            type="button"
            className={`role-select-box ${role === 'mentor' ? 'active' : ''}`}
            onClick={() => {
              setRole('mentor');
              setError(null);
              setValidationError('');
            }}
            disabled={loading}
          >
            <div className="role-icon-box">
              <Users size={24} />
            </div>
            <div className="role-desc">
              <h4>Mentor</h4>
              <p>Guide others & share knowledge</p>
            </div>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Display validation or server errors */}
          {(validationError || error) && (
            <div className="auth-error-alert">
              <span>{validationError || error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <input
                type="text"
                id="name"
                placeholder="Jane Doe"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                  setValidationError('');
                }}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-with-icon">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                id="email"
                placeholder="jane@example.com"
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
                placeholder="Min. 6 characters"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  setError(null);
                  setValidationError('');
                }}
                disabled={loading}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
            style={{ marginTop: '16px' }}
          >
            {loading ? (
              <div className="auth-button-spinner"></div>
            ) : (
              <>
                <span>Register as {role === 'student' ? 'Student' : 'Mentor'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="auth-card-footer">
          <p>
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
