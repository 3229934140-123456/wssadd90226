import { NavLink } from 'react-router-dom'
import { Users, Clock, ScanLine, CheckCircle, FileText, Settings, LayoutGrid } from 'lucide-react'

const navItems = [
  { to: '/', icon: Users, label: '排队墙' },
  { to: '/overview', icon: LayoutGrid, label: '值守总览' },
  { to: '/rooms', icon: Clock, label: '房间计时' },
  { to: '/scan', icon: ScanLine, label: '扫码开麻' },
  { to: '/confirm-select', icon: CheckCircle, label: '完成确认' },
  { to: '/records', icon: FileText, label: '今日记录' },
  { to: '/settings', icon: Settings, label: '设置' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-brand-surface border-t border-brand-border z-50">
      <div className="flex items-center justify-around h-14 max-w-screen-xl mx-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-1.5 py-1 rounded-lg transition-colors min-w-[46px] ${
                isActive
                  ? 'text-brand-mint'
                  : 'text-brand-text-muted hover:text-brand-text-dim'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[8px] font-medium leading-tight ${isActive ? 'text-brand-mint' : ''}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
