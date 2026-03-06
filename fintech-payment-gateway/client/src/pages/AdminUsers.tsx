import { useEffect, useMemo, useState } from 'react'
import { Download, Search, Users } from 'lucide-react'
import { API_BASE_URL, apiRequest } from '../utils/api'
import { getAuthToken } from '../utils/auth'

interface AdminUserRecord {
  _id: string
  email: string
  firstName: string
  lastName: string
  role?: 'user' | 'admin'
  phone?: string
  emailVerified?: boolean
  kycStatus?: 'pending' | 'verified' | 'rejected'
  walletAddress?: string
  createdAt?: string
  updatedAt?: string
}

interface AdminUsersResponse {
  users: AdminUserRecord[]
  pagination: {
    page: number
    limit: number
    totalUsers: number
    totalPages: number
  }
}

const PAGE_SIZE = 25

function formatDate(value?: string): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function buildQuery(page: number, search: string): string {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(PAGE_SIZE),
  })

  if (search.trim()) {
    params.set('search', search.trim())
  }

  return params.toString()
}

export default function AdminUsers() {
  const [users, setUsers] = useState<AdminUserRecord[]>([])
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    let active = true

    async function loadUsers() {
      setIsLoading(true)
      setError('')

      try {
        const query = buildQuery(page, search)
        const response = await apiRequest<AdminUsersResponse>(
          `/admin/users?${query}`,
          { method: 'GET' },
          true
        )

        if (!active) return
        setUsers(response.users)
        setTotalPages(Math.max(response.pagination.totalPages || 1, 1))
        setTotalUsers(response.pagination.totalUsers || 0)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Unable to load users.')
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    }

    loadUsers()

    return () => {
      active = false
    }
  }, [page, search])

  const pageSummary = useMemo(() => {
    if (totalUsers === 0) return '0 users'
    const start = (page - 1) * PAGE_SIZE + 1
    const end = Math.min(page * PAGE_SIZE, totalUsers)
    return `${start}-${end} of ${totalUsers}`
  }, [page, totalUsers])

  async function handleExportCsv() {
    setIsExporting(true)
    setError('')

    try {
      const token = getAuthToken()
      if (!token) {
        throw new Error('You need to log in to export users.')
      }

      const params = new URLSearchParams()
      if (search.trim()) {
        params.set('search', search.trim())
      }

      const endpoint = `${API_BASE_URL}/admin/users/export.csv${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const payload = await response.text()
        throw new Error(payload || 'Failed to export users.')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'finpay-users.csv'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to export users.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Management</h1>
            <p className="mt-2 text-slate-300">View registered users, search records, and export CSV.</p>
          </div>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-lg border border-cyan-400/40 bg-cyan-500/10 px-4 py-2 text-cyan-100 transition hover:bg-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export CSV'}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/60 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by email, name, phone, or wallet"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/80 py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/50 focus:outline-none"
              />
            </label>
            <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm text-slate-300">
              <Users className="h-4 w-4" />
              <span>{pageSummary}</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="bg-slate-950/70 text-left text-slate-300">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">KYC</th>
                  <th className="px-4 py-3 font-medium">Verified</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id} className="bg-slate-900/40 hover:bg-slate-900/70">
                      <td className="px-4 py-3 text-slate-200">{`${user.firstName || ''} ${user.lastName || ''}`.trim() || '-'}</td>
                      <td className="px-4 py-3 text-slate-300">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${user.role === 'admin' ? 'bg-cyan-500/20 text-cyan-100' : 'bg-slate-700/70 text-slate-200'}`}>
                          {user.role || 'user'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-300">{user.kycStatus || 'pending'}</td>
                      <td className="px-4 py-3 text-slate-300">{user.emailVerified ? 'Yes' : 'No'}</td>
                      <td className="px-4 py-3 text-slate-300">{formatDate(user.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page <= 1 || isLoading}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">Page {page} of {Math.max(totalPages, 1)}</span>
            <button
              type="button"
              onClick={() => setPage((prev) => Math.min(prev + 1, Math.max(totalPages, 1)))}
              disabled={page >= totalPages || isLoading}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
