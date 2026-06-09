export default function Loading() {
  return (
    <div className="p-6 max-w-3xl animate-pulse">
      <div className="h-8 bg-gray-200 rounded-xl w-36 mb-2" />
      <div className="h-4 bg-gray-100 rounded w-56 mb-6" />
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between">
          <div className="h-5 bg-gray-200 rounded w-32" />
          <div className="h-8 bg-gray-200 rounded-lg w-32" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="px-6 py-4 border-b border-gray-50 flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl" />
            <div className="flex-1"><div className="h-4 bg-gray-200 rounded w-32 mb-2" /><div className="h-3 bg-gray-100 rounded w-56" /></div>
          </div>
        ))}
      </div>
    </div>
  );
}
