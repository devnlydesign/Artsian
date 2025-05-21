
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Default to false for SSR. The client will update this value after mounting.
  // This ensures the server render and initial client render are consistent.
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    // This effect runs only on the client side.
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    checkIsMobile() // Check on initial client mount.

    // Listen to resize events to update the value.
    window.addEventListener("resize", checkIsMobile)

    // Cleanup listener on component unmount.
    return () => {
      window.removeEventListener("resize", checkIsMobile)
    }
  }, []) // Empty dependency array ensures this effect runs only once on mount and unmount.

  return isMobile
}
