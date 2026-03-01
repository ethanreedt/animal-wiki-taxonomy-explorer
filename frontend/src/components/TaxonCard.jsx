import { useNavigate } from "react-router";

const RANK_COLORS = {
  kingdom: "bg-purple-100 text-purple-800",
  phylum: "bg-blue-100 text-blue-800",
  class: "bg-cyan-100 text-cyan-800",
  order: "bg-teal-100 text-teal-800",
  family: "bg-green-100 text-green-800",
  genus: "bg-lime-100 text-lime-800",
  species: "bg-amber-100 text-amber-800",
};

export default function TaxonCard({ taxon }) {
  const navigate = useNavigate();
  const colorClass = RANK_COLORS[taxon.rank] || "bg-gray-100 text-gray-800";

  return (
    <button
      onClick={() => navigate(`/explore?taxon=${taxon.id}`)}
      className="group flex flex-col items-start overflow-hidden rounded-2xl border border-gray-100 bg-white text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
    >
      {/* Image or fallback */}
      <div className="h-36 w-full overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100">
        {taxon.image_url ? (
          <img
            src={taxon.image_url}
            alt={taxon.scientific_name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <svg className="h-12 w-12 text-primary-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-semibold text-gray-900">
          {taxon.common_name || taxon.scientific_name}
        </h3>
        {taxon.common_name && (
          <p className="mt-0.5 text-sm italic text-gray-500">
            {taxon.scientific_name}
          </p>
        )}
        <div className="mt-3 flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colorClass}`}
          >
            {taxon.rank}
          </span>
          {taxon.species_count > 0 && (
            <span className="text-xs text-gray-400">
              {taxon.species_count.toLocaleString()} species
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
