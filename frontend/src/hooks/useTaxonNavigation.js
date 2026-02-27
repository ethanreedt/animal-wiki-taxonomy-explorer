import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { useTaxon } from "../context/TaxonContext.jsx";

export function useTaxonNavigation() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentTaxon, navigateToTaxon } = useTaxon();

  const taxonId = searchParams.get("taxon");

  // Sync URL -> context
  useEffect(() => {
    if (taxonId && (!currentTaxon || String(currentTaxon.id) !== taxonId)) {
      navigateToTaxon(taxonId);
    }
  }, [taxonId, currentTaxon, navigateToTaxon]);

  // Navigate and update URL
  function goToTaxon(id) {
    setSearchParams({ taxon: String(id) });
  }

  return { goToTaxon };
}
