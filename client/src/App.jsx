import { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LoadingProvider } from './context/LoadingContext';
import BrandLoader from './components/BrandLoader';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import StudentDashboardHome from './pages/StudentDashboardHome';
import MentorDashboardHome from './pages/MentorDashboardHome';
import MentorListingPage from './pages/MentorListingPage';
import StudentRequestsPage from './pages/StudentRequestsPage';
import MentorRequestsPage from './pages/MentorRequestsPage';
import MessagesPage from './pages/MessagesPage';
import SessionsPage from './pages/SessionsPage';

function AppContent({ theme, toggleTheme }) {
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith('/student') || location.pathname.startsWith('/mentor');

  // Initial website open loader
  const [initialLoading, setInitialLoading] = useState(true);
  // Route change transition loader
  const [routeTransitioning, setRouteTransitioning] = useState(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    // Show interactive brand loader when opening website first time
    const timer = setTimeout(() => {
      setInitialLoading(false);
    }, 850);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Show interactive brand loader when navigating from one page to another
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname;
      setRouteTransitioning(true);
      const timer = setTimeout(() => {
        setRouteTransitioning(false);
      }, 420);
      return () => clearTimeout(timer);
    }
  }, [location.pathname]);

  return (
    <>
      {(initialLoading || routeTransitioning) && <BrandLoader fullScreen={true} />}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {!isDashboardRoute && <Navbar theme={theme} onToggleTheme={toggleTheme} />}
        <div style={{ flexGrow: 1, display: isDashboardRoute ? 'flex' : 'block' }}>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Student Protected Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student']}>
                  <DashboardLayout theme={theme} onToggleTheme={toggleTheme} />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StudentDashboardHome />} />
              <Route path="mentors" element={<MentorListingPage />} />
              <Route path="requests" element={<StudentRequestsPage />} />
              <Route path="sessions" element={<SessionsPage />} />
              <Route path="messages" element={<MessagesPage />} />
            </Route>

            {/* Mentor Protected Routes */}
            <Route
              path="/mentor"
              element={
                <ProtectedRoute allowedRoles={['mentor']}>
                  <DashboardLayout theme={theme} onToggleTheme={toggleTheme} />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<MentorDashboardHome />} />
              <Route path="requests" element={<MentorRequestsPage />} />
              <Route path="sessions" element={<SessionsPage />} />
              <Route path="messages" element={<MessagesPage />} />
            </Route>

            {/* Fallback Route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('mentorconnect-theme') || 'light');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('mentorconnect-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <AuthProvider>
      <LoadingProvider>
        <Router>
          <AppContent theme={theme} toggleTheme={toggleTheme} />
        </Router>
      </LoadingProvider>
    </AuthProvider>
  );
}

export default App;