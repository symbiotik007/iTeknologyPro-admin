export default function Loading() {
  return (
    <div className="p-6 max-w-5xl animate-pulse">
      <div className="h-8 bg-gray-200 rounded-xl w-48 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-64 mb-8" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
            <div className="h-7 bg-gray-200 rounded w-16 mb-1" />
            <div className="h-3 bg-gray-100 rounded w-24" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 h-64" />
    </div>
  );
}
