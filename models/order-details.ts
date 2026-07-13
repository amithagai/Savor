
export type OrderDetails = {
  orderNumber: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  estimatedDelivery: string;
  status: string;
};

// Define OrderItem locally to fix missing type error
export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: number;
  // optional fields
  sku?: string;
  variant?: string;
};