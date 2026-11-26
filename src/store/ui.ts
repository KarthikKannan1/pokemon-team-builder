import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UNIVERSAL } from '../lib/rules'

interface UiState {
  game: string
  teamId: string | null
  selectedUid: string | null
  /** Open picker, and which team slot it fills */
  picker: { slot: number } | null
  /** Open right-click menu: which Pokémon, and where on screen */
  menu: { uid: string; x: number; y: number } | null
  /** Open transfer prompt: which Pokémon, and which team slot it's going to */
  transfer: { uid: string; slot: number } | null
  /** Short message at the bottom of the screen (e.g. "The Box is full") */
  notice: string | null
  setGame: (game: string) => void
  setTeam: (teamId: string | null) => void
  /** Click a Pokémon to select it; click it again to deselect (→ team overview). */
  select: (uid: string | null) => void
  openPicker: (slot: number) => void
  closePicker: () => void
  openMenu: (uid: string, x: number, y: number) => void
  closeMenu: () => void
  openTransfer: (uid: string, slot: number) => void
  closeTransfer: () => void
  notify: (message: string | null) => void
}

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      game: UNIVERSAL,
      teamId: null,
      selectedUid: null,
      picker: null,
      menu: null,
      transfer: null,
      notice: null,
      setGame: (game) =>
        set({
          game,
          teamId: null,
          selectedUid: null,
          picker: null,
          menu: null,
          transfer: null,
        }),
      setTeam: (teamId) =>
        set({
          teamId,
          selectedUid: null,
          picker: null,
          menu: null,
          transfer: null,
        }),
      select: (uid) =>
        set((s) => ({ selectedUid: s.selectedUid === uid ? null : uid })),
      openPicker: (slot) => set({ picker: { slot } }),
      closePicker: () => set({ picker: null }),
      openMenu: (uid, x, y) => set({ menu: { uid, x, y } }),
      closeMenu: () => set({ menu: null }),
      openTransfer: (uid, slot) => set({ transfer: { uid, slot } }),
      closeTransfer: () => set({ transfer: null }),
      notify: (notice) => set({ notice }),
    }),
    // Only remember game + team across reloads
    { name: 'ui', partialize: (s) => ({ game: s.game, teamId: s.teamId }) },
  ),
)
