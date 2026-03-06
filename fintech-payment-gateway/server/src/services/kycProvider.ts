import axios from 'axios'
import { config } from '../config/env'
import { logger } from '../utils/logger'

export interface KycVerificationInput {
  userId: string
  email: string
  firstName: string
  lastName: string
  documentType: string
  documentNumber: string
  country?: string
}

export interface KycVerificationResult {
  status: 'verified' | 'rejected' | 'pending'
  providerReference?: string
  raw?: unknown
}

function normalizeKycStatus(value: string | undefined): 'verified' | 'rejected' | 'pending' {
  const normalized = (value || '').toLowerCase()
  if (normalized === 'approved' || normalized === 'verified' || normalized === 'pass') {
    return 'verified'
  }
  if (normalized === 'rejected' || normalized === 'failed' || normalized === 'declined') {
    return 'rejected'
  }
  return 'pending'
}

export async function verifyKycWithProvider(input: KycVerificationInput): Promise<KycVerificationResult> {
  if (!config.kycApiUrl || !config.kycApiKey) {
    logger.warn('KYC provider not configured. Falling back to pending status.')
    return {
      status: 'pending',
      providerReference: 'kyc-not-configured',
      raw: null,
    }
  }

  const endpoint = config.kycApiUrl.replace(/\/$/, '')

  const response = await axios.post(
    endpoint,
    {
      userId: input.userId,
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      documentType: input.documentType,
      documentNumber: input.documentNumber,
      country: input.country || 'NG',
    },
    {
      headers: {
        Authorization: `Bearer ${config.kycApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  )

  const data = response.data as any
  return {
    status: normalizeKycStatus(data?.status),
    providerReference: data?.reference || data?.id || '',
    raw: data,
  }
}
