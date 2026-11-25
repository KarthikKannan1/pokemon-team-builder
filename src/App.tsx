import { Suspense } from 'react'
import { VersionSelect } from './components/VersionSelect'
import { TeamSwitcher } from './components/TeamSwitcher'
import { TeamList } from './components/TeamList'
import { BoxGrid } from './components/BoxGrid'
import { DevSeed } from './components/DevSeed'

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
        <div className="ml-auto">
          <Suspense fallback={null}>
            <DevSeed />
          </Suspense>
        </div>
      </header>

      <main className="grid gap-4 p-6 lg:grid-cols-[24rem_1fr]">
        <Panel title="Team">
          <TeamList />
        </Panel>
        <Panel title="Box">
          <BoxGrid />
        </Panel>
        <Panel title="Details" className="lg:col-span-2">
          <p className="text-slate-500">
            Team overview / selected Pokémon goes here
          </p>
        </Panel>
      </main>
    </div>
  )
}
