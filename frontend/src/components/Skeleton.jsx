export default function Skeleton({ className = '' }) {
  return <div className={`skeleton ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="bg-white border border-border rounded-md shadow-sm p-6">
      <div className="skeleton h-3 w-24 mb-3" />
      <div className="skeleton h-6 w-32" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex flex-col gap-1.5">
        <div className="skeleton h-3.5 w-28" />
        <div className="skeleton h-3 w-16" />
      </div>
      <div className="skeleton h-6 w-20 rounded-full" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="bg-white border border-border rounded-md shadow-sm p-6">
      <div className="flex flex-col divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  )
}
