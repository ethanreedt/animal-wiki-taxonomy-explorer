export default function ScoreBar({ questionNum, lives, score, streak }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm border border-gray-100">
      <div className="text-sm font-medium text-gray-500">
        Q{questionNum}
      </div>

      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <span key={i} className={`text-lg ${i < lives ? "text-red-500" : "text-gray-200"}`}>
            &hearts;
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {streak > 1 && (
          <span className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-600">
            <span>&#x1f525;</span> {streak}x
          </span>
        )}
        <span className="text-lg font-bold text-primary-700">{score}</span>
      </div>
    </div>
  );
}
