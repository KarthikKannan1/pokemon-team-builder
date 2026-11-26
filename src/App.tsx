import { Suspense } from 'react'
import { VersionSelect } from './components/VersionSelect'
import { TeamSwitcher } from './components/TeamSwitcher'
import { TeamList } from './components/TeamList'
import { BoxGrid } from './components/BoxGrid'
import { PickerModal } from './components/PickerModal'
import { DetailsPanel } from './components/details/DetailsPanel'
import { DndProvider } from './components/DndProvider'
import { ContextMenu } from './components/ContextMenu'
import { Toast } from './components/Toast'

const Loading = () => <p className="text-slate-500">Loading…</p>

function Panel({
  title,
  children,
  className = '',
}: {
  title: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`rounded-2xl bg-slate-900 p-4 ${className}`}>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </h2>
      <Suspense fallback={<Loading />}>{children}</Suspense>
    </section>
  )
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-6 py-3">
        <h1 className="mr-4 text-lg font-bold">Pokémon Team Builder</h1>
        <VersionSelect />
        <TeamSwitcher />
      </header>

      {/* drag & drop works anywhere inside the provider (team ↔ box) */}
      <Suspense
        fallback={
          <div className="p-6">
            <Loading />
          </div>
        }
      >
        <DndProvider>
          {/* 40% team + box | 60% details (sticky, scrolls on its own). Stacks on small screens. */}
          <main className="grid gap-4 p-6 lg:grid-cols-[2fr_3fr] lg:items-start">
            <div className="space-y-4">
              <Panel title="Team">
                <TeamList />
              </Panel>
              <Panel title="Box">
                <BoxGrid />
              </Panel>
            </div>

            <Panel
              title="Details"
              className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto"
            >
              <DetailsPanel />
            </Panel>
          </main>
        </DndProvider>
      </Suspense>

      <Suspense fallback={null}>
        <PickerModal />
        <ContextMenu />
      </Suspense>
      <Toast />
    </div>
  )
}
