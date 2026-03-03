import { Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import { useWeb3Store } from './hooks/useWeb3'
import Layout from './components/Layout'
import Home from './pages/Home'
import Payment from './pages/Payment'
import Dashboard from './pages/Dashboard'
import Transactions from './pages/Transactions'
import Settings from './pages/Settings'

function App() {
  const { initialize } = useWeb3Store()

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Layout>
  )
}

export default App