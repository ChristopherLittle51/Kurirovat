import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import GeneratorPage from './pages/GeneratorPage';
import ApplicationDetails from './pages/ApplicationDetails';
import OnboardingPage from './pages/OnboardingPage';
import PublicPortfolio from './pages/PublicPortfolio';
import * as SupabaseService from './services/supabaseService';
import { Loader2 } from 'lucide-react';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false); // Default false until checked
  const location = useLocation();

  useEffect(() => {
    const checkProfile = async () => {
      if (user) {
        if (location.pathname === '/onboarding') {
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

  if (!hasProfile && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Auth />} />
          {/* Use specific prefix for public portfolio to avoid collision or requiring complex routing logic */}
          <Route path="/p/:slug" element={<PublicPortfolio />} />



          {/* Protected Routes */}
          <Route path="/onboarding" element={
            <ProtectedRoute>
              <OnboardingPage />
            </ProtectedRoute>
          } />

          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="new" element={<GeneratorPage />} />
            <Route path="application/:id" element={<ApplicationDetails />} />
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
};





export default App;
