/** Save text as a file: make a temporary in-memory URL for it, and "click" a download link. */
export function downloadText(
  filename: string,
  text: string,
  type = 'text/plain',
) {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000) // free the memory afterwards
}
