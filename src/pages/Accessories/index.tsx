import { useMemo, useState } from 'react'
import ProductCard from '../../components/ProductCard'
import '../Catalog/Catalog.css'
import { useCart } from '../../context/useCart'
import {
  materialHandles,
  materialHinges,
  materialSoftClose,
  materialMarble,
  materialPaintDoors,
  materialPlywood,
} from '../../assets/cloudinaryImages'

type Accessory = {
  id: number
  name: string
  category: string
  price: number
  image?: string
}

const accessories: Accessory[] = [
  { id: 101, name: 'ידיות', category: 'פרזול', price: 120, image: materialHandles },
  { id: 102, name: 'צירים', category: 'פרזול', price: 90, image: materialHinges },
  { id: 103, name: 'סחיפה שקטה', category: 'פרזול', price: 150, image: materialSoftClose },
  { id: 104, name: 'משטח שיש', category: 'חומרי גימור', price: 1890, image: materialMarble },
  { id: 105, name: 'דלתות בצבע', category: 'חומרי גימור', price: 690, image: materialPaintDoors },
  { id: 106, name: 'פורניר', category: 'חומרי גימור', price: 590, image: materialPlywood },
]

const categoryFilters = ['הכל', 'פרזול', 'חומרי גימור']

export default function Accessories() {
  const [selectedCategory, setSelectedCategory] = useState('הכל')

  const { addToCart } = useCart()

  const filteredAccessories = useMemo(() => {
    if (selectedCategory === 'הכל') {
      return accessories
    }

    return accessories.filter((accessory) => accessory.category === selectedCategory)
  }, [selectedCategory])

  const handleAddToCart = (accessory: Accessory) => {
    addToCart({
      id: accessory.id,
      name: accessory.name,
      category: accessory.category,
      price: accessory.price,
      quantity: 1,
    })
  }

  return (
    <main className="catalog-page">
      <section className="catalog-page__header">
        <h1>מוצרים משלימים</h1>
        <p>שדרגו את המטבח עם אביזרים וחומרי גימור מקטלוג Savor.</p>
      </section>

      <section className="catalog-page__filters" aria-label="סינון לפי קטגוריה">
        {categoryFilters.map((category) => (
          <button
            key={category}
            className={
              selectedCategory === category
                ? 'catalog-page__filter catalog-page__filter--active'
                : 'catalog-page__filter'
            }
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </section>

      <section className="catalog-page__grid">
        {filteredAccessories.map((accessory) => (
          <ProductCard
            key={accessory.id}
            name={accessory.name}
            subtitle={accessory.category}
            image={accessory.image}
            onAddToCart={() => handleAddToCart(accessory)}
          />
        ))}
      </section>
    </main>
  )
}
