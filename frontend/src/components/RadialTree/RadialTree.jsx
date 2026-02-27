import { useEffect, useRef, useState } from "react";
import { apiGet } from "../../api.js";
import { useTaxon } from "../../context/TaxonContext.jsx";
import { CENTER_RADIUS } from "./constants.js";
import TaxonNode from "./TaxonNode.jsx";
import { useRadialLayout } from "./useRadialLayout.js";
import { useZoomPan } from "./useZoomPan.js";

export default function RadialTree({ onNavigate }) {
  const svgRef = useRef(null);
  const contentRef = useRef(null);
  const { currentTaxon, taxonChildren, loading } = useTaxon();
  const { resetView } = useZoomPan(svgRef, contentRef);
  const { nodes, hasMore } = useRadialLayout(taxonChildren);

  // Root-level nodes when no taxon is selected
  const [roots, setRoots] = useState([]);
  const [rootsLoading, setRootsLoading] = useState(false);

  useEffect(() => {
    if (!currentTaxon) {
      setRootsLoading(true);
      apiGet("/taxa/roots/")
        .then(setRoots)
        .catch(() => setRoots([]))
        .finally(() => setRootsLoading(false));
    }
  }, [currentTaxon]);

  // Reset zoom when taxon changes
  useEffect(() => {
    resetView();
  }, [currentTaxon, resetView]);

  const childNodes = currentTaxon ? taxonChildren : roots;
  const { nodes: displayNodes, hasMore: hasMoreDisplay } =
    useRadialLayout(childNodes);

  const isLoading = currentTaxon ? loading : rootsLoading;

  return (
    <div className="relative h-full w-full bg-gray-50">
      <svg
        ref={svgRef}
        className="h-full w-full"
        style={{ touchAction: "none" }}
      >
        <g ref={contentRef}>
          {/* Connection lines */}
          {!isLoading &&
            displayNodes.map((node) => (
              <line
                key={`line-${node.id}`}
                x1={0}
                y1={0}
                x2={node.x}
                y2={node.y}
                stroke="#e5e7eb"
                strokeWidth={1.5}
                className="transition-all duration-500"
              />
            ))}

          {/* Center node */}
          {currentTaxon && (
            <TaxonNode
              taxon={currentTaxon}
              x={0}
              y={0}
              ringWidth={0}
              nodeRadius={CENTER_RADIUS}
              isCenter
              isFaded={false}
              onClick={() => {
                // Navigate up to parent
                if (currentTaxon.parent_id) {
                  onNavigate(currentTaxon.parent_id);
                }
              }}
            />
          )}

          {/* Root center label when no taxon selected */}
          {!currentTaxon && !isLoading && (
            <text
              textAnchor="middle"
              dy={4}
              className="pointer-events-none select-none fill-gray-400 text-sm"
            >
              Tree of Life
            </text>
          )}

          {/* Child nodes */}
          {!isLoading &&
            displayNodes.map((node) => (
              <TaxonNode
                key={node.id}
                taxon={node}
                x={node.x}
                y={node.y}
                ringWidth={node.ringWidth}
                nodeRadius={node.nodeRadius}
                onClick={(t) => onNavigate(t.id)}
              />
            ))}

          {/* Loading indicator */}
          {isLoading && (
            <text
              textAnchor="middle"
              dy={4}
              className="fill-gray-400 text-sm"
            >
              Loading...
            </text>
          )}

          {/* "More" indicator */}
          {hasMoreDisplay && (
            <text
              textAnchor="middle"
              y={300}
              className="fill-gray-400 text-xs"
            >
              + {childNodes.length - displayNodes.length} more
            </text>
          )}
        </g>
      </svg>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={resetView}
          className="rounded-lg bg-white p-2 shadow-md transition-colors hover:bg-gray-50"
          title="Reset view"
        >
          <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* Back button */}
      {currentTaxon && (
        <button
          onClick={() => {
            if (currentTaxon.parent_id) {
              onNavigate(currentTaxon.parent_id);
            } else {
              onNavigate(null);
            }
          }}
          className="absolute left-4 top-4 flex items-center gap-1 rounded-lg bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-md transition-colors hover:bg-gray-50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Up
        </button>
      )}
    </div>
  );
}
