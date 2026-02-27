import { useTaxon } from "../context/TaxonContext.jsx";
import InfoCard from "./InfoCard.jsx";

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
          Select a taxon to see its classification
        </p>
      </div>
    );
  }

  // Build card stack: ancestors + current taxon
  const cards = [...ancestors];
  // Don't duplicate if current taxon is already the last ancestor
  if (
    cards.length === 0 ||
    cards[cards.length - 1].id !== currentTaxon.id
  ) {
    cards.push(currentTaxon);
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="space-y-2">
        {cards.map((taxon, i) => (
          <InfoCard
            key={taxon.id}
            taxon={taxon}
            isCurrent={taxon.id === currentTaxon.id}
            isLast={i === cards.length - 1}
            onNavigate={onNavigate}
          />
        ))}
      </div>
    </div>
  );
}
