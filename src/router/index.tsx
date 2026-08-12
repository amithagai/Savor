import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import Layout from "../components/Layout";
import Home from "../pages/Home";
import Configurator from "../pages/Configurator";
import Catalog from "../pages/Catalog";
import SingleProducts from "../pages/SingleProducts";
import ProductDetail from "../pages/ProductDetail";
import Accessories from "../pages/Accessories";
import AccessoryDetail from "../pages/AccessoryDetail";
import Wishlist from "../pages/Wishlist";
import Cart from "../pages/Cart";
import Checkout from "../pages/Checkout";
import OrderConfirmation from "../pages/OrderConfirmation";
import About from "../pages/About";
import Contact from "../pages/Contact";
import SizeGuide from "../pages/SizeGuide";
import Warranty from "../pages/Warranty";
import Terms from "../pages/Terms";
import AssemblyGuides from "../pages/AssemblyGuides";
import NotFound from "../pages/NotFound";
import { AdminAuthProvider } from "../context/AdminAuthProvider";
import ProtectedAdminRoute from "../components/ProtectedAdminRoute";
import AdminLayout from "../components/AdminLayout";
import AdminLogin from "../pages/AdminLogin";
import AdminPrices from "../pages/AdminPrices";
import AdminOrders from "../pages/AdminOrders";
import AdminProducts from "../pages/AdminProducts";
import AdminProductEditor from "../pages/AdminProductEditor";
import AdminContent from "../pages/AdminContent";
import AdminInventory from "../pages/AdminInventory";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },

      // Configurator (kitchen planner)
      { path: "configurator", element: <Configurator /> },

      // Kitchen catalog
      { path: "catalog", element: <Catalog /> },
      { path: "catalog/:productId", element: <ProductDetail /> },

      // Standalone cabinet units
      { path: "single-products", element: <SingleProducts /> },
      { path: "single-products/:productId", element: <ProductDetail /> },

      // Complementary products (accessories)
      { path: "accessories", element: <Accessories /> },
      { path: "accessories/:productId", element: <AccessoryDetail /> },

      // User flows
      { path: "wishlist", element: <Wishlist /> },
      { path: "cart", element: <Cart /> },
      { path: "checkout", element: <Checkout /> },
      { path: "checkout/confirmation", element: <OrderConfirmation /> },

      // Content pages
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "size-guide", element: <SizeGuide /> },
      { path: "warranty", element: <Warranty /> },
      { path: "terms", element: <Terms /> },
      { path: "assembly-guides", element: <AssemblyGuides /> },

      { path: "*", element: <NotFound /> },
    ],
  },

  // Admin area — separate shell, no storefront Navbar/Footer
  {
    path: "/admin",
    element: (
      <AdminAuthProvider>
        <Outlet />
      </AdminAuthProvider>
    ),
    children: [
      { path: "login", element: <AdminLogin /> },
      {
        element: <ProtectedAdminRoute />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <Navigate to="products" replace /> },
              { path: "products", element: <AdminProducts /> },
              { path: "products/:productId", element: <AdminProductEditor /> },
              { path: "prices", element: <AdminPrices /> },
              { path: "inventory", element: <AdminInventory /> },
              { path: "orders", element: <AdminOrders /> },
              { path: "content", element: <AdminContent /> },
            ],
          },
        ],
      },
      { path: "*", element: <NotFound /> },
    ],
  },
]);

export default router;
