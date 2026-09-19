export default function PortfolioSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-12 bg-slate-200 border-4 border-black w-1/4 mb-8"></div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="col-span-1 h-40 bg-slate-200 border-4 border-black shadow-neo-sm"></div>
        <div className="col-span-2 h-40 bg-slate-200 border-4 border-black shadow-neo-sm"></div>
      </div>
      
      <div className="h-10 bg-slate-200 border-4 border-black w-1/5 mb-4"></div>
      
      <div className="bg-white border-4 border-black shadow-neo overflow-hidden">
        <div className="h-12 bg-slate-200 border-b-4 border-black"></div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-100 border-b-4 border-black"></div>
        ))}
      </div>
    </div>
  );
}
