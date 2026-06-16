export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50/30 to-transparent flex items-center justify-center p-4">
      <div className="max-w-md mx-auto">
        <div className="animate-pulse space-y-6">
          {/* Header skeleton */}
          <div className="text-center">
            <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
          </div>

          {/* Card skeleton */}
          <div className="bg-white rounded-lg border p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded w-40"></div>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="h-5 w-5 bg-gray-200 rounded"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Location card skeleton */}
          <div className="bg-white rounded-lg border p-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-gray-200 rounded-full mx-auto"></div>
              <div className="h-6 bg-gray-200 rounded w-48 mx-auto"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-10 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
