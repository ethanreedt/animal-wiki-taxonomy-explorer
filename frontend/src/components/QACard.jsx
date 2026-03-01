export default function QACard({ taxon }) {
  const displayName = taxon.common_name || taxon.scientific_name;

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-700">Q&A</span>
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">
            Coming soon
          </span>
        </div>
      </div>
      <div className="border-t border-gray-50 px-4 pb-4 pt-3">
        <div className="relative">
          <input
            type="text"
            disabled
            placeholder={`Ask about ${displayName}...`}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-400 placeholder:text-gray-300"
          />
          <svg
            className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <p className="mt-2 text-xs text-gray-400">
          AI-powered answers about taxonomy, ecology, and more.
        </p>
      </div>
    </div>
  );
}
