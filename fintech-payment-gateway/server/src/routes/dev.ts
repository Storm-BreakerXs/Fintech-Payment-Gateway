import express, { Request, Response } from 'express'
import { query, validationResult } from 'express-validator'
import { asyncHandler } from '../middleware/errorHandler'
import {
  buildEmailTemplatePreview,
  EmailPreviewTemplate,
  listEmailPreviewTemplates,
} from '../utils/email'

const router = express.Router()

function isEmailPreviewTemplate(value: string): value is EmailPreviewTemplate {
  return listEmailPreviewTemplates().includes(value as EmailPreviewTemplate)
}

router.get(
  '/email-previews',
  [
    query('template').optional().isString().isLength({ min: 2, max: 64 }),
    query('format').optional().isIn(['html', 'json']),
  ],
  asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() })
    }

    const templateRaw = String(req.query.template || '').trim().toLowerCase()
    const format = String(req.query.format || 'html').trim().toLowerCase()
    const templates = listEmailPreviewTemplates()

    if (!templateRaw) {
      return res.json({
        message: 'Provide ?template=<name> to preview a FinPay email template.',
        templates,
        examples: templates.map((item) => ({
          template: item,
          html: `/api/dev/email-previews?template=${encodeURIComponent(item)}&format=html`,
          json: `/api/dev/email-previews?template=${encodeURIComponent(item)}&format=json`,
        })),
      })
    }

    if (!isEmailPreviewTemplate(templateRaw)) {
      return res.status(400).json({
        error: 'Invalid template value.',
        templates,
      })
    }

    const preview = buildEmailTemplatePreview(templateRaw)

    if (format === 'json') {
      return res.json(preview)
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.send(preview.html)
  })
)

export default router
