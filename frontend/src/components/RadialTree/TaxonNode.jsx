import { NODE_RADIUS, LABEL_OFFSET } from "./constants.js";

const RANK_FILLS = {
  kingdom: "#c084fc",
  phylum: "#60a5fa",
  class: "#22d3ee",
  order: "#2dd4bf",
  family: "#4ade80",
  genus: "#a3e635",
  species: "#fbbf24",
};

export default function TaxonNode({
  taxon,
  x,
  y,
  ringWidth,
  nodeRadius = NODE_RADIUS,
  isCenter = false,
  isFaded = false,
  onClick,
  style = {},
}) {
  const fill = RANK_FILLS[taxon.rank] || "#9ca3af";
  const commonName = taxon.common_name;
  const displayName = commonName || taxon.scientific_name;
  const opacity = isFaded ? 0.15 : 1;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={() => onClick?.(taxon)}
      className="cursor-pointer"
      style={{ opacity, transition: "opacity 0.4s ease", ...style }}
    >
      {/* Outer ring (species count) */}
      {ringWidth > 0 && (
        <circle
          r={nodeRadius + ringWidth}
          fill={fill}
          opacity={0.25}
        />
      )}

      {/* Main circle */}
      <circle
        r={nodeRadius}
        fill={fill}
        stroke="white"
        strokeWidth={2}
        className="transition-transform duration-200 hover:scale-110"
      />

      {/* Center dot for center node */}
      {isCenter && (
        <circle r={4} fill="white" opacity={0.8} />
      )}

      {/* Labels */}
      <text
        y={nodeRadius + LABEL_OFFSET}
        textAnchor="middle"
        className="pointer-events-none select-none fill-gray-800 text-xs font-medium"
      >
        {displayName.length > 18
          ? displayName.slice(0, 16) + "..."
          : displayName}
      </text>
      {commonName && (
        <text
          y={nodeRadius + LABEL_OFFSET + 14}
          textAnchor="middle"
          className="pointer-events-none select-none fill-gray-400 text-[10px] italic"
        >
          {taxon.scientific_name.length > 20
            ? taxon.scientific_name.slice(0, 18) + "..."
            : taxon.scientific_name}
        </text>
      )}
    </g>
  );
}
