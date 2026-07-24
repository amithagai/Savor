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


export default function Catalog() {
const [searchParams] = useSearchParams()
const selectedSize = searchParams.get('size') ?? 'הכל'
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
<h1>מטבחים</h1>
<p>בחרו מטבח מוכן מתוך קטלוג הדגמים של Savor.</p>
      </section>



      <section className="catalog-page__grid">
        {filteredKitchens.map((kitchen) => (
          <ProductCard
            key={kitchen.id}
            name={kitchen.name}
            subtitle={kitchen.size}
            image={kitchen.image}
            onAddToCart={() => handleAddToCart(kitchen)}
          />
        ))}
      </section>
    </main>
  )
}