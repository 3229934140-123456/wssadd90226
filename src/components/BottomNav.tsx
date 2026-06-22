import { NavLink } from 'react-router-dom'
import { Users, Clock, ScanLine, CheckCircle, FileText, Settings } from 'lucide-react'

const navItems = [
  { to: '/', icon: Users, label: '\u6392\u961F\u5899' },
  { to: '/rooms', icon: Clock, label: '\u623F\u95F4\u8BA1\u65F6' },
  { to: '/scan', icon: ScanLine, label: '\u626B\u7801\u5F00\u9EBB' },
  { to: '/confirm-select', icon: CheckCircle, label: '\u5B8C\u6210\u786E\u8BA4' },
  { to: '/records', icon: FileText, label: '\u4ECA\u65E5\u8BB0\u5F55' },
  { to: '/settings', icon: Settings, label: '\u8BBE\u7F6E' },
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
              `flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg transition-colors min-w-[52px] ${
                isActive
                  ? 'text-brand-mint'
                  : 'text-brand-text-muted hover:text-brand-text-dim'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[9px] font-medium leading-tight ${isActive ? 'text-brand-mint' : ''}`}>
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
