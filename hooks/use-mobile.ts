import * as React from 'react'

// Tailwind's `md` breakpoint: mobile is anything below 768px.
const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // `undefined` on the server and on the first client render, so hydration
  // stays in sync; the real value is measured in an effect afterwards.
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(mql.matches)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
