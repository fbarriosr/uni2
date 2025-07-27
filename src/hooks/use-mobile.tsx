"use client"

import { useState, useEffect } from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Initialize with null to indicate that the check hasn't been performed yet.
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    // This effect runs only on the client, after the component has mounted.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Set the state based on the initial check
    setIsMobile(mql.matches)

    // Create a listener for viewport changes
    const listener = (event: MediaQueryListEvent) => {
      setIsMobile(event.matches)
    }

    // Add the listener
    mql.addEventListener("change", listener)

    // Clean up the listener on component unmount
    return () => {
      mql.removeEventListener("change", listener)
    }
  }, []) // Empty dependency array ensures this runs only once on mount

  return isMobile
}
