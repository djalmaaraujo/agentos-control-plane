import { NavLink } from 'react-router-dom'
import { PanelLeftClose, PanelLeft, User } from 'lucide-react'
import { NAV } from '@/lib/nav'
import { useOS } from '@/lib/osContext'
import { cn } from '@/lib/utils'

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="flex items-center gap-2 px-1 py-1">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent font-mono text-sm font-bold text-black">
        A
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-sm font-semibold text-fg">Control Plane</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-faint">
            AgentOS
          </div>
        </div>
      )}
    </div>
  )
}

export function Sidebar({
  collapsed,
  onToggle
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const { approvalsCount } = useOS()
  return (
    <aside
      className={cn(
        'flex h-full shrink-0 flex-col border-r border-border-soft bg-panel transition-[width]',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex items-center justify-between px-3 py-4">
        <Logo collapsed={collapsed} />
        <button
          onClick={onToggle}
          className={cn('rounded-md p-1.5 text-faint hover:bg-hover hover:text-fg', collapsed && 'mx-auto')}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {NAV.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-accent-dim text-accent'
                      : 'text-muted hover:bg-hover hover:text-fg'
                  )
                }
              >
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.75} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.to === '/approvals' && approvalsCount > 0 && (
                  <span className="ml-auto rounded-full bg-accent px-1.5 py-0.5 font-mono text-[10px] font-medium text-black">
                    {approvalsCount}
                  </span>
                )}
              </NavLink>
              {!collapsed &&
                item.children?.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    className={({ isActive }) =>
                      cn(
                        'ml-8 flex items-center rounded-md px-3 py-1.5 text-[13px] transition-colors',
                        isActive ? 'text-accent' : 'text-faint hover:text-fg'
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
        <div className={cn('flex items-center gap-2', collapsed && 'justify-center')}>
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-card-hover text-muted">
            <User className="h-3.5 w-3.5" />
          </div>
          {!collapsed && <div className="text-[13px] text-muted">Control Plane</div>}
        </div>
      </div>
    </aside>
  )
}
