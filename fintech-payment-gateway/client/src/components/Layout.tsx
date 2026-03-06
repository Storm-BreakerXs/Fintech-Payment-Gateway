import { ReactNode, Suspense, lazy } from 'react'
import Navbar from './Navbar'
import Footer from './Footer'

const PriceTicker = lazy(() => import('./PriceTicker'))

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Suspense fallback={<div className="h-[41px] border-b border-slate-800 bg-slate-900/70" />}>
        <PriceTicker />
      </Suspense>
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  )
}
