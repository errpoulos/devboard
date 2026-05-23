export function Skeleton({ style = {} }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--bg-overlay)',
        borderRadius: 6,
        animation: 'pulse 1.5s ease-in-out infinite',
        ...style,
      }}
    />
  )
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding: '0.75rem 1rem' }}>
          <Skeleton style={{ height: 14, width: '80%' }} />
        </td>
      ))}
    </tr>
  )
}
