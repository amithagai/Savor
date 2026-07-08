import { useMemo, useState } from 'react'
import ProductCard from '../../components/ProductCard'
import './Catalog.css'
import { useCart } from '../../context/useCart'
type Kitchen = {
  id: number
  name: string
  size: string
}

const kitchens: Kitchen[] = [
  { id: 1, name: 'CREAM', size: '1.5 מטר' },
  { id: 2, name: 'CLOUD', size: '1.5 מטר' },
  { id: 3, name: 'LATTE', size: '2 מטר' },
]

const sizeFilters = ['הכל', '1.5 מטר', '2 מטר']

export default function Catalog() {
  const [selectedSize, setSelectedSize] = useState('הכל')

  const { addToCart } = useCart()

  const filteredKitchens = useMemo(() => {
    if (selectedSize === 'הכל') {
      return kitchens
    }

    return kitchens.filter((kitchen) => kitchen.size === selectedSize)
  }, [selectedSize])

const handleAddToCart = (kitchen: Kitchen) => {
  addToCart({
    id: kitchen.id,
    name: kitchen.name,
    size: kitchen.size,
    quantity: 1,
  })
}

  return (
    <main className="catalog-page">
      <section className="catalog-page__header">
        <h1>מטבחים</h1>
        <p>בחרו מטבח מוכן מתוך קטלוג הדגמים של Savor.</p>
      </section>

      <section className="catalog-page__filters" aria-label="סינון לפי גודל">
        {sizeFilters.map((size) => (
          <button
            key={size}
            className={selectedSize === size ? 'catalog-page__filter catalog-page__filter--active' : 'catalog-page__filter'}
            onClick={() => setSelectedSize(size)}
          >
            {size}
          </button>
        ))}
      </section>

      <section className="catalog-page__grid">
        {filteredKitchens.map((kitchen) => (
          <ProductCard
            key={kitchen.id}
            name={kitchen.name}
            subtitle={kitchen.size}
            onAddToCart={() => handleAddToCart(kitchen)}
          />
        ))}
      </section>
    </main>
  )
}