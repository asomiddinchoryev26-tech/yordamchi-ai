import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/hooks/useAuth'
import { PATHS } from '@/routes/paths'
import { PremiumModal } from '@/components/student/AssignmentsAI'

// paidPlan — bosilганda to'lov oqimini ochadi (mavjud PremiumModal). undefined = ro'yxatdan o'tish/dashboard.
const plans = [
  { name: 'Free', price: '$0', description: 'Perfect for getting started', features: ['5 courses', '1 GB storage', 'Community support'] },
  { name: 'Pro', price: '$29', description: 'For serious learners', features: ['Unlimited courses', '10 GB storage', 'Priority support', 'AI tutor'], paidPlan: 'pro' as const },
  { name: 'Institution', price: 'Custom', description: 'For schools and organizations', features: ['Everything in Pro', 'Custom branding', 'Dedicated manager', 'SLA guarantee'] },
] as const

export default function PricingPage() {
  const { t } = useLanguage()
  const { isAuthenticated, user } = useAuth()

  const [payOpen, setPayOpen] = useState(false)
  const [payPlan, setPayPlan] = useState<'premium' | 'pro'>('premium')

  const homePath = user?.role === 'admin' ? PATHS.ADMIN.ROOT
    : user?.role === 'teacher' ? PATHS.TEACHER.ROOT
    : PATHS.STUDENT.ROOT

  const openPay = (plan: 'premium' | 'pro') => { setPayPlan(plan); setPayOpen(true) }

  const BTN_CLASS = 'block w-full text-center py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium'

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h1 className="text-4xl font-bold mb-4">{t.ppTitle}</h1>
        <p className="text-muted-foreground mb-16">{t.ppSubtitle}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map(plan => {
            const paidPlan = 'paidPlan' in plan ? plan.paidPlan : undefined
            return (
              <div key={plan.name} className="rounded-xl border border-border bg-card p-8 text-left">
                <h2 className="text-xl font-semibold">{plan.name}</h2>
                <p className="text-3xl font-bold mt-2 mb-1">{plan.price}</p>
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                <ul className="space-y-2 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="text-sm flex items-center gap-2">
                      <span className="text-primary">✓</span> {f}
                    </li>
                  ))}
                </ul>

                {paidPlan && isAuthenticated ? (
                  <button type="button" onClick={() => openPay(paidPlan)} className={BTN_CLASS}>
                    {t.ppGetStarted}
                  </button>
                ) : (
                  <Link to={isAuthenticated ? homePath : PATHS.REGISTER} className={BTN_CLASS}>
                    {t.ppGetStarted}
                  </Link>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* To'lov oqimi — mavjud PremiumModal (Premium/Pro tanlash + chek yuklash) */}
      <PremiumModal open={payOpen} onClose={() => setPayOpen(false)} initialPlan={payPlan} />
    </div>
  )
}
