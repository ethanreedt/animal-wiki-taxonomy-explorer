import { Link } from "react-router";
import InfoSidebar from "../components/InfoSidebar.jsx";
import SearchBar from "../components/SearchBar.jsx";
import { useTaxon } from "../context/TaxonContext.jsx";
import { useTaxonNavigation } from "../hooks/useTaxonNavigation.js";

export default function ExplorePage() {
  const { goToTaxon } = useTaxonNavigation();
  const { currentTaxon } = useTaxon();

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
        {/* Tree area placeholder */}
        <div className="flex flex-1 items-center justify-center bg-gray-50">
          {currentTaxon ? (
            <p className="text-gray-400">
              Radial tree visualization coming in Milestone 4...
            </p>
          ) : (
            <div className="text-center">
              <p className="text-lg text-gray-500">
                Search for a taxon or browse from the roots
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Use the search bar above to get started
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-80 shrink-0 border-l border-gray-200 bg-white lg:w-96">
          <InfoSidebar onNavigate={goToTaxon} />
        </div>
      </div>
    </div>
  );
}
