import { useState } from "react";

const RANK_COLORS = {
  kingdom: "border-l-purple-400",
  phylum: "border-l-blue-400",
  class: "border-l-cyan-400",
  order: "border-l-teal-400",
  family: "border-l-green-400",
  genus: "border-l-lime-400",
  species: "border-l-amber-400",
};

const IUCN_LABELS = {
  LC: { label: "Least Concern", color: "bg-green-100 text-green-800" },
  NT: { label: "Near Threatened", color: "bg-yellow-100 text-yellow-800" },
  VU: { label: "Vulnerable", color: "bg-orange-100 text-orange-800" },
  EN: { label: "Endangered", color: "bg-red-100 text-red-800" },
  CR: { label: "Critically Endangered", color: "bg-red-200 text-red-900" },
  EW: { label: "Extinct in Wild", color: "bg-gray-200 text-gray-800" },
  EX: { label: "Extinct", color: "bg-gray-300 text-gray-900" },
  DD: { label: "Data Deficient", color: "bg-gray-100 text-gray-600" },
};

export default function InfoCard({ taxon, isCurrent, isLast, onNavigate }) {
  const [expanded, setExpanded] = useState(isCurrent);
  const borderColor = RANK_COLORS[taxon.rank] || "border-l-gray-300";
  const iucn = taxon.iucn_status ? IUCN_LABELS[taxon.iucn_status] : null;

  const commonName = taxon.common_name;

  function handleClick() {
    if (isCurrent) {
      setExpanded(!expanded);
    } else {
      onNavigate?.(taxon.id);
    }
  }

  return (
    <div
      className={`rounded-lg border-l-4 bg-white shadow-sm transition-all ${borderColor} ${
        isCurrent ? "ring-1 ring-primary-200" : "cursor-pointer hover:shadow-md"
      }`}
    >
      {/* Header - always visible */}
      <button
        onClick={handleClick}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
              {taxon.rank}
            </span>
            {isCurrent && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary-500" />
            )}
          </div>
          <p className="truncate font-semibold text-gray-900">
            {commonName || taxon.scientific_name}
          </p>
          {commonName && (
            <p className="truncate text-sm italic text-gray-500">
              {taxon.scientific_name}
            </p>
          )}
        </div>
        {isCurrent && (
          <svg
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${
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
        )}
      </button>

      {/* Expanded content */}
      {expanded && isCurrent && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3">
          {/* Image */}
          {(taxon.image_url || (taxon.images && taxon.images.length > 0)) && (
            <div className="mb-3 overflow-hidden rounded-lg">
              <img
                src={taxon.image_url || taxon.images[0].thumbnail_url || taxon.images[0].url}
                alt={taxon.scientific_name}
                className="h-32 w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {taxon.species_count > 0 && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">Species:</span>
              <span className="font-semibold text-gray-900">
                {taxon.species_count.toLocaleString()}
              </span>
            </div>
          )}

          {iucn && (
            <div className="mb-3">
              <span
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${iucn.color}`}
              >
                {iucn.label}
              </span>
            </div>
          )}

          {taxon.extinct && (
            <div className="mb-3">
              <span className="inline-block rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
                Extinct
              </span>
            </div>
          )}

          {taxon.authorship && (
            <p className="mb-3 text-xs text-gray-400">
              {taxon.authorship}
            </p>
          )}

          {/* Vernacular names */}
          {taxon.vernacular_names && taxon.vernacular_names.length > 0 && (
            <div className="mt-3 border-t border-gray-50 pt-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-400">
                Common Names
              </p>
              <div className="flex flex-wrap gap-1.5">
                {taxon.vernacular_names
                  .filter((vn) => vn.language === "eng")
                  .slice(0, 5)
                  .map((vn) => (
                    <span
                      key={vn.id}
                      className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-gray-600"
                    >
                      {vn.name}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Connector line to next card */}
      {!isLast && (
        <div className="flex justify-center">
          <div className="h-2 w-px bg-gray-200" />
        </div>
      )}
    </div>
  );
}
