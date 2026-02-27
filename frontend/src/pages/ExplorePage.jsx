import { Link } from "react-router";

export default function ExplorePage() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary-700">
            Animal Wiki
          </span>
        </Link>
      </header>

      {/* Placeholder for tree + sidebar */}
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <p className="text-gray-400">
          Tree visualization coming in Milestone 4...
        </p>
      </div>
    </div>
  );
}
