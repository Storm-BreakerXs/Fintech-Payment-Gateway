import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useWeb3Store } from './hooks/useWeb3'
import Layout from './components/Layout'
import Home from './pages/Home'
import Payment from './pages/Payment'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Settings from './pages/Settings'
import Auth from './pages/Auth'
import SitePage from './pages/SitePage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const { initialize } = useWeb3Store()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
        <Route path="/register" element={<Navigate to="/auth?mode=register" replace />} />
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
        <Route path="/:slug" element={<SitePage />} />
      </Routes>
    </Layout>
  )
}

export default App
