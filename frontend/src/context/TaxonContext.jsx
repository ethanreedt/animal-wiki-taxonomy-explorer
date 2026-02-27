import { createContext, useCallback, useContext, useState } from "react";
import { apiGet } from "../api.js";

const TaxonContext = createContext(null);

export function TaxonProvider({ children }) {
  const [currentTaxon, setCurrentTaxon] = useState(null);
  const [ancestors, setAncestors] = useState([]);
  const [taxonChildren, setTaxonChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const navigateToTaxon = useCallback(async (taxonId) => {
    if (!taxonId) return;
    setLoading(true);
    setError(null);
    try {
      const [detail, ancestorData, childData] = await Promise.all([
        apiGet(`/taxa/${taxonId}/`),
        apiGet(`/taxa/${taxonId}/ancestors/`),
        apiGet(`/taxa/${taxonId}/children/`),
      ]);
      setCurrentTaxon(detail);
      setAncestors(ancestorData);
      setTaxonChildren(childData);
    } catch (err) {
      setError(err.message || "Failed to load taxon");
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateToRoot = useCallback(() => {
    setCurrentTaxon(null);
    setAncestors([]);
    setTaxonChildren([]);
    setError(null);
  }, []);

  return (
    <TaxonContext.Provider
      value={{
        currentTaxon,
        ancestors,
        taxonChildren,
        loading,
        error,
        navigateToTaxon,
        navigateToRoot,
      }}
    >
      {children}
    </TaxonContext.Provider>
  );
}

export function useTaxon() {
  const ctx = useContext(TaxonContext);
  if (!ctx) throw new Error("useTaxon must be used within TaxonProvider");
  return ctx;
}
