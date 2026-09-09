import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import LogRocket from 'logrocket';
import './index.css'
import App from './App.tsx'
import { CartProvider } from './context/CartProvider'
import { WishlistProvider } from './context/WishlistProvider'
import SiteMetadata from './components/SiteMetadata'

LogRocket.init('savor/savor');

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
