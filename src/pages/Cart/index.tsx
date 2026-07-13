import DeliveryBtn from "../../components/atoms/DeliveryBtn";
import Header from "../../components/atoms/Header";
import InstallBtn from "../../components/atoms/InstallBtn";
import SelfPickBtn from "../../components/atoms/SelfPickBtn";
import BottomCard from "../../components/molecules/BottomCard";
import CheckoutBox from "../../components/molecules/CheckoutBox";
import TopCard from "../../components/molecules/TopCard";
import MainWrapper from "../../components/page/MainWrapper";

export default function Cart() {
  return (
    <>
    <MainWrapper>
      <Header />
      <TopCard />
      <BottomCard />
      <SelfPickBtn />
      <DeliveryBtn/>
      <InstallBtn/>
      <CheckoutBox />
    </MainWrapper>
      
    </>
  );
}