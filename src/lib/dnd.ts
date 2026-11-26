/** What's being dragged. */
export interface DragData {
  uid: string
  species: string
  shiny: boolean
}

/** Where it can be dropped. */
export type DropTarget =
  { kind: 'team'; slot: number } | { kind: 'box'; slot: number }
