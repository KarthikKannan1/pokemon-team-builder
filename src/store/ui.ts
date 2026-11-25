import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UNIVERSAL } from '../lib/rules'

interface UiState {
  game: string
  teamId: string | null
  selectedUid: string | null
  /** Open picker, and which team slot it fills */
  picker: { slot: number } | null
  setGame: (game: string) => void
  setTeam: (teamId: string | null) => void
  /** Click a Pokémon to select it; click it again to deselect (→ team overview). */
  select: (uid: string | null) => void
  openPicker: (slot: number) => void
  closePicker: () => void
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      game: UNIVERSAL,
      teamId: null,
      selectedUid: null,
      picker: null,
      setGame: (game) =>
        set({ game, teamId: null, selectedUid: null, picker: null }),
      setTeam: (teamId) => set({ teamId, selectedUid: null, picker: null }),
      select: (uid) =>
        set((s) => ({ selectedUid: s.selectedUid === uid ? null : uid })),
      openPicker: (slot) => set({ picker: { slot } }),
      closePicker: () => set({ picker: null }),
    }),
    // Only remember game + team across reloads
    { name: 'ui', partialize: (s) => ({ game: s.game, teamId: s.teamId }) },
  ),
)
