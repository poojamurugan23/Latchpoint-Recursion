import { NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, LineChart, ListOrdered, Users, BarChart3, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/trade', label: 'Trade', icon: LineChart },
  { to: '/activity', label: 'Activity', icon: ListOrdered },
  { to: '/payees', label: 'Payees', icon: Users },
  { to: '/kpi', label: 'Insights', icon: BarChart3 },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-border bg-white sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="font-display text-xl font-semibold tracking-tight text-accent">
              Latchpoint
            </Link>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-sm px-3 py-2 text-secondary transition-colors duration-[120ms] ease-out ${
                      isActive
                        ? 'bg-accent-tint text-accent font-medium'
                        : 'text-ink-600 hover:text-ink-900 hover:bg-bg-subtle'
                    }`
                  }
                >
                  <Icon size={16} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {user?.is_demo && (
              <span className="inline-flex items-center rounded-full border border-border px-2.5 py-0.5 text-caption font-medium text-ink-600 bg-transparent">
                Demo Mode
              </span>
            )}
            <span className="text-secondary text-ink-600">{user?.name}</span>
            <button
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
              className="flex items-center justify-center w-8 h-8 rounded-sm text-ink-600 hover:text-ink-900 hover:bg-bg-subtle transition-colors duration-[120ms] ease-out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">{children}</main>
    </div>
  )
}
