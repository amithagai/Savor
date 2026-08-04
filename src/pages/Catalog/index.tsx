import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../../components/ProductCard'
import './Catalog.css'
import { useCart } from '../../context/useCart'
import { craem1 as creamImage, latteHome as latteImage } from '../../assets/cloudinaryImages'

type Kitchen = {
  id: number
  name: string
  size: string
  price: number
  image?: string
}

const kitchens: Kitchen[] = [
  { id: 1, name: 'CREAM', size: '1.5 מטר', price: 1230, image: creamImage },
  { id: 2, name: 'CLOUD', size: '1.5 מטר', price: 1450 },
  { id: 3, name: 'LATTE', size: '2 מטר', price: 1690, image: latteImage },
]

const sizeFilters = ['הכל', '1.5 מטר', '2 מטר', '2.1 מטר', '2.6 מטר', '3.2 מטר']

export default function Catalog() {
  const [searchParams] = useSearchParams()
  const sizeFromUrl = searchParams.get('size')
  const selectedSize = sizeFromUrl && sizeFilters.includes(sizeFromUrl)
    ? sizeFromUrl
    : 'הכל'

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
    price: kitchen.price,
    quantity: 1,
  })
}

  return (
    <main className="catalog-page">
      <section className="catalog-page__header">
        <h1>{selectedSize === 'הכל' ? 'מטבחים' : `מטבח ${selectedSize}`}</h1>
      </section>

      <section className="catalog-page__grid">
        {filteredKitchens.length > 0 ? (
          filteredKitchens.map((kitchen) => (
            <ProductCard
              key={kitchen.id}
              name={kitchen.name}
              subtitle={kitchen.size}
              image={kitchen.image}
              onAddToCart={() => handleAddToCart(kitchen)}
            />
          ))
        ) : (
          <p className="catalog-page__empty">
            עדיין אין מטבחים זמינים במידה {selectedSize}.
          </p>
        )}
      </section>
    </main>
  )
}
