import { useState } from "react";

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

export default function DetailsCard({ taxon }) {
  const [expanded, setExpanded] = useState(false);
  const iucn = taxon.iucn_status ? IUCN_LABELS[taxon.iucn_status] : null;
  const vernacularNames = taxon.vernacular_names || [];
  const englishNames = vernacularNames.filter((vn) => vn.language === "eng");

  const hasContent =
    taxon.species_count > 0 ||
    iucn ||
    taxon.authorship ||
    englishNames.length > 0;

  if (!hasContent) return null;

  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-semibold text-gray-700">Details</span>
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
        <div className="border-t border-gray-50 px-4 pb-4 pt-3">
          {taxon.species_count > 0 && (
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Species count</span>
              <span className="font-semibold text-gray-900">
                {taxon.species_count.toLocaleString()}
              </span>
            </div>
          )}

          {iucn && (
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Conservation</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${iucn.color}`}
              >
                {iucn.label}
              </span>
            </div>
          )}

          {taxon.authorship && (
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-gray-500">Authority</span>
              <span className="text-sm text-gray-700">{taxon.authorship}</span>
            </div>
          )}

          {englishNames.length > 0 && (
            <div className="mt-3 border-t border-gray-50 pt-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Common Names
              </p>
              <div className="flex flex-wrap gap-1.5">
                {englishNames.slice(0, 8).map((vn) => (
                  <span
                    key={vn.id}
                    className="rounded-full bg-gray-50 px-2.5 py-0.5 text-xs text-gray-600"
                  >
                    {vn.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
