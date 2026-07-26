export function formatDuration(totalSeconds: number, showCentiseconds = false) {
  const safeTotal = Math.max(0, totalSeconds)
  const hours = Math.floor(safeTotal / 3600)
  const minutes = Math.floor((safeTotal % 3600) / 60)
  const seconds = Math.floor(safeTotal % 60)
  const baseDisplay = hours > 0
    ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
    : `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`

  if (!showCentiseconds) {
    return baseDisplay
  }

  const centiseconds = Math.floor((safeTotal % 1) * 100)

  return `${baseDisplay}.${centiseconds.toString().padStart(2, '0')}`
}
