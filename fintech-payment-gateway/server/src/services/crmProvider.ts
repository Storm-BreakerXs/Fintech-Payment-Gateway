import axios from 'axios'
import crypto from 'crypto'
import { config } from '../config/env'
import { logger } from '../utils/logger'

export interface SalesLeadPayload {
  fullName: string
  workEmail: string
  companyName: string
  role: string
  country: string
  monthlyVolume: string
  preferredContact: string
  message: string
  sourcePath?: string
  referrer?: string
  userAgent?: string
  ipAddress?: string
  submittedAt?: string
}

interface FailedProvider {
  provider: string
  reason: string
}

export interface CrmDispatchResult {
  attemptedProviders: string[]
  successfulProviders: string[]
  failedProviders: FailedProvider[]
}

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return { firstName: 'Unknown', lastName: 'Lead' }
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Lead' }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  }
}

function getPrimaryClientUrl(): string {
  const clientUrls = (config.clientUrl || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)

  return clientUrls[0] || 'https://finpay.com.ng'
}

function buildPageUri(payload: SalesLeadPayload): string {
  const origin = getPrimaryClientUrl().replace(/\/$/, '')
  const requestedPath = (payload.sourcePath || '').trim()
  const path = requestedPath.startsWith('/') ? requestedPath : '/contact-sales'
  return `${origin}${path}`
}

function buildSignatureHeader(body: string): string {
  if (!config.crmWebhookSecret) {
    return ''
  }

  return crypto
    .createHmac('sha256', config.crmWebhookSecret)
    .update(body)
    .digest('hex')
}

function extractAxiosError(error: unknown): string {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Unknown error'
  }

  const status = error.response?.status
  const statusText = error.response?.statusText || ''
  const payloadRaw = error.response?.data
  const payload = typeof payloadRaw === 'string'
    ? payloadRaw
    : payloadRaw
      ? JSON.stringify(payloadRaw)
      : ''

  const compactPayload = payload.replace(/\s+/g, ' ').slice(0, 260)
  const prefix = status ? `${status} ${statusText}`.trim() : 'Request failed'

  return compactPayload ? `${prefix} - ${compactPayload}` : `${prefix} - ${error.message}`
}

function buildBearerToken(token: string): string {
  const normalized = token.trim()
  if (!normalized) return ''
  if (/^bearer\s+/i.test(normalized) || /^basic\s+/i.test(normalized)) {
    return normalized
  }
  return `Bearer ${normalized}`
}

function setDynamicField(record: Record<string, unknown>, fieldName: string, value: unknown): void {
  const normalizedFieldName = (fieldName || '').trim()
  if (!normalizedFieldName) {
    return
  }

  record[normalizedFieldName] = value
}

function toWebhookPayload(payload: SalesLeadPayload): Record<string, unknown> {
  return {
    event: 'sales.lead.created',
    source: 'finpay.contact-sales',
    submittedAt: payload.submittedAt || new Date().toISOString(),
    lead: {
      fullName: payload.fullName,
      workEmail: payload.workEmail,
      companyName: payload.companyName,
      role: payload.role,
      country: payload.country,
      monthlyVolume: payload.monthlyVolume,
      preferredContact: payload.preferredContact,
      message: payload.message,
    },
    context: {
      sourcePath: payload.sourcePath || '/contact-sales',
      referrer: payload.referrer || '',
      userAgent: payload.userAgent || '',
      ipAddress: payload.ipAddress || '',
    },
  }
}

function buildSalesforceLeadRecord(payload: SalesLeadPayload): Record<string, unknown> {
  const { firstName, lastName } = splitName(payload.fullName)
  const record: Record<string, unknown> = {
    FirstName: firstName,
    LastName: lastName,
    Company: payload.companyName || 'Unknown',
    Email: payload.workEmail,
    Title: payload.role,
    Country: payload.country,
    Description: payload.message,
    LeadSource: config.crmLeadSourceLabel,
  }

  setDynamicField(
    record,
    config.salesforceFieldMonthlyVolume || 'Monthly_Volume__c',
    payload.monthlyVolume
  )
  setDynamicField(
    record,
    config.salesforceFieldPreferredContact || 'Preferred_Contact__c',
    payload.preferredContact
  )

  return record
}

function hubSpotConfigured(): boolean {
  return Boolean(config.hubspotPortalId && config.hubspotFormId)
}

async function submitToHubSpot(payload: SalesLeadPayload): Promise<void> {
  if (!hubSpotConfigured()) return

  const endpoint = `https://api.hsforms.com/submissions/v3/integration/submit/${config.hubspotPortalId}/${config.hubspotFormId}`
  const { firstName, lastName } = splitName(payload.fullName)

  const hubspotMonthlyVolumeField = config.hubspotFieldMonthlyVolume || 'monthly_volume'
  const hubspotPreferredContactField = config.hubspotFieldPreferredContact || 'preferred_contact'
  const hubspotLeadSourceField = config.hubspotFieldLeadSource || 'lead_source'

  const body = {
    submittedAt: new Date(payload.submittedAt || Date.now()).getTime(),
    fields: [
      { name: 'firstname', value: firstName },
      { name: 'lastname', value: lastName },
      { name: 'email', value: payload.workEmail },
      { name: 'company', value: payload.companyName },
      { name: 'jobtitle', value: payload.role },
      { name: 'country', value: payload.country },
      { name: hubspotMonthlyVolumeField, value: payload.monthlyVolume },
      { name: hubspotPreferredContactField, value: payload.preferredContact },
      { name: 'message', value: payload.message },
      { name: hubspotLeadSourceField, value: config.crmLeadSourceLabel },
    ],
    context: {
      pageName: 'Contact Sales',
      pageUri: buildPageUri(payload),
    },
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (config.hubspotPrivateAppToken) {
    headers.Authorization = buildBearerToken(config.hubspotPrivateAppToken)
  }

  await axios.post(endpoint, body, { headers, timeout: 12000 })
}

async function submitToSalesforceWebhook(payload: SalesLeadPayload): Promise<void> {
  if (!config.salesforceLeadWebhookUrl) return

  const body = JSON.stringify({
    ...toWebhookPayload(payload),
    salesforceLead: buildSalesforceLeadRecord(payload),
  })
  const signature = buildSignatureHeader(body)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-FinPay-Event': 'sales.lead.created',
  }
  if (signature) {
    headers['X-FinPay-Signature'] = signature
    headers['X-FinPay-Signature-Alg'] = 'hmac-sha256'
  }
  if (config.salesforceApiToken) {
    headers.Authorization = buildBearerToken(config.salesforceApiToken)
  }

  await axios.post(config.salesforceLeadWebhookUrl, body, {
    headers,
    timeout: 12000,
  })
}

async function submitToGenericCrmWebhook(payload: SalesLeadPayload): Promise<void> {
  if (!config.crmWebhookUrl) return

  const body = JSON.stringify(toWebhookPayload(payload))
  const signature = buildSignatureHeader(body)

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-FinPay-Event': 'sales.lead.created',
  }

  if (config.crmWebhookAuthToken) {
    const authHeaderName = config.crmWebhookAuthHeader || 'Authorization'
    headers[authHeaderName] = config.crmWebhookAuthToken
  }
  if (signature) {
    headers['X-FinPay-Signature'] = signature
    headers['X-FinPay-Signature-Alg'] = 'hmac-sha256'
  }

  await axios.post(config.crmWebhookUrl, body, {
    headers,
    timeout: 12000,
  })
}

export async function forwardSalesLeadToCrm(payload: SalesLeadPayload): Promise<CrmDispatchResult> {
  const attemptedProviders: string[] = []
  const successfulProviders: string[] = []
  const failedProviders: FailedProvider[] = []

  const noProviderConfigured = !hubSpotConfigured()
    && !config.salesforceLeadWebhookUrl
    && !config.crmWebhookUrl

  if (noProviderConfigured) {
    logger.warn(`CRM lead forwarding skipped (not configured) for ${payload.workEmail}`)
    return {
      attemptedProviders,
      successfulProviders,
      failedProviders,
    }
  }

  if (hubSpotConfigured()) {
    attemptedProviders.push('hubspot')
    try {
      await submitToHubSpot(payload)
      successfulProviders.push('hubspot')
    } catch (error) {
      failedProviders.push({
        provider: 'hubspot',
        reason: extractAxiosError(error),
      })
    }
  }

  if (config.salesforceLeadWebhookUrl) {
    attemptedProviders.push('salesforce')
    try {
      await submitToSalesforceWebhook(payload)
      successfulProviders.push('salesforce')
    } catch (error) {
      failedProviders.push({
        provider: 'salesforce',
        reason: extractAxiosError(error),
      })
    }
  }

  if (config.crmWebhookUrl) {
    attemptedProviders.push('generic-webhook')
    try {
      await submitToGenericCrmWebhook(payload)
      successfulProviders.push('generic-webhook')
    } catch (error) {
      failedProviders.push({
        provider: 'generic-webhook',
        reason: extractAxiosError(error),
      })
    }
  }

  if (attemptedProviders.length > 0 && successfulProviders.length === 0) {
    const detail = failedProviders.map((item) => `${item.provider}: ${item.reason}`).join('; ')
    throw new Error(`CRM delivery failed for all providers. ${detail}`)
  }

  return {
    attemptedProviders,
    successfulProviders,
    failedProviders,
  }
}
