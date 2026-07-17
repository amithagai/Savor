import { useEffect } from 'react'
import giff from '../../assets/pot.gif'
import styles from './styles.module.css'
import { useCart } from '../../context/useCart'


const scrollToTop = () => { 
  window.scrollTo({top:0, behavior:"smooth"})
}

export default function Checkout() {
  const { clearCart } = useCart() 
  useEffect(() => { 
    clearCart()
    scrollToTop()
  },[])

  return (
    <div className={styles.wrapper}>
      <img src={giff} className={styles.giff}/>
      <ThankUMessage />
      <ReceiptMessage />
  </div>
  )
}

const ThankUMessage = () => {
  return (
    <h1>תודה שרכשתם SAVOR!</h1>
  )
}
const ReceiptMessage = () => { 
  return (
    <div>הקבלה תשלח אליכם בדקות הקרובות למייל.</div>
  )
}