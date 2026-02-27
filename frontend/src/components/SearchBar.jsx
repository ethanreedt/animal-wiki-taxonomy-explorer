import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { apiGet } from "../api.js";

export default function SearchBar({ maxResults = 4, onSelect, compact = false, className = "" }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  const search = useCallback(
    async (q) => {
      if (q.length < 2) {
        setResults([]);
        setIsOpen(false);
        return;
      }
      setLoading(true);
      try {
        const data = await apiGet(`/search/?q=${encodeURIComponent(q)}&limit=${maxResults}`);
        setResults(data);
        setIsOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [maxResults]
  );

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => search(query), 250);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(taxon) {
    setIsOpen(false);
    setQuery("");
    if (onSelect) {
      onSelect(taxon);
    } else {
      navigate(`/explore?taxon=${taxon.id}`);
    }
  }

  function handleKeyDown(e) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(results[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <svg
          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActiveIndex(-1);
          }}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search animals, plants, fungi..."
          className={`w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 shadow-sm outline-none transition-shadow focus:border-primary-400 focus:ring-2 focus:ring-primary-200 ${compact ? "py-2.5 text-sm" : "py-4 text-lg"}`}
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
          {results.map((taxon, i) => (
            <li
              key={taxon.id}
              className={`cursor-pointer px-4 py-3 transition-colors ${
                i === activeIndex ? "bg-primary-50" : "hover:bg-gray-50"
              }`}
              onMouseEnter={() => setActiveIndex(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(taxon)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-gray-900">
                    {taxon.common_name || taxon.scientific_name}
                  </span>
                  {taxon.common_name && (
                    <span className="ml-2 text-sm italic text-gray-500">
                      {taxon.scientific_name}
                    </span>
                  )}
                </div>
                <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 capitalize">
                  {taxon.rank}
                </span>
              </div>
              {taxon.species_count > 0 && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {taxon.species_count.toLocaleString()} species
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
