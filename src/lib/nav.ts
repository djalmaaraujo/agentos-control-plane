import type { LucideIcon } from 'lucide-react'
import {
  Home,
  MessageSquare,
  Play,
  ListTree,
  Brain,
  BookOpen,
  BarChart3,
  Blocks,
  ClipboardCheck,
  CalendarClock,
  GraduationCap,
  ShieldCheck,
  Server,
  Settings
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  children?: { label: string; to: string }[]
}

export const NAV: NavItem[] = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Chat', to: '/chat', icon: MessageSquare },
  { label: 'Sessions', to: '/sessions', icon: Play },
  { label: 'Traces', to: '/traces', icon: ListTree },
  { label: 'Studio', to: '/studio', icon: Blocks },
  {
    label: 'Learning',
    to: '/learning/user-memories',
    icon: GraduationCap,
    children: [
      { label: 'User Memories', to: '/learning/user-memories' },
      { label: 'User Profiles', to: '/learning/user-profiles' },
      { label: 'Entity Memories', to: '/learning/entity-memories' },
      { label: 'Session Context', to: '/learning/session-context' },
      { label: 'Decision Logs', to: '/learning/decision-logs' }
    ]
  },
  { label: 'Memory', to: '/memory', icon: Brain },
  { label: 'Knowledge', to: '/knowledge', icon: BookOpen },
  { label: 'Metrics', to: '/metrics', icon: BarChart3 },
  { label: 'Evaluations', to: '/evaluations', icon: ClipboardCheck },
  { label: 'Approvals', to: '/approvals', icon: ShieldCheck },
  { label: 'Scheduler', to: '/scheduler', icon: CalendarClock },
  {
    label: 'Manage OS',
    to: '/manage/service-accounts',
    icon: Server,
    children: [
      { label: 'Service Accounts', to: '/manage/service-accounts' },
      { label: 'Registry', to: '/manage/registry' },
      { label: 'Databases', to: '/manage/databases' }
    ]
  },
  { label: 'Settings', to: '/settings', icon: Settings }
]
