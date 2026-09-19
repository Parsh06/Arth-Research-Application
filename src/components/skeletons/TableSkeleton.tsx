interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({ rows = 5, columns = 4 }: TableSkeletonProps) {
  return (
    <div className="animate-pulse w-full bg-white border-4 border-black shadow-neo overflow-hidden">
      <div className="flex border-b-4 border-black bg-slate-200">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className={`flex-1 h-12 border-r-4 border-black ${i === columns - 1 ? 'border-r-0' : ''}`}></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={`flex ${rowIndex !== rows - 1 ? 'border-b-4' : ''} border-black bg-slate-50`}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className={`flex-1 h-16 p-4 border-r-4 border-black flex items-center ${colIndex === columns - 1 ? 'border-r-0' : ''}`}>
               <div className="h-4 bg-slate-200 w-3/4 rounded-full"></div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
