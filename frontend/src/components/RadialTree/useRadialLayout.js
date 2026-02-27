import { useMemo } from "react";
import { scaleSqrt } from "d3";
import {
  CHILD_ORBIT_RADIUS,
  MAX_VISIBLE_CHILDREN,
  NODE_RADIUS,
  RING_MAX,
  RING_MIN,
} from "./constants.js";

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

    const count = visible.length;
    const angleStep = (2 * Math.PI) / Math.max(count, 1);

    const nodes = visible.map((child, i) => {
      const angle = angleStep * i - Math.PI / 2; // Start from top
      const radius = CHILD_ORBIT_RADIUS;
      return {
        ...child,
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        angle,
        ringWidth: ringScale(child.species_count || 0),
        nodeRadius: NODE_RADIUS,
      };
    });

    return { nodes, hasMore };
  }, [children]);
}
