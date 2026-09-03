import { NavLink } from 'react-router-dom'
import { LayoutDashboard, ArrowLeftRight, LineChart, ListOrdered, Users, BarChart3, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transfer', label: 'Transfer', icon: ArrowLeftRight },
  { to: '/trade', label: 'Trade', icon: LineChart },
  { to: '/activity', label: 'Activity', icon: ListOrdered },
  { to: '/payees', label: 'Payees', icon: Users },
  { to: '/kpi', label: 'Insights', icon: BarChart3 },
]

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-bg">
      <header className="border-b border-border bg-surface">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-lg font-semibold tracking-tight text-text-primary">Latchpoint</span>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm transition-colors duration-150 ease-out ${
                      isActive
                        ? 'bg-surface-alt text-text-primary'
                        : 'text-text-secondary hover:bg-surface-alt'
                    }`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-secondary">{user?.name}</span>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-sm px-3 py-2 text-sm text-text-secondary hover:bg-surface-alt transition-colors duration-150 ease-out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
