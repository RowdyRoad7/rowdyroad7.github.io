import { useEffect, useState } from "react";

/**
 * Returns true when the viewport is narrower than `breakpoint` (px).
 * Used to switch fixed multi-column layouts to stacked ones on phones.
 */
export function useIsMobile(breakpoint = 560) {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined"
      ? window.innerWidth < breakpoint
      : false,
  );

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);

  return isMobile;
}
