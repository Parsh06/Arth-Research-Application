export default function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-12 bg-slate-200 border-4 border-black w-1/3 mb-8"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-slate-200 border-4 border-black shadow-neo-sm"></div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="col-span-1 lg:col-span-2 h-96 bg-slate-200 border-4 border-black shadow-neo-sm"></div>
        <div className="col-span-1 h-96 bg-slate-200 border-4 border-black shadow-neo-sm"></div>
      </div>
    </div>
  );
}
