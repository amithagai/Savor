import { useMemo, useState } from "react";
import ProductCard from "../../components/ProductCard";
import "../Catalog/Catalog.css";
import "./Accessories.css";
import { useCart } from "../../context/useCart";
import {
  materialHandles,
  materialHinges,
  materialSoftClose,
  materialMarble,
  materialPaintDoors,
  materialPlywood,
} from "../../assets/cloudinaryImages";

type Accessory = {
  id: number;
  name: string;
  category: string;
  price: number;
  image?: string;
};

const accessories: Accessory[] = [
  {
    id: 101,
    name: "כיור שחור",
    category: "כיורים",
    price: 1230,
    image: materialHandles,
  },
  {
    id: 102,
    name: "כיור לבן",
    category: "כיורים",
    price: 990,
    image: materialHinges,
  },
  {
    id: 103,
    name: "משטח שיש גרניט",
    category: "קטלוג שיש",
    price: 1850,
    image: materialMarble,
  },
  {
    id: 104,
    name: "ידית שחורה",
    category: "ידיות",
    price: 120,
    image: materialSoftClose,
  },
  {
    id: 105,
    name: "ידית זהב",
    category: "ידיות",
    price: 140,
    image: materialPaintDoors,
  },
  {
    id: 106,
    name: "ידית אפורה",
    category: "ידיות",
    price: 1430,
    image: materialPlywood,
  },
];

const categoryFilters = ["הכל", "כיורים", "קטלוג שיש", "ידיות"];

export default function Accessories() {
  const [selectedCategory, setSelectedCategory] = useState("הכל");

  const { addToCart } = useCart();

  const filteredAccessories = useMemo(() => {
    if (selectedCategory === "הכל") {
      return accessories;
    }

    return accessories.filter(
      (accessory) => accessory.category === selectedCategory,
    );
  }, [selectedCategory]);

  const handleAddToCart = (accessory: Accessory) => {
    addToCart({
      id: accessory.id,
      name: accessory.name,
      category: accessory.category,
      price: accessory.price,
      quantity: 1,
    });
  };

  return (
    <main className="catalog-page">
      <section className="catalog-page__header">
        <h1>מוצרים משלימים</h1>

        <section
          className="accessories-page__filters"
          aria-label="סינון לפי קטגוריה"
        >
          {categoryFilters.map((category) => (
            <button
              key={category}
              type="button"
              className={
                selectedCategory === category
                  ? "accessories-page__filter accessories-page__filter--active"
                  : "accessories-page__filter"
              }
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </section>

        <p className="accessories-page__subtitle">
          מגוון כיורים מעבר לכיור הנירוסטה הסטנדרטי המגיע עם המטבח
        </p>
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
  );
}
