import { useMemo, useState } from "react";
import ProductCard from "../../components/ProductCard";
import "../Catalog/Catalog.css";
import { useCart } from "../../context/useCart";
import {
  materialPaintDoors,
  materialPlywood,
} from "../../assets/cloudinaryImages";

type IndividualProduct = {
  id: number;
  name: string;
  category: string;
  price: number;
  image?: string;
};

const individualProducts: IndividualProduct[] = [
  {
    id: 201,
    name: "ארון בסיס 60",
    category: "יחידות בסיס",
    price: 1230,
    image: materialPlywood,
  },
  {
    id: 202,
    name: "ארון בסיס 80",
    category: "יחידות בסיס",
    price: 1450,
    image: materialPlywood,
  },
  {
    id: 203,
    name: "דלת CREAM",
    category: "דלתות",
    price: 390,
    image: materialPaintDoors,
  },
  {
    id: 204,
    name: "דלת CLOUD",
    category: "דלתות",
    price: 390,
    image: materialPaintDoors,
  },
  {
    id: 205,
    name: "דלת LATTE",
    category: "דלתות",
    price: 390,
    image: materialPaintDoors,
  },
];

const categoryFilters = ["הכל", "יחידות בסיס", "דלתות"];

export default function IndividualProducts() {
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const { addToCart } = useCart();

  const filteredProducts = useMemo(() => {
    if (selectedCategory === "הכל") {
      return individualProducts;
    }

    return individualProducts.filter(
      (product) => product.category === selectedCategory,
    );
  }, [selectedCategory]);

  const handleAddToCart = (product: IndividualProduct) => {
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      quantity: 1,
    });
  };

  return (
    <main className="catalog-page">
      <section className="catalog-page__header">
        <h1>מוצרים בודדים</h1>
        <p>מגוון יחידות נגרות, נמכרות כמוצר בודד</p>
      </section>

      <section className="catalog-page__filters" aria-label="סינון לפי קטגוריה">
        {categoryFilters.map((category) => (
          <button
            key={category}
            type="button"
            className={
              selectedCategory === category
                ? "catalog-page__filter catalog-page__filter--active"
                : "catalog-page__filter"
            }
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </section>

      <section className="catalog-page__grid">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            name={product.name}
            subtitle={product.category}
            image={product.image}
            onAddToCart={() => handleAddToCart(product)}
          />
        ))}
      </section>
    </main>
  );
}
