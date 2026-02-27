import { Link, useSearchParams } from "react-router";
import InfoSidebar from "../components/InfoSidebar.jsx";
import RadialTree from "../components/RadialTree/RadialTree.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { useTaxon } from "../context/TaxonContext.jsx";
import { useTaxonNavigation } from "../hooks/useTaxonNavigation.js";

export default function ExplorePage() {
  const { goToTaxon } = useTaxonNavigation();
  const { currentTaxon, navigateToRoot } = useTaxon();
  const [, setSearchParams] = useSearchParams();

  function handleNavigate(taxonId) {
    if (taxonId === null) {
      navigateToRoot();
      setSearchParams({});
    } else {
      goToTaxon(taxonId);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-gray-200 bg-white px-4 py-3">
        <Link to="/" className="shrink-0">
          <span className="text-xl font-bold text-primary-700">
            Animal Wiki
          </span>
        </Link>
        <SearchBar
          maxResults={6}
          onSelect={(taxon) => goToTaxon(taxon.id)}
          className="max-w-md flex-1"
        />
      </header>

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
