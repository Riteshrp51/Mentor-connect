import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GraduationCap, Users, ShieldAlert, CheckCircle, RefreshCw, LogOut } from 'lucide-react';
import api from '../api/axios';
import './AuthPages.css';

const DashboardPlaceholder = () => {
  const { user, logout } = useAuth();
  const [apiData, setApiData] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const navigate = useNavigate();

  const isStudent = user?.role === 'student';
  const roleName = isStudent ? 'Student' : 'Mentor';

  // Call the appropriate protected backend API to verify role authorization
  const fetchProtectedData = useCallback(async () => {
    setApiLoading(true);
    setApiError(null);
    setApiData(null);
    try {
      const endpoint = isStudent ? '/api/student/dashboard' : '/api/mentor/dashboard';
      const res = await api.get(endpoint);
      setApiData(res.data);
    } catch (err) {
      console.error('Error fetching dashboard API:', err);
      setApiError(err.response?.data?.message || 'Access Denied: Role authorization failed.');
    } finally {
      setApiLoading(false);
    }
  }, [isStudent]);

  // Run the fetch on component mount to test auth immediately
  useEffect(() => {
    if (user) {
      fetchProtectedData();
    }
  }, [user, fetchProtectedData]);

  // Attempt to call the OTHER role's API to intentionally test authorization failure (403 Forbidden)
  const testUnauthorizedAPI = async () => {
    setApiLoading(true);
    setApiError(null);
    setApiData(null);
    try {
      const endpoint = isStudent ? '/api/mentor/dashboard' : '/api/student/dashboard';
      const res = await api.get(endpoint);
      setApiData(res.data);
    } catch (err) {
      console.warn('API error expected:', err);
      setApiError(`Forbidden API Error (Expected): ${err.response?.status} - ${err.response?.data?.message || 'Unauthorized'}`);
    } finally {
      setApiLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="dashboard-container">
      <div className="dashboard-content-card">
        {/* Role Icon Header */}
        <div className="dashboard-header-block">
          <div className={`dashboard-icon-box ${isStudent ? 'student-theme' : 'mentor-theme'}`}>
            {isStudent ? <GraduationCap size={32} /> : <Users size={32} />}
          </div>
          <div>
            <span className={`role-badge ${isStudent ? 'student-theme' : 'mentor-theme'}`}>
              {roleName} Dashboard
            </span>
            <h2>Welcome, {user.name}!</h2>
            <p>You have successfully authenticated via MentorConnect Secure Auth</p>
          </div>
        </div>

        {/* Profile Details Block */}
        <div className="profile-details-grid">
          <div className="detail-item">
            <span className="detail-label">Full Name</span>
            <span className="detail-value">{user.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Email Address</span>
            <span className="detail-value">{user.email}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">Role Assigned</span>
            <span className="detail-value" style={{ textTransform: 'capitalize' }}>{user.role}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">User ID (MongoDB)</span>
            <span className="detail-value monospace-text">{user.id}</span>
          </div>
        </div>

        {/* API Verification Area */}
        <div className="api-test-area">
          <h3>Backend Role Authorization Verification</h3>
          <p>
            Verify role-based authorization rules by calling backend API endpoints.
          </p>

          <div className="api-actions-row">
            <button
              onClick={fetchProtectedData}
              className="btn btn-secondary btn-sm"
              disabled={apiLoading}
            >
              <RefreshCw size={14} className={apiLoading ? 'spin-icon' : ''} />
              Verify Access (Allowed API)
            </button>

            <button
              onClick={testUnauthorizedAPI}
              className="btn btn-outline btn-sm test-forbidden-btn"
              disabled={apiLoading}
            >
              Test Forbidden API (Access Check)
            </button>
          </div>

          {/* Results Display */}
          <div className="api-result-box">
            {apiLoading && <div className="api-message-state">Sending request to server...</div>}
            
            {!apiLoading && apiData && (
              <div className="api-success-state">
                <div className="state-header">
                  <CheckCircle size={16} className="success-icon" />
                  <strong>HTTP 200 OK — Authorized</strong>
                </div>
                <pre>{JSON.stringify(apiData, null, 2)}</pre>
              </div>
            )}

            {!apiLoading && apiError && (
              <div className="api-error-state">
                <div className="state-header">
                  <ShieldAlert size={16} className="error-icon" />
                  <strong>HTTP Forbidden / Error Check</strong>
                </div>
                <pre className="error-text">{apiError}</pre>
              </div>
            )}

            {!apiLoading && !apiData && !apiError && (
              <div className="api-message-state">No request sent yet. Click a button to test.</div>
            )}
          </div>
        </div>

        {/* Action footer */}
        <div className="dashboard-footer-actions">
          <button onClick={handleLogout} className="btn btn-primary btn-sm logout-btn">
            <LogOut size={16} />
            <span>Logout Account</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPlaceholder;
