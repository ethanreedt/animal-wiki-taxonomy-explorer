import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { apiGet } from "../api.js";
import SearchBar from "../components/SearchBar.jsx";
import TaxonCard from "../components/TaxonCard.jsx";

export default function LandingPage() {
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    apiGet("/taxa/featured/")
      .then((data) => {
        setFeatured(data);
        setError(null);
      })
      .catch(() => {
        // Fall back to roots if featured endpoint fails
        return apiGet("/taxa/roots/").then((data) => {
          setFeatured(data.slice(0, 6));
          setError(null);
        });
      })
      .catch(() => setError("Could not load featured taxa"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 px-4 pb-32 pt-20 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Explore the
            <span className="block text-primary-200">Tree of Life</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-primary-100">
            Navigate the complete Catalogue of Life — over 4.5 million species
            organized in an interactive taxonomy tree.
          </p>

          <div className="mx-auto mt-10 max-w-xl">
            <SearchBar maxResults={4} />
          </div>

          <button
            onClick={() => navigate("/explore")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-primary-800 shadow-lg transition-all hover:bg-primary-50 hover:shadow-xl"
          >
            Start Exploring
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Featured Taxa */}
      <div className="mx-auto -mt-12 max-w-6xl px-4 pb-20">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Featured Groups
          </h2>
          <p className="mt-2 text-gray-600">
            Dive into the major branches of life
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-6">
                <div className="mb-4 h-14 w-14 rounded-xl bg-gray-100" />
                <div className="h-5 w-32 rounded bg-gray-100" />
                <div className="mt-2 h-4 w-24 rounded bg-gray-50" />
                <div className="mt-3 h-6 w-20 rounded-full bg-gray-50" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-12 text-center text-gray-500">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 text-sm text-primary-600 hover:underline"
            >
              Try again
            </button>
          </div>
        ) : featured.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <p>No featured taxa available yet.</p>
            <button
              onClick={() => navigate("/explore")}
              className="mt-4 text-sm text-primary-600 hover:underline"
            >
              Browse the full tree instead
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((taxon) => (
              <TaxonCard key={taxon.id} taxon={taxon} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white px-4 py-8 text-center text-sm text-gray-500">
        <p>
          Data from the{" "}
          <a
            href="https://www.catalogueoflife.org/"
            className="text-primary-600 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Catalogue of Life
          </a>
        </p>
      </footer>
    </div>
  );
}
