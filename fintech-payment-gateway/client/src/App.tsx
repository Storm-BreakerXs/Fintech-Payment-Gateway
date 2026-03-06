import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useWeb3Store } from './hooks/useWeb3'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

const Home = lazy(() => import('./pages/Home'))
const Payment = lazy(() => import('./pages/Payment'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Transactions = lazy(() => import('./pages/Transactions'))
const Settings = lazy(() => import('./pages/Settings'))
const Auth = lazy(() => import('./pages/Auth'))
const SitePage = lazy(() => import('./pages/SitePage'))
const ProductsPage = lazy(() => import('./pages/ProductsPage'))
const SolutionsPage = lazy(() => import('./pages/SolutionsPage'))
const CompanyPage = lazy(() => import('./pages/CompanyPage'))
const DevelopersPage = lazy(() => import('./pages/DevelopersPage'))
const ContactSales = lazy(() => import('./pages/ContactSales'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const AdminUsers = lazy(() => import('./pages/AdminUsers'))

function App() {
  const { initialize } = useWeb3Store()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Layout>
      <Suspense
        fallback={(
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="home-surface rounded-2xl border border-slate-700 p-8 text-slate-300">
              Loading...
            </div>
          </div>
        )}
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
          <Route path="/register" element={<Navigate to="/auth?mode=register" replace />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/features" element={<ProductsPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/enterprise" element={<SolutionsPage />} />
          <Route path="/company" element={<CompanyPage />} />
          <Route path="/about" element={<CompanyPage />} />
          <Route path="/developers" element={<DevelopersPage />} />
          <Route path="/documentation" element={<DevelopersPage />} />
          <Route path="/contact-sales" element={<ContactSales />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/payment" element={<Payment />} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/transactions"
            element={(
              <ProtectedRoute>
                <Transactions />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/settings"
            element={(
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/admin/users"
            element={(
              <ProtectedRoute requireAdmin>
                <AdminUsers />
              </ProtectedRoute>
            )}
          />
          <Route path="/*" element={<SitePage />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default App
