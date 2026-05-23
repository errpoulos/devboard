export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-[#23252a] ${className}`} />
}

export function CardSkeleton() {
  return (
    <div className="bg-[#0f1011] border border-[#23252a] rounded p-2.5 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
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
