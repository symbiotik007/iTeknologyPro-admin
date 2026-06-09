export default function Loading() {
  return (
    <div className="flex flex-col h-screen animate-pulse">
      <div className="px-6 py-5 border-b border-gray-200 bg-white">
        <div className="h-6 bg-gray-200 rounded w-24 mb-1" />
        <div className="h-3 bg-gray-100 rounded w-56" />
      </div>
      <div className="flex-1 p-6 space-y-3">
        <div className="flex gap-2 mb-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-200 rounded-lg w-24" />)}
        </div>
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 h-14" />
        ))}
      </div>
    </div>
  );
}
