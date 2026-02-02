import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Auth from './components/Auth';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import GeneratorPage from './pages/GeneratorPage';
import ApplicationDetails from './pages/ApplicationDetails';
import OnboardingPage from './pages/OnboardingPage';
import PublicPortfolio from './pages/PublicPortfolio';
import PublicHome from './pages/PublicHome';
import LandingPage from './pages/LandingPage';
import * as SupabaseService from './services/supabaseService';
import { Loader2 } from 'lucide-react';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        if (location.pathname === '/admin/onboarding') {
          setCheckingProfile(false);
          return;
        }

        const profile = await SupabaseService.getProfile(user.id);
        if (profile && profile.fullName) {
          setHasProfile(true);
        } else {
          setHasProfile(false);
        }
      }
      setCheckingProfile(false);
    };

    if (!loading) {
      checkProfile();
    }
  }, [user, loading, location.pathname]);

  if (loading || checkingProfile) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!user) return <Navigate to="/login" />;

  if (!hasProfile && location.pathname !== '/admin/onboarding') {
    return <Navigate to="/admin/onboarding" />;
  }

  return <>{children}</>;
};

// Admin Layout with unified navbar
const AdminLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      <Navbar variant="admin" />
      <main className="pt-16">
        <Outlet />
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* ========== PUBLIC ROUTES ========== */}

            {/* Public Home - User's portfolio at root */}
            <Route path="/" element={<PublicHome />} />

            {/* Login page */}
            <Route path="/login" element={<Auth />} />

            {/* Public portfolio by slug (for tailored applications) */}
            <Route path="/p/:slug" element={<PublicPortfolio />} />

            {/* ========== PROTECTED ADMIN ROUTES ========== */}

            {/* Onboarding - no navbar */}
            <Route path="/admin/onboarding" element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            } />

            {/* Admin routes with unified navbar */}
            <Route element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }>
              <Route path="/admin" element={<LandingPage />} />
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/new" element={<GeneratorPage />} />
              <Route path="/admin/application/:id" element={<ApplicationDetails />} />
            </Route>

            {/* Fallback - redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
