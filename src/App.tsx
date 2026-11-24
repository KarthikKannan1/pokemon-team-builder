import { VersionSelect } from './components/VersionSelect'
import { TeamSwitcher } from './components/TeamSwitcher'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-6 py-3">
        <h1 className="mr-4 text-lg font-bold">Pokémon Team Builder</h1>
        <VersionSelect />
        <TeamSwitcher />
      </header>

      <main className="grid gap-4 p-6 lg:grid-cols-[24rem_1fr]">
        <section className="rounded-2xl bg-slate-900 p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Team
          </h2>
          <p className="text-slate-500">Team list goes here</p>
        </section>
        <section className="rounded-2xl bg-slate-900 p-4">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Box
          </h2>
          <p className="text-slate-500">Box goes here</p>
        </section>
        <section className="rounded-2xl bg-slate-900 p-4 lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Details
          </h2>
          <p className="text-slate-500">
            Team overview / selected Pokémon goes here
          </p>
        </section>
      </main>
    </div>
  )
}
