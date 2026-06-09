export default function Loading() {
  return (
    <div className="p-6 max-w-3xl animate-pulse">
      <div className="h-8 bg-gray-200 rounded-xl w-44 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-64 mb-6" />
      <div className="flex gap-1 mb-6">
        <div className="h-9 bg-gray-200 rounded-lg w-32" />
        <div className="h-9 bg-gray-100 rounded-lg w-24" />
      </div>
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="h-5 bg-gray-200 rounded w-40 mb-4" />
            <div className="space-y-3">
              <div className="h-10 bg-gray-100 rounded-lg" />
              <div className="h-10 bg-gray-100 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
