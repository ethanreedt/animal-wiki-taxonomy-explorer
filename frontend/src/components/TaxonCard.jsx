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

const RANK_ICONS = {
  kingdom: "🌍",
  phylum: "🧬",
  class: "🦴",
  order: "🌿",
  family: "🏠",
  genus: "🔬",
  species: "🐾",
};

export default function TaxonCard({ taxon }) {
  const navigate = useNavigate();
  const colorClass = RANK_COLORS[taxon.rank] || "bg-gray-100 text-gray-800";
  const icon = RANK_ICONS[taxon.rank] || "📋";

  return (
    <button
      onClick={() => navigate(`/explore?taxon=${taxon.id}`)}
      className="group flex flex-col items-start rounded-2xl border border-gray-100 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:shadow-md"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gray-50 text-2xl transition-colors group-hover:bg-primary-50">
        {icon}
      </div>
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
    </button>
  );
}
