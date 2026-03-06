import { useMemo, useState } from 'react'
import { MessageSquare, Send, Sparkles, UserRound, Building2, Globe2, Mail, PhoneCall } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiRequest } from '../utils/api'
import { executeRecaptcha, isRecaptchaEnabled } from '../utils/recaptcha'
import { visualAssets } from '../content/visualAssets'

interface ChatMessage {
  role: 'assistant' | 'user'
  text: string
}

const initialMessages: ChatMessage[] = [
  {
    role: 'assistant',
    text: 'Hi, I am the FinPay Sales Assistant. Tell me what you want to launch and I will guide your next step.',
  },
]

const volumeOptions = [
  'Under $50k / month',
  '$50k - $250k / month',
  '$250k - $1M / month',
  '$1M - $10M / month',
  '$10M+ / month',
]

const contactOptions = ['Email', 'Phone', 'WhatsApp', 'Telegram'] as const
type ContactMethod = typeof contactOptions[number]

interface SalesForm {
  fullName: string
  workEmail: string
  companyName: string
  role: string
  country: string
  monthlyVolume: string
  preferredContact: ContactMethod
  message: string
}

function generateAssistantReply(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes('api') || lower.includes('developer')) {
    return 'For API onboarding, we usually start with checkout, then webhooks, then payout setup by region. Submit the form to book an integration call.'
  }
  if (lower.includes('compliance') || lower.includes('kyc') || lower.includes('aml')) {
    return 'For compliance-heavy flows, our team will map KYC states, transaction limits, and reporting requirements before go-live.'
  }
  if (lower.includes('pricing') || lower.includes('fee') || lower.includes('cost')) {
    return 'Pricing depends on volume, corridors, and payout methods. Share your monthly volume and target countries in the form for a tailored quote.'
  }
  if (lower.includes('remittance') || lower.includes('payroll') || lower.includes('payout')) {
    return 'For payout programs, we design routing and retry logic first, then settlement and treasury rules by region.'
  }
  return 'Understood. Add your use case and monthly volume in the form, and we will connect you with the right specialist.'
}

export default function ContactSales() {
  const [submitting, setSubmitting] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [form, setForm] = useState<SalesForm>({
    fullName: '',
    workEmail: '',
    companyName: '',
    role: '',
    country: '',
    monthlyVolume: volumeOptions[1],
    preferredContact: contactOptions[0],
    message: '',
  })
  const recaptchaEnabled = isRecaptchaEnabled()

  const completion = useMemo(() => {
    const fields = [form.fullName, form.workEmail, form.companyName, form.role, form.country, form.message]
    const filled = fields.filter((value) => value.trim().length > 0).length
    return Math.round((filled / fields.length) * 100)
  }, [form])

  const onSendChat = () => {
    const text = chatInput.trim()
    if (!text) return

    setMessages((prev) => [
      ...prev,
      { role: 'user', text },
      { role: 'assistant', text: generateAssistantReply(text) },
    ])
    setChatInput('')
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const captchaToken = await executeRecaptcha('contact_sales')
      const data = await apiRequest<{ message: string }>('/users/contact-sales', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          sourcePath: window.location.pathname,
          ...(captchaToken ? { captchaToken } : {}),
        }),
      })

      toast.success(data.message)
      setForm({
        fullName: '',
        workEmail: '',
        companyName: '',
        role: '',
        country: '',
        monthlyVolume: volumeOptions[1],
        preferredContact: contactOptions[0],
        message: '',
      })
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not submit contact request.'
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-cyan-300/30 bg-gradient-to-br from-cyan-500/15 via-blue-500/10 to-slate-900/40 p-6 sm:p-10">
        <div className="absolute inset-0 grid-bg opacity-25" />
        <div className="relative grid lg:grid-cols-[1.1fr,0.9fr] gap-8">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/35 bg-cyan-400/15 px-4 py-2 text-cyan-100 text-xs uppercase tracking-[0.2em]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Contact Sales</span>
            </div>
            <h1 className="text-3xl sm:text-5xl text-white leading-tight">Talk to Sales and Launch Faster.</h1>
            <p className="text-slate-200/90 text-base sm:text-lg max-w-2xl">
              Submit your requirements or chat with the FinPay assistant. We will connect you with the right team for your goals.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-cyan-100 uppercase tracking-[0.18em]">Response SLA</p>
                <p className="text-white font-semibold mt-1">Within 24 hours</p>
              </div>
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-cyan-100 uppercase tracking-[0.18em]">Discovery Call</p>
                <p className="text-white font-semibold mt-1">30-45 minutes</p>
              </div>
              <div className="home-surface rounded-xl border border-slate-500/30 p-3">
                <p className="text-xs text-cyan-100 uppercase tracking-[0.18em]">Launch Plan</p>
                <p className="text-white font-semibold mt-1">Custom by region</p>
              </div>
            </div>
          </div>

          <div className="home-surface rounded-2xl border border-slate-500/30 p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-100">Submission Progress</p>
            <div className="mt-3 w-full h-2 rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-blue-500" style={{ width: `${completion}%` }} />
            </div>
            <p className="text-sm text-slate-300 mt-2">{completion}% complete</p>
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-[1.05fr,0.95fr] gap-6">
        <form onSubmit={onSubmit} className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-8 space-y-5">
          <h2 className="text-2xl text-white">Sales Request Form</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-sm text-slate-300 flex items-center gap-2"><UserRound className="w-4 h-4" /> Full Name</span>
              <input
                value={form.fullName}
                onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl text-white"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300 flex items-center gap-2"><Mail className="w-4 h-4" /> Work Email</span>
              <input
                type="email"
                value={form.workEmail}
                onChange={(e) => setForm((prev) => ({ ...prev, workEmail: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl text-white"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300 flex items-center gap-2"><Building2 className="w-4 h-4" /> Company Name</span>
              <input
                value={form.companyName}
                onChange={(e) => setForm((prev) => ({ ...prev, companyName: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl text-white"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300 flex items-center gap-2"><PhoneCall className="w-4 h-4" /> Your Role</span>
              <input
                value={form.role}
                onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl text-white"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300 flex items-center gap-2"><Globe2 className="w-4 h-4" /> Country</span>
              <input
                value={form.country}
                onChange={(e) => setForm((prev) => ({ ...prev, country: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl text-white"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm text-slate-300">Monthly Volume</span>
              <select
                value={form.monthlyVolume}
                onChange={(e) => setForm((prev) => ({ ...prev, monthlyVolume: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl text-white"
              >
                {volumeOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-sm text-slate-300">Preferred Contact</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {contactOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, preferredContact: option }))}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    form.preferredContact === option
                      ? 'border-cyan-300/60 bg-cyan-400/15 text-cyan-100'
                      : 'border-slate-600 bg-slate-900/70 text-slate-300'
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </label>

          <label className="space-y-2 block">
            <span className="text-sm text-slate-300">Tell us your use case</span>
            <textarea
              value={form.message}
              onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
              className="w-full px-4 py-3 min-h-[130px] bg-slate-900/80 border border-slate-600 rounded-xl text-white"
              required
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-semibold disabled:opacity-70"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? 'Submitting...' : 'Submit Sales Request'}</span>
          </button>

          {recaptchaEnabled && (
            <p className="text-xs text-slate-400">Protected by reCAPTCHA.</p>
          )}
        </form>

        <div className="home-surface rounded-3xl border border-slate-500/30 p-6 sm:p-8 flex flex-col">
          <img
            src={visualAssets.salesConversation.src}
            alt={visualAssets.salesConversation.alt}
            className="h-36 w-full rounded-2xl object-cover border border-slate-500/25 mb-4"
            loading="lazy"
          />
          <h2 className="text-2xl text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-200" />
            FinPay Sales Assistant
          </h2>
          <div className="mt-4 flex-1 rounded-2xl border border-slate-500/25 bg-slate-950/35 p-4 space-y-3 overflow-auto min-h-[320px] max-h-[460px]">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === 'assistant'
                    ? 'bg-cyan-500/15 border border-cyan-300/25 text-cyan-50'
                    : 'bg-slate-700/55 border border-slate-500/40 text-slate-100 ml-8'
                }`}
              >
                {message.text}
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  onSendChat()
                }
              }}
              placeholder="Ask about pricing, APIs, compliance, or rollout..."
              className="flex-1 px-4 py-3 bg-slate-900/80 border border-slate-600 rounded-xl text-white"
            />
            <button
              type="button"
              onClick={onSendChat}
              className="px-4 py-3 rounded-xl bg-slate-100 text-slate-900 font-semibold"
            >
              Send
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
