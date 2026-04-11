export default function SkeletonLoader() {
  return (
    <div className="flex-1 overflow-y-auto px-5 pt-4 pb-6 scrollbar-hide">
      {/* 헤더 스켈레톤 */}
      <div className="mb-6">
        <div className="skeleton h-3 w-28 mb-2" />
        <div className="skeleton h-8 w-48 mb-1" />
      </div>

      {/* 아이템 스켈레톤 */}
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="flex gap-4 mb-4">
          <div className="flex flex-col items-center" style={{ minWidth: '52px' }}>
            <div className="skeleton h-4 w-10 mt-4" />
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-3xl px-4 py-4 flex items-center gap-3 shadow-card">
              <div className="skeleton rounded-2xl flex-shrink-0" style={{ width: 44, height: 44 }} />
              <div className="flex-1">
                <div className="skeleton h-4 w-3/4 mb-2" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
