import { useParams } from 'react-router-dom'

export default function AccessoryDetail() {
  const { productId } = useParams()
  return <div>AccessoryDetail — {productId}</div>
}
