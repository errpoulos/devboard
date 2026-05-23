export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#23252a] ${className}`} />
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-b border-[#23252a]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  )
}
