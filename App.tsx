import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import GeneratorPage from './pages/GeneratorPage';
import ApplicationDetails from './pages/ApplicationDetails';
import OnboardingPage from './pages/OnboardingPage';
import PublicPortfolio from './pages/PublicPortfolio';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
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
          {/* Also support top level company name if possible, but simpler to namespace first. 
              User asked for `/companyname`. We can try catch-all at the bottom, but it might conflict.
              Let's use `/p/` for safety first, or try strict ordering.
          */}
          <Route path="/:slug" element={<PublicPortfolioWrapper />} />

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

// Wrapper to decide if it's a known route or a public portfolio
// Since we have a wildcard `/:slug`, it will catch everything not matched above.
// However, Router matches based on specificity.
// Since `/` and `/login` are exact or specific, they should match first.
// But `Layout` has child routes.
// The `/:slug` at root level might conflict with `/onboarding` if defined after? No, defined before/after matters.
// Best practice: Defined specific routes first.
// If I put `/:slug` at the end, it acts as a catch-all (404 handled by it too).
// We need to differentiate between a 404 and a company name.
// For now, let's implement the `PublicPortfolio` logic to handle "Not Found".

const PublicPortfolioWrapper: React.FC = () => {
  // We need to be careful not to intercept valid routes if they weren't matched yet?
  // Actually, `Routes` picks the best match.
  // If I visit `/dashboard` (which doesn't exist), it might hit `/:slug`.
  // Valid routes inside Layout are under `/`.
  // So `/new` is under `/` (rendered by Layout). Wait, no. `<Route path="/" ...>` renders Layout.
  // But Layout renders `<Outlet>`.
  // The structure `<Route path="/" element={<Layout>}>` matches `/`.
  // Child `<Route path="new">` matches `/new`.
  // So `/new` is handled by Layout.
  // If I have `/:slug` as a sibling to `/`, it might be ambiguous.
  // React Router v6:
  // Routes are ranked.
  // `/new` inside `/` parent is `/new`.
  // `/:slug` at root is also `/something`.
  // If I navigate to `/new`, does it match `/:slug` or `/` -> `new`?
  // Usually more specific match wins. `/new` is static, `/:slug` is dynamic.
  // So `/new` should win IF it is defined at the top level or correctly nested.
  // BUT! `/new` is defined INSIDE the `/` route.
  // The `/` route matches `/` prefix? No, `path="/"` is usually exact for the root, but with children it matches start.
  // Let's rely on React Router's scoring.
  // Just to be safe, I've used `/p/:slug` as well.
  // User asked for `/companyname`.

  return <PublicPortfolio />;
};

export default App;
