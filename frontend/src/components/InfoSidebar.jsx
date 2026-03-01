import { useTaxon } from "../context/TaxonContext.jsx";
import DetailsCard from "./DetailsCard.jsx";
import QACard from "./QACard.jsx";
import SummaryCard from "./SummaryCard.jsx";
import TaxonomyCard from "./TaxonomyCard.jsx";

export default function InfoSidebar({ onNavigate }) {
  const { currentTaxon, ancestors, loading, error } = useTaxon();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-red-500">
        <p className="font-medium">Error loading taxon</p>
        <p className="mt-1 text-sm text-red-400">{error}</p>
      </div>
    );
  }

  if (!currentTaxon) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-gray-400">
        <p className="text-center">
          Select a taxon to see its details
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-3">
        <SummaryCard taxon={currentTaxon} />
        <TaxonomyCard
          ancestors={ancestors}
          currentTaxon={currentTaxon}
          onNavigate={onNavigate}
        />
        <DetailsCard taxon={currentTaxon} />
        <QACard taxon={currentTaxon} />
      </div>
    </div>
  );
}
