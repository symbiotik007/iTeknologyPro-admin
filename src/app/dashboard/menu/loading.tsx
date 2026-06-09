export default function Loading() {
  return (
    <div className="p-6 max-w-5xl animate-pulse">
      <div className="h-8 bg-gray-200 rounded-xl w-24 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-48 mb-6" />
      <div className="flex gap-1 mb-4">
        <div className="h-10 bg-gray-200 rounded-lg w-28" />
        <div className="h-10 bg-gray-100 rounded-lg w-28" />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between">
          <div className="h-5 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded-lg w-28" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-gray-50 flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-lg" />
            <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-40 mb-1" /><div className="h-3 bg-gray-100 rounded w-60" /></div>
            <div className="h-4 bg-gray-100 rounded w-20" />
            <div className="h-4 bg-gray-100 rounded w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
