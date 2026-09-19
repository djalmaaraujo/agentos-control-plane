import { Routes, Route, Navigate } from 'react-router-dom'
import { Settings as SettingsIcon } from 'lucide-react'
import { Layout } from '@/components/Layout'
import { Home } from '@/pages/Home'
import { Chat } from '@/pages/Chat'
import { Sessions } from '@/pages/Sessions'
import { Traces } from '@/pages/Traces'
import { StudioList } from '@/pages/StudioList'
import { StudioEditorRoute } from '@/pages/StudioEditor'
import { Learning } from '@/pages/Learning'
import { Memory } from '@/pages/Memory'
import { Knowledge } from '@/pages/Knowledge'
import { Metrics } from '@/pages/Metrics'
import { Evaluations } from '@/pages/Evaluations'
import { Approvals } from '@/pages/Approvals'
import { Scheduler } from '@/pages/Scheduler'
import { ServiceAccounts } from '@/pages/ServiceAccounts'
import { Registry } from '@/pages/Registry'
import { Databases } from '@/pages/Databases'
import { Settings } from '@/pages/Settings'
import { Placeholder } from '@/pages/Placeholder'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="chat" element={<Chat />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="traces" element={<Traces />} />
        <Route path="studio" element={<Navigate to="/studio/agents" replace />} />
        <Route path="studio/registry" element={<Registry />} />
        <Route path="studio/:type" element={<StudioList />} />
        <Route path="studio/:type/:id" element={<StudioEditorRoute />} />
        <Route path="learning/:module" element={<Learning />} />
        <Route path="memory" element={<Memory />} />
        <Route path="knowledge" element={<Knowledge />} />
        <Route path="metrics" element={<Metrics />} />
        <Route path="evaluations" element={<Evaluations />} />
        <Route path="approvals" element={<Approvals />} />
        <Route path="scheduler" element={<Scheduler />} />
        <Route path="manage/service-accounts" element={<ServiceAccounts />} />
        <Route path="manage/databases" element={<Databases />} />
        <Route path="settings" element={<Settings />} />
        <Route
          path="*"
          element={
            <Placeholder
              title="Not found"
              icon={SettingsIcon}
              note="This route does not exist."
            />
          }
        />
      </Route>
    </Routes>
  )
}
