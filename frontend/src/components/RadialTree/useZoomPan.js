import { useEffect, useRef } from "react";
import { select, zoom, zoomIdentity } from "d3";
import { ZOOM_MAX, ZOOM_MIN } from "./constants.js";

export function useZoomPan(svgRef, contentRef) {
  const zoomBehavior = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !contentRef.current) return;

    const svg = select(svgRef.current);
    const content = select(contentRef.current);

    zoomBehavior.current = zoom()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      .on("zoom", (event) => {
        content.attr("transform", event.transform);
      });

    svg.call(zoomBehavior.current);

    // Center on initial load
    const { width, height } = svgRef.current.getBoundingClientRect();
    svg.call(
      zoomBehavior.current.transform,
      zoomIdentity.translate(width / 2, height / 2)
    );

    return () => {
      svg.on(".zoom", null);
    };
  }, [svgRef, contentRef]);

  function resetView() {
    if (!svgRef.current || !zoomBehavior.current) return;
    const svg = select(svgRef.current);
    const { width, height } = svgRef.current.getBoundingClientRect();
    svg
      .transition()
      .duration(400)
      .call(
        zoomBehavior.current.transform,
        zoomIdentity.translate(width / 2, height / 2)
      );
  }

  return { resetView };
}
