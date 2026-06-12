export function CornerAccent({
  position = 'top-right',
  color = 'copper',
}: {
  position?: 'top-right' | 'bottom-left' | 'top-left' | 'bottom-right'
  color?: 'copper' | 'silver'
}) {
  const posClasses = {
    'top-right': 'top-4 right-4 lg:top-8 lg:right-8',
    'top-left': 'top-4 left-4 lg:top-8 lg:left-8',
    'bottom-right': 'bottom-4 right-4 lg:bottom-8 lg:right-8',
    'bottom-left': 'bottom-4 left-4 lg:bottom-8 lg:left-8',
  }
  const fill = color === 'copper' ? 'var(--copper)' : '#9ca3af'

  return (
    <div
      className={`absolute ${posClasses[position]} w-3 h-3 pointer-events-none z-10`}
      style={{ background: fill, opacity: 0.4, transform: 'rotate(45deg)' }}
    />
  )
}
