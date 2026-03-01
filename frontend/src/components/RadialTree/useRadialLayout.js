import { useMemo } from "react";
import { scaleSqrt } from "d3";
import {
  FIRST_RING_RADIUS,
  MAX_VISIBLE_CHILDREN,
  NODE_RADIUS,
  RING_MAX,
  RING_MIN,
  RING_SPACING,
} from "./constants.js";

/**
 * Compute how many nodes fit in a ring at the given radius,
 * ensuring nodes don't overlap (minimum angular gap based on node size).
 */
function nodesPerRing(ringRadius) {
  // Each node needs space for circle diameter + label width underneath
  const minArcLength = NODE_RADIUS * 2 + 40;
  const circumference = 2 * Math.PI * ringRadius;
  return Math.max(1, Math.floor(circumference / minArcLength));
}

export function useRadialLayout(children) {
  return useMemo(() => {
    if (!children || children.length === 0) return { nodes: [], hasMore: false };

    const visible = children.slice(0, MAX_VISIBLE_CHILDREN);
    const hasMore = children.length > MAX_VISIBLE_CHILDREN;

    // Scale ring thickness by species_count
    const maxCount = Math.max(...visible.map((c) => c.species_count || 1));
    const ringScale = scaleSqrt()
      .domain([0, maxCount])
      .range([RING_MIN, RING_MAX]);

    // Distribute nodes across concentric staggered rings
    const nodes = [];
    let placed = 0;
    let ringIndex = 0;

    while (placed < visible.length) {
      const radius = FIRST_RING_RADIUS + ringIndex * RING_SPACING;
      const capacity = nodesPerRing(radius);
      const count = Math.min(capacity, visible.length - placed);

      // Stagger odd rings by half a node-gap
      const staggerOffset = ringIndex % 2 === 1
        ? Math.PI / capacity
        : 0;

      for (let i = 0; i < count; i++) {
        const child = visible[placed + i];
        const angle = (2 * Math.PI * i) / count - Math.PI / 2 + staggerOffset;

        nodes.push({
          ...child,
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius,
          angle,
          ringWidth: ringScale(child.species_count || 0),
          nodeRadius: NODE_RADIUS,
        });
      }

      placed += count;
      ringIndex++;
    }

    return { nodes, hasMore };
  }, [children]);
}
