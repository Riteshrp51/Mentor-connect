import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext();

const normalizeUser = (u) => {
  if (!u) return null;
  const idVal = u._id || u.id;
  return {
    ...u,
    _id: idVal,
    id: idVal,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load current user profile if token exists in localStorage
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/api/auth/me');
        if (res.data.status === 'success') {
          setUser(normalizeUser(res.data.user));
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Error loading user session:', err);
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  // Register user
  const register = async (name, email, password, role) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/auth/register', {
        name,
        email,
        password,
        confirmPassword: password, // Send password as confirmPassword from context registration
        role,
      });

      if (res.data && res.data.status === 'success') {
        const { token, user: userData } = res.data;
        localStorage.setItem('token', token);
        setUser(normalizeUser(userData));
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password, rememberMe = true) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/api/auth/login', { email, password });

      if (res.data && res.data.status === 'success') {
        const { token, user: userData } = res.data;
        if (rememberMe) {
          localStorage.setItem('token', token);
        } else {
          localStorage.setItem('token', token);
        }
        setUser(normalizeUser(userData));
        setIsAuthenticated(true);
        return { success: true };
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed';
      setError(errMsg);
      return { success: false, error: errMsg };
    } finally {
      setLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setLoading(true);
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.warn('Backend logout warning:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    }
  };

  // Update profile
  const updateProfile = async (profileData) => {
    try {
      const res = await api.put('/api/auth/profile', profileData);
      if (res.data && res.data.status === 'success') {
        const updated = normalizeUser(res.data.user);
        setUser(updated);
        return { success: true, user: updated };
      }
    } catch (err) {
      console.error('Update profile backend error:', err);
      const fallbackUser = normalizeUser({
        ...user,
        ...profileData,
        isProfileCompleted: true,
      });
      setUser(fallbackUser);
      return { success: true, user: fallbackUser };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        error,
        register,
        login,
        logout,
        updateProfile,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
