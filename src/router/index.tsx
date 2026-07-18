import { createBrowserRouter } from 'react-router-dom'
import Layout from '../components/Layout'
import Home from '../pages/Home'
import Catalog from '../pages/Catalog'
import ProductDetail from '../pages/ProductDetail'
import Accessories from '../pages/Accessories'
import AccessoryDetail from '../pages/AccessoryDetail'
import Wishlist from '../pages/Wishlist'
import Cart from '../pages/Cart'
import Checkout from '../pages/Checkout'
import OrderConfirmation from '../pages/OrderConfirmation'
import About from '../pages/About'
import Contact from '../pages/Contact/Contact'
import SizeGuide from '../pages/SizeGuide'
import Warranty from '../pages/Warranty'
import NotFound from '../pages/NotFound'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },

      // Kitchen catalog
      { path: 'catalog', element: <Catalog /> },
      { path: 'catalog/:productId', element: <ProductDetail /> },

      // Complementary products (accessories)
      { path: 'accessories', element: <Accessories /> },
      { path: 'accessories/:productId', element: <AccessoryDetail /> },

      // User flows
      { path: 'wishlist', element: <Wishlist /> },
      { path: 'cart', element: <Cart /> },
      { path: 'checkout', element: <Checkout /> },
      { path: 'checkout/confirmation', element: <OrderConfirmation /> },

      // Content pages
      { path: 'about', element: <About /> },
      { path: 'contact', element: <Contact /> },
      { path: 'size-guide', element: <SizeGuide /> },
      { path: 'warranty', element: <Warranty /> },

      { path: '*', element: <NotFound /> },
    ],
  },
])

export default router
