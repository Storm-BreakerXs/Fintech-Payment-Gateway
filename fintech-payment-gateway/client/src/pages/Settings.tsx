import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  User, 
  Bell, 
  Shield, 
  Wallet, 
  Globe, 
  CheckCircle
} from 'lucide-react'

const settingsSections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'wallets', label: 'Connected Wallets', icon: Wallet },
  { id: 'preferences', label: 'Preferences', icon: Globe },
]

export default function Settings() {
  const [activeSection, setActiveSection] = useState('profile')
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-slate-400">Manage your account and preferences</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="glass rounded-2xl border border-slate-700 overflow-hidden">
            {settingsSections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-6 py-4 text-left transition-all ${
                    activeSection === section.id
                      ? 'bg-emerald-500/20 text-emerald-400 border-l-4 border-emerald-500'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{section.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-8 border border-slate-700"
          >
            {activeSection === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Profile Settings</h2>

                <div className="flex items-center space-x-6 mb-8">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 flex items-center justify-center text-3xl font-bold">
                    JD
                  </div>
                  <div>
                    <button className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm hover:bg-slate-700 transition-colors">
                      Change Avatar
                    </button>
                    <p className="text-sm text-slate-400 mt-2">JPG, PNG or GIF. Max 2MB.</p>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">First Name</label>
                    <input
                      type="text"
                      defaultValue="John"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Last Name</label>
                    <input
                      type="text"
                      defaultValue="Doe"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                    <input
                      type="email"
                      defaultValue="john@example.com"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Phone</label>
                    <input
                      type="tel"
                      defaultValue="+1 (555) 123-4567"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Notification Preferences</h2>

                <div className="space-y-4">
                  {[
                    { label: 'Payment confirmations', desc: 'Receive notifications when payments are completed', default: true },
                    { label: 'Failed transactions', desc: 'Get alerted about failed or declined transactions', default: true },
                    { label: 'Weekly reports', desc: 'Receive weekly summary of your payment activity', default: false },
                    { label: 'Price alerts', desc: 'Get notified about significant crypto price changes', default: true },
                    { label: 'Security alerts', desc: 'Important security notifications and login attempts', default: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                      <div>
                        <div className="font-medium">{item.label}</div>
                        <div className="text-sm text-slate-400">{item.desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Security Settings</h2>

                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-emerald-400">Two-Factor Authentication Enabled</div>
                    <div className="text-sm text-slate-400">Your account is protected with 2FA</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Current Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <h3 className="font-semibold mb-4">Active Sessions</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                          <Globe className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <div className="font-medium">Chrome on MacOS</div>
                          <div className="text-sm text-slate-400">Current session • San Francisco, CA</div>
                        </div>
                      </div>
                      <span className="text-xs text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">Active</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'wallets' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Connected Wallets</h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-emerald-500/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl">
                        🦊
                      </div>
                      <div>
                        <div className="font-medium">MetaMask</div>
                        <div className="text-sm text-slate-400 font-mono">0x742d...bEb</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-sm text-emerald-400">Connected</span>
                    </div>
                  </div>

                  <button className="w-full flex items-center justify-center space-x-2 p-4 border-2 border-dashed border-slate-700 rounded-xl text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400 transition-all">
                    <span className="text-2xl">+</span>
                    <span>Connect Another Wallet</span>
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Preferences</h2>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Currency</label>
                    <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors">
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="JPY">JPY - Japanese Yen</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Timezone</label>
                    <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors">
                      <option value="UTC">UTC (Coordinated Universal Time)</option>
                      <option value="EST">EST (Eastern Standard Time)</option>
                      <option value="PST">PST (Pacific Standard Time)</option>
                      <option value="GMT">GMT (Greenwich Mean Time)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-2">Language</label>
                    <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-emerald-500 transition-colors">
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
              {saved && (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2 text-emerald-400"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Changes saved successfully!</span>
                </motion.div>
              )}
              <div className="flex-1"></div>
              <button
                onClick={handleSave}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-blue-500 text-white font-semibold hover:shadow-lg hover:shadow-emerald-500/25 transition-all btn-lift"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
