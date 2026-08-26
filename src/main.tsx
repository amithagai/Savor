import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { CartProvider } from './context/CartProvider'
import { WishlistProvider } from './context/WishlistProvider'
import SiteMetadata from './components/SiteMetadata'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CartProvider>
      <WishlistProvider>
        <SiteMetadata />
        <App />
      </WishlistProvider>
    </CartProvider>
  </StrictMode>,
)
