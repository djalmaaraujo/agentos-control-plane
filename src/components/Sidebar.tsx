import { NavLink } from 'react-router-dom'
import { User } from 'lucide-react'
import { NAV } from '@/lib/nav'
import { useOS } from '@/lib/osContext'
import { cn } from '@/lib/utils'

function Logo() {
  return (
    <div className="flex items-center gap-2 px-3 py-1">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-mono text-sm font-bold text-black">
        A
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-white">Control Plane</div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-faint">
          AgentOS
        </div>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { approvalsCount } = useOS()
  return (
    <aside className="flex h-full w-60 shrink-0 flex-col border-r border-border-soft bg-panel">
      <div className="px-3 py-4">
        <Logo />
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-accent-dim text-accent'
                      : 'text-muted hover:bg-white/5 hover:text-white'
                  )
                }
              >
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                <span>{item.label}</span>
                {item.to === '/approvals' && approvalsCount > 0 && (
                  <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 font-mono text-[10px] font-medium text-black">
                    {approvalsCount}
                  </span>
                )}
              </NavLink>
              {item.children?.map((child) => (
                <NavLink
                  key={child.to}
                  to={child.to}
                  className={({ isActive }) =>
                    cn(
                      'ml-8 flex items-center rounded-md px-3 py-1.5 text-[13px] transition-colors',
                      isActive
                        ? 'text-accent'
                        : 'text-faint hover:text-white'
                    )
                  }
                >
                  {child.label}
                </NavLink>
              ))}
            </div>
          )
        })}
      </nav>
      <div className="border-t border-border-soft px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#242427] text-muted">
            <User className="h-3.5 w-3.5" />
          </div>
          <div className="text-[13px] text-muted">Control Plane</div>
        </div>
      </div>
    </aside>
  )
}
