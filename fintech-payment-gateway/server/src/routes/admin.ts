import express, { Response } from 'express'
import { query, validationResult } from 'express-validator'
import { authenticateToken, requireAdmin } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { User } from '../utils/database'

const router = express.Router()

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 25
const MAX_LIMIT = 100
const MAX_EXPORT_ROWS = 5000

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalizeSearch(value: unknown): string {
  return String(value || '').trim()
}

function toPositiveInt(value: unknown, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback
  }
  return parsed
}

function sanitizeCsvCell(value: unknown): string {
  const normalized = String(value ?? '').replace(/[\r\n]+/g, ' ').trim()
  if (/^[=+\-@]/.test(normalized)) {
    return `'${normalized}`
  }
  return normalized
}

function toCsvCell(value: unknown): string {
  const escaped = sanitizeCsvCell(value).replace(/"/g, '""')
  return `"${escaped}"`
}

function formatCsv(users: any[]): string {
  const headers = [
    'id',
    'email',
    'firstName',
    'lastName',
    'role',
    'emailVerified',
    'kycStatus',
    'walletAddress',
    'createdAt',
    'updatedAt',
  ]

  const rows = users.map((user) => [
    user._id,
    user.email,
    user.firstName,
    user.lastName,
    user.role || 'user',
    user.emailVerified ? 'true' : 'false',
    user.kycStatus || 'pending',
    user.walletAddress || '',
    user.createdAt ? new Date(user.createdAt).toISOString() : '',
    user.updatedAt ? new Date(user.updatedAt).toISOString() : '',
  ])

  return [
    headers.map((header) => toCsvCell(header)).join(','),
    ...rows.map((row) => row.map((cell) => toCsvCell(cell)).join(',')),
  ].join('\n')
}

async function buildUserQuery(search: string) {
  const queryFilter: Record<string, unknown> = { isActive: true }

  if (search) {
    const pattern = new RegExp(escapeRegex(search), 'i')
    queryFilter.$or = [
      { email: pattern },
      { firstName: pattern },
      { lastName: pattern },
      { phone: pattern },
      { walletAddress: pattern },
    ]
  }

  return queryFilter
}

router.get(
  '/users',
  authenticateToken,
  requireAdmin,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: MAX_LIMIT }),
    query('search').optional().isLength({ max: 120 }),
  ],
  asyncHandler(async (req: any, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const page = toPositiveInt(req.query.page, DEFAULT_PAGE)
    const limit = Math.min(toPositiveInt(req.query.limit, DEFAULT_LIMIT), MAX_LIMIT)
    const search = normalizeSearch(req.query.search)

    const queryFilter = await buildUserQuery(search)
    const skip = (page - 1) * limit

    const [users, totalUsers] = await Promise.all([
      User.find(queryFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('email firstName lastName role phone emailVerified kycStatus walletAddress createdAt updatedAt')
        .lean(),
      User.countDocuments(queryFilter),
    ])

    return res.json({
      users,
      pagination: {
        page,
        limit,
        totalUsers,
        totalPages: Math.max(Math.ceil(totalUsers / limit), 1),
      },
    })
  })
)

router.get(
  '/users/export.csv',
  authenticateToken,
  requireAdmin,
  [
    query('search').optional().isLength({ max: 120 }),
    query('limit').optional().isInt({ min: 1, max: MAX_EXPORT_ROWS }),
  ],
  asyncHandler(async (req: any, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const search = normalizeSearch(req.query.search)
    const limit = Math.min(toPositiveInt(req.query.limit, MAX_EXPORT_ROWS), MAX_EXPORT_ROWS)
    const queryFilter = await buildUserQuery(search)

    const users = await User.find(queryFilter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('email firstName lastName role emailVerified kycStatus walletAddress createdAt updatedAt')
      .lean()

    const csv = formatCsv(users)
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="finpay-users-${timestamp}.csv"`)
    res.status(200).send(csv)
  })
)

export default router
