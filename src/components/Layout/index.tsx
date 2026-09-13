import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../Navbar'
import Footer from '../Footer'
import SiteMetadata from '../SiteMetadata'

export default function Layout() {
  const location = useLocation()
  const mainRef = useRef<HTMLElement>(null)
  const previousPath = useRef(location.pathname)

  useEffect(() => {
    if (previousPath.current === location.pathname) {
      return
    }

    previousPath.current = location.pathname
    mainRef.current?.focus({ preventScroll: true })
  }, [location.pathname])

  return (
    <>
      <SiteMetadata />
      <a className="skip-link" href="#main-content">
        דילוג לתוכן הראשי
      </a>
      <Navbar />
      <main id="main-content" ref={mainRef} tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}
