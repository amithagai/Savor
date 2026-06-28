# Savor — Frontend

E-commerce frontend for Savor, a premium kitchen design and ordering platform. Built with React 19 + TypeScript + Vite.

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app runs at `http://localhost:5173` by default.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with HMR |
| `npm run build` | Type-check and build for production (`dist/`) |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 6 | Type safety |
| Vite | 8 | Build tool & dev server |
| React Router DOM | 7 | Client-side routing |

---

## Project Structure

```
src/
├── assets/          # SVGs and static images
├── components/
│   ├── Layout/      # Root layout wrapper (Navbar + Outlet + Footer)
│   ├── Navbar/      # Top navigation bar
│   └── Footer/      # Site footer
├── pages/
│   ├── Home/        # Landing page with hero, best sellers, gallery, etc.
│   ├── Catalog/     # Kitchen catalog with filters
│   ├── ProductDetail/      # Single kitchen product page
│   ├── Accessories/        # Complementary products catalog
│   ├── AccessoryDetail/    # Single accessory page
│   ├── Cart/        # Shopping cart
│   ├── Wishlist/    # Saved items
│   ├── Checkout/    # Shipping & payment form
│   ├── OrderConfirmation/  # Post-purchase confirmation
│   ├── About/       # About Savor
│   ├── Contact/     # Contact form
│   ├── SizeGuide/   # Kitchen measurement guide
│   ├── Warranty/    # Warranty & return policy
│   └── NotFound/    # 404 page
└── router/
    └── index.tsx    # All route definitions
```

---

## Routes

| Path | Page |
|---|---|
| `/` | Home |
| `/catalog` | Kitchen catalog |
| `/catalog/:productId` | Product detail |
| `/accessories` | Accessories catalog |
| `/accessories/:productId` | Accessory detail |
| `/cart` | Cart |
| `/wishlist` | Wishlist |
| `/checkout` | Checkout |
| `/checkout/confirmation` | Order confirmation |
| `/about` | About |
| `/contact` | Contact |
| `/size-guide` | Size guide |
| `/warranty` | Warranty policy |

---

## Environment Variables

Create a `.env` file in the project root (see `.env` for the current template):

```env
# Add your environment variables here, e.g.:
# VITE_API_URL=http://localhost:8000
```

All variables exposed to the browser must be prefixed with `VITE_`.

---

## Architecture Notes

See [savor-hld.md](./savor-hld.md) for the full High-Level Design document covering:
- Phase 1 MVP scope (this frontend)
- Data model design (Composite Product pattern)
- Backend module breakdown
- Phase 2 Configurator planning
