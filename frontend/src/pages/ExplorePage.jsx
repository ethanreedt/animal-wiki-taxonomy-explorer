import { Link, useSearchParams } from "react-router";
import InfoSidebar from "../components/InfoSidebar.jsx";
import RadialTree from "../components/RadialTree/RadialTree.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { useTaxon } from "../context/TaxonContext.jsx";
import { useTaxonNavigation } from "../hooks/useTaxonNavigation.js";

export default function ExplorePage() {
  const { goToTaxon } = useTaxonNavigation();
  const { currentTaxon, ancestors, navigateToRoot } = useTaxon();
  const [, setSearchParams] = useSearchParams();

  function handleNavigate(taxonId) {
    if (taxonId === null) {
      navigateToRoot();
      setSearchParams({});
    } else {
      goToTaxon(taxonId);
    }
  }

  // Build breadcrumb trail
  const breadcrumbs = ancestors.length > 0
    ? ancestors.filter((a) => a.id !== currentTaxon?.id)
    : [];

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-2.5">
        <Link to="/" className="shrink-0">
          <span className="text-lg font-bold text-primary-700">
            Animal Wiki
          </span>
        </Link>
        <SearchBar
          maxResults={6}
          compact
          onSelect={(taxon) => goToTaxon(taxon.id)}
          className="max-w-sm flex-1"
        />
      </header>

      {/* Breadcrumbs */}
      {currentTaxon && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-100 bg-gray-50/80 px-4 py-1.5 text-xs">
          <button
            onClick={() => handleNavigate(null)}
            className="shrink-0 text-primary-600 hover:underline"
          >
            All Life
          </button>
          {breadcrumbs.map((ancestor) => (
            <span key={ancestor.id} className="flex items-center gap-1">
              <svg className="h-3 w-3 shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <button
                onClick={() => handleNavigate(ancestor.id)}
                className="shrink-0 text-primary-600 hover:underline"
              >
                {ancestor.common_name || ancestor.scientific_name}
              </button>
            </span>
          ))}
          <span className="flex items-center gap-1">
            <svg className="h-3 w-3 shrink-0 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="shrink-0 font-medium text-gray-700">
              {currentTaxon.common_name || currentTaxon.scientific_name}
            </span>
          </span>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Tree */}
        <div className="flex-1">
          <RadialTree onNavigate={handleNavigate} />
        </div>

        {/* Sidebar */}
        <div className="hidden w-80 shrink-0 border-l border-gray-200 bg-white md:block lg:w-96">
          <InfoSidebar onNavigate={handleNavigate} />
        </div>
      </div>

      {/* Mobile sidebar drawer */}
      {currentTaxon && (
        <MobileDrawer onNavigate={handleNavigate} />
      )}
    </div>
  );
}

function MobileDrawer({ onNavigate }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 max-h-[40vh] overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white shadow-2xl md:hidden">
      <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-gray-300" />
      <InfoSidebar onNavigate={onNavigate} />
    </div>
  );
}
