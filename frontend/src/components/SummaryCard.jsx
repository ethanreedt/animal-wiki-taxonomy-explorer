import { useEffect, useState } from "react";
import { apiGet } from "../api.js";

export default function SummaryCard({ taxon }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!taxon) return;
    setSummary(null);
    setLoading(true);
    apiGet(`/taxa/${taxon.id}/summary/`)
      .then((data) => setSummary(data.summary))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  }, [taxon?.id]);

  const commonName = taxon.common_name;
  const imageUrl =
    taxon.image_url ||
    (taxon.images && taxon.images.length > 0
      ? taxon.images[0].thumbnail_url || taxon.images[0].url
      : null);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
      {/* Image */}
      {imageUrl && (
        <div className="h-44 w-full overflow-hidden">
          <img
            src={imageUrl}
            alt={taxon.scientific_name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4">
        {/* Name */}
        <h2 className="text-xl font-bold text-gray-900">
          {commonName || taxon.scientific_name}
        </h2>
        {commonName && (
          <p className="mt-0.5 text-sm italic text-gray-500">
            {taxon.scientific_name}
          </p>
        )}

        {/* Quick stats */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium capitalize text-primary-700">
            {taxon.rank}
          </span>
          {taxon.species_count > 0 && (
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs text-gray-600">
              {taxon.species_count.toLocaleString()} species
            </span>
          )}
          {taxon.extinct && (
            <span className="rounded-full bg-gray-200 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              Extinct
            </span>
          )}
        </div>

        {/* Summary */}
        <div className="mt-4">
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-5/6 animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-4/6 animate-pulse rounded bg-gray-50" />
            </div>
          ) : summary ? (
            <p className="text-sm leading-relaxed text-gray-600">{summary}</p>
          ) : (
            <p className="text-sm italic text-gray-400">
              No description available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
