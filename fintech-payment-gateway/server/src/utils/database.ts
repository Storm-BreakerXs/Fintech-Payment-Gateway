import mongoose from 'mongoose'
import { config } from '../config/env'
import { logger } from './logger'

export async function connectDatabase() {
  try {
    await mongoose.connect(config.mongodbUri)
    logger.info('Connected to MongoDB')
  } catch (error) {
    logger.error('MongoDB connection error:', error)
    throw error
  }
}

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
    index: true,
  },
  phone: { type: String, default: '' },
  preferredCurrency: {
    type: String,
    enum: ['USD', 'EUR', 'GBP'],
    default: 'USD'
  },
  timezone: { type: String, default: 'UTC' },
  language: { type: String, default: 'en' },
  emailVerified: { type: Boolean, default: false },
  emailVerificationOtpHash: { type: String, default: null },
  emailVerificationOtpExpiresAt: { type: Date, default: null },
  emailVerificationOtpLastSentAt: { type: Date, default: null },
  emailVerificationAttempts: { type: Number, default: 0 },
  passwordResetTokenHash: { type: String, default: null },
  passwordResetExpiresAt: { type: Date, default: null },
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecretEncrypted: { type: String, default: null },
  twoFactorTempSecretEncrypted: { type: String, default: null },
  twoFactorRecoveryCodeHash: { type: String, default: null },
  accountDeletionRequestedAt: { type: Date, default: null },
  accountDeletionScheduledFor: { type: Date, default: null },
  accountDeletionTokenHash: { type: String, default: null },
  notificationSettings: {
    paymentConfirmations: { type: Boolean, default: true },
    failedTransactions: { type: Boolean, default: true },
    weeklyReports: { type: Boolean, default: false },
    priceAlerts: { type: Boolean, default: true },
    securityAlerts: { type: Boolean, default: true },
  },
  kycStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'], 
    default: 'pending' 
  },
  kycProviderReference: { type: String, default: '' },
  walletAddress: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['card', 'crypto', 'bank'], required: true },
  amount: { type: Number, required: true },
  currency: { type: String, required: true },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  merchantName: { type: String },
  cardLast4: { type: String },
  txHash: { type: String },
  stripePaymentIntentId: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

userSchema.pre('save', function(this: any, next) {
  this.updatedAt = new Date()
  next()
})

transactionSchema.pre('save', function(this: any, next) {
  this.updatedAt = new Date()
  next()
})

transactionSchema.index({ userId: 1, createdAt: -1 })

// Payment Method Schema
const paymentMethodSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['card', 'crypto_wallet', 'bank_account'], required: true },
  last4: { type: String },
  brand: { type: String },
  expiryMonth: { type: String },
  expiryYear: { type: String },
  walletAddress: { type: String },
  chainId: { type: Number },
  isDefault: { type: Boolean, default: false },
  stripePaymentMethodId: { type: String },
  createdAt: { type: Date, default: Date.now }
})

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenId: { type: String, required: true, unique: true, index: true },
  userAgent: { type: String, default: '' },
  ipAddress: { type: String, default: '' },
  revokedAt: { type: Date, default: null },
  lastSeenAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
})

export const User = mongoose.model('User', userSchema)
export const Transaction = mongoose.model('Transaction', transactionSchema)
export const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema)
export const Session = mongoose.model('Session', sessionSchema)
