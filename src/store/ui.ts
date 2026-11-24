import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UNIVERSAL } from '../lib/rules'

interface UiState {
  game: string
  teamId: string | null
  selectedUid: string | null
  setGame: (game: string) => void
  setTeam: (teamId: string | null) => void
  /** Click a Pokémon to select it; click it again to deselect (→ team overview). */
  select: (uid: string | null) => void
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      game: UNIVERSAL,
      teamId: null,
      selectedUid: null,
      setGame: (game) => set({ game, teamId: null, selectedUid: null }),
      setTeam: (teamId) => set({ teamId, selectedUid: null }),
      select: (uid) =>
        set((s) => ({ selectedUid: s.selectedUid === uid ? null : uid })),
    }),
    // Only remember game + team across reloads, not the selection
    { name: 'ui', partialize: (s) => ({ game: s.game, teamId: s.teamId }) },
  ),
)
