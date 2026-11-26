import type { Result } from '../db/actions'
import { useUi } from './ui'

/** Show a message, or open the transfer prompt, depending on how an action went. */
export function report(result: Result) {
  const ui = useUi.getState() // zustand can be read outside React components
  if (result.ok === 'transfer') ui.openTransfer(result.uid, result.slot)
  else if (!result.ok) ui.notify(`⚠️ ${result.message}`)
}
