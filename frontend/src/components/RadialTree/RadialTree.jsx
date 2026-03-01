import { useCallback, useEffect, useRef, useState } from "react";
import { apiGet } from "../../api.js";
import { useTaxon } from "../../context/TaxonContext.jsx";
import { ANIMATION_DURATION, CENTER_RADIUS, PREFETCH_COUNT } from "./constants.js";
import TaxonNode from "./TaxonNode.jsx";
import { useRadialLayout } from "./useRadialLayout.js";
import { useZoomPan } from "./useZoomPan.js";

// Simple cache for pre-fetched children
const childrenCache = new Map();

export default function RadialTree({ onNavigate }) {
  const svgRef = useRef(null);
  const contentRef = useRef(null);
  const { currentTaxon, taxonChildren, loading } = useTaxon();
  const { resetView, panTo } = useZoomPan(svgRef, contentRef);

  // Root-level nodes when no taxon is selected
  const [roots, setRoots] = useState([]);
  const [rootsLoading, setRootsLoading] = useState(false);

  // Transition state
  const [transitioning, setTransitioning] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!currentTaxon) {
      setRootsLoading(true);
      apiGet("/taxa/roots/")
        .then(setRoots)
        .catch(() => setRoots([]))
        .finally(() => setRootsLoading(false));
    }
  }, [currentTaxon]);

  // Reset zoom and transition state when taxon changes
  useEffect(() => {
    resetView();
    setTransitioning(false);
    setSelectedId(null);
  }, [currentTaxon, resetView]);

  // Pre-fetch top N children's children after current children load
  useEffect(() => {
    if (!taxonChildren || taxonChildren.length === 0) return;
    const topChildren = taxonChildren.slice(0, PREFETCH_COUNT);
    topChildren.forEach((child) => {
      if (!childrenCache.has(child.id)) {
        apiGet(`/taxa/${child.id}/children/`)
          .then((data) => childrenCache.set(child.id, data))
          .catch(() => {}); // silent fail for pre-fetch
      }
    });
  }, [taxonChildren]);

  const childNodes = currentTaxon ? taxonChildren : roots;
  const { nodes: displayNodes, hasMore: hasMoreDisplay } =
    useRadialLayout(childNodes);

  const isLoading = currentTaxon ? loading : rootsLoading;

  // Handle node click with transition
  const handleNodeClick = useCallback(
    (taxon) => {
      setSelectedId(taxon.id);
      setTransitioning(true);
      // Pan to center on the clicked node while siblings fade out
      const node = displayNodes.find((n) => n.id === taxon.id);
      if (node) {
        panTo(node.x, node.y);
      }
      // Wait for fade-out animation, then navigate
      setTimeout(() => {
        onNavigate(taxon.id);
      }, ANIMATION_DURATION);
    },
    [onNavigate, displayNodes, panTo]
  );

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
                style={{
                  opacity:
                    transitioning && node.id !== selectedId ? 0 : 1,
                  transition: `opacity ${ANIMATION_DURATION}ms ease`,
                }}
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
              isFaded={transitioning}
              onClick={() => {
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
            displayNodes.map((node) => {
              const isSelected = node.id === selectedId;
              const isFading = transitioning && !isSelected;

              return (
                <TaxonNode
                  key={node.id}
                  taxon={node}
                  x={node.x}
                  y={node.y}
                  ringWidth={node.ringWidth}
                  nodeRadius={node.nodeRadius}
                  isFaded={isFading}
                  onClick={handleNodeClick}
                  style={{
                    transition: `opacity ${ANIMATION_DURATION}ms ease, transform ${ANIMATION_DURATION}ms ease`,
                  }}
                />
              );
            })}

          {/* Loading indicator */}
          {isLoading && (
            <g>
              <circle r={20} fill="none" stroke="#d1d5db" strokeWidth={2}>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </circle>
              <text
                textAnchor="middle"
                dy={40}
                className="fill-gray-400 text-xs"
              >
                Loading...
              </text>
            </g>
          )}

          {/* "More" indicator */}
          {hasMoreDisplay && !transitioning && (
            <text
              textAnchor="middle"
              y={
                displayNodes.length > 0
                  ? Math.max(...displayNodes.map((n) => Math.abs(n.y))) + 60
                  : 200
              }
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
          onClick={() => resetView(true)}
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
