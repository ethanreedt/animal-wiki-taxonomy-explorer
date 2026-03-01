import { useState } from "react";

const RANK_COLORS = {
  kingdom: "text-purple-600",
  phylum: "text-blue-600",
  class: "text-cyan-600",
  order: "text-teal-600",
  family: "text-green-600",
  genus: "text-lime-600",
  species: "text-amber-600",
};

const RANK_DOT_COLORS = {
  kingdom: "bg-purple-400",
  phylum: "bg-blue-400",
  class: "bg-cyan-400",
  order: "bg-teal-400",
  family: "bg-green-400",
  genus: "bg-lime-400",
  species: "bg-amber-400",
};

export default function TaxonomyCard({ ancestors, currentTaxon, onNavigate }) {
  const [expanded, setExpanded] = useState(true);

  // Build the full chain: ancestors + current
  const chain = [...ancestors];
  if (
    currentTaxon &&
    (chain.length === 0 || chain[chain.length - 1].id !== currentTaxon.id)
  ) {
    chain.push(currentTaxon);
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-semibold text-gray-700">
          Classification
        </span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-2">
          {chain.map((taxon, i) => {
            const isCurrent = taxon.id === currentTaxon?.id;
            const textColor = RANK_COLORS[taxon.rank] || "text-gray-600";
            const dotColor = RANK_DOT_COLORS[taxon.rank] || "bg-gray-400";
            const commonName = taxon.common_name;

            return (
              <div key={taxon.id} className="flex items-stretch">
                {/* Vertical line + dot */}
                <div className="flex w-6 shrink-0 flex-col items-center">
                  {i > 0 && <div className="w-px flex-1 bg-gray-200" />}
                  <div
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotColor} ${
                      isCurrent ? "ring-2 ring-offset-1 ring-primary-300" : ""
                    }`}
                  />
                  {i < chain.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200" />
                  )}
                </div>

                {/* Label */}
                <button
                  onClick={() => !isCurrent && onNavigate?.(taxon.id)}
                  disabled={isCurrent}
                  className={`ml-2 py-1.5 text-left ${
                    isCurrent
                      ? "cursor-default"
                      : "cursor-pointer hover:underline"
                  }`}
                >
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${textColor}`}>
                    {taxon.rank}
                  </span>
                  <p
                    className={`text-sm leading-tight ${
                      isCurrent
                        ? "font-semibold text-gray-900"
                        : "text-gray-700"
                    }`}
                  >
                    {commonName || taxon.scientific_name}
                    {commonName && (
                      <span className="ml-1 font-normal italic text-gray-400">
                        {taxon.scientific_name}
                      </span>
                    )}
                  </p>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
