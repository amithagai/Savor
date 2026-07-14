import styled from "styled-components";

const Wrapper = styled.div`
  background-color: #F7F7F7;
  border-radius: 1.25rem;
  border: 0.0625rem solid #000000; 
  width: 34.5rem;
  height: 13.6875rem;
  justify-self: center;
  align-self: center;
  position: relative;
  top: -2rem;
  margin-bottom: 8%;
  margin-right: 15%;
  padding: 0.625rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Card = styled.p`
 font-size: 0.850rem;
width: 5.625rem;
height: 1.375rem;
`;

const Termscontainer = styled.div`
  
  flex-direction: column;
 gap: 5px;
height: 30%;
width: 100%;
border: 0px solid #f50c0c;

  `;

const Checkboxwrapper = styled.div`
flex-direction: row;
display: flex;
margin-top: 1px;
height: 1.75rem;

;`

  const Termscheckbox = styled.input.attrs({ type: "checkbox" })`
  width: 1rem;
  height: 0.900rem;
  
  `;

  const Termstext = styled.p`
  font-size: 0.800rem;
justify-self: center;
width: 85%;
height: 3vh;
margin-right: 5px;


  `;

  const TermsLink = styled.a`
    color: #3B75D1;
    
  `;



const Overallpay = styled.div`
  border: 0px solid #db0dff;
  width: 100%;
  height: 5vh;
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  justify-self: center;
  padding: 0;
  margin: 0;
  margin-top: auto;
  margin-bottom: 4%;
`;

const Paytext = styled.h2`
font-size: 1rem;
font-family: "Segoe UI", Arial, sans-serif;
`;

const PayBtnWrapper = styled.div`
width: 100%;
height: 3.25rem;
border: 0px solid gold;
display: flex;
align-items: center;
justify-content: center;

`;

const PayBtn = styled.button`
apearance: none;
web-kit apearance: none;
background-color: lightgreen;
width: 80%;
height: 80%;
border-radius: 1.25rem;
color: #FFFF;
font-family: "Segoe UI", Arial, sans-serif;
`;



export default function CheckoutBox() {
  return (
    <Wrapper>
      
     <Termscontainer>
      <Card> <strong>כרטיס אשראי</strong></Card>
      <Checkboxwrapper>
<Termscheckbox />
      <Termstext>
        קראתי והסכמתי ל
        <TermsLink href="/terms" target="_blank" rel="noopener noreferrer">
          תנאי השימוש
        </TermsLink>
        *
      </Termstext>
      </Checkboxwrapper>
     </Termscontainer>
     <Overallpay>
      <Paytext> סך הכל לתשלום: 4,000 ₪ </Paytext>
     </Overallpay>
     <PayBtnWrapper>
      <PayBtn>מעבר לתשלום</PayBtn>
     </PayBtnWrapper>
    </Wrapper>
  );
}