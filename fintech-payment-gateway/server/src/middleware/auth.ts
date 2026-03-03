import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../config/env'
import { User } from '../utils/database'

interface AuthRequest extends Request {
  user?: any
}

export async function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ error: 'Access token required' })
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as any
    const user = await User.findById(decoded.userId)

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'User not found or inactive' })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' })
  }
}

export function requireKyc(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.kycStatus !== 'verified') {
    return res.status(403).json({ 
      error: 'KYC verification required',
      kycStatus: req.user?.kycStatus
    })
  }
  next()
}
