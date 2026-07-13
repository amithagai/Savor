import styled from "styled-components";

const Wrapper = styled.div`
  background-color: #F7F7F7;
  border-radius: 1.25rem;
  border: 0.0625rem solid #000000; 
  width: 552px;
  height: 219px;
  justify-self: center;
  margin-bottom: 8%;
  margin-right: 15%;
  padding: 0.625rem;
`;

const Card = styled.p`
 font-size: 10px;
width: 5.625rem;
height: 1.375rem;
`;

const Termscontainer = styled.div`
  
  flex-direction: column;
 gap: 5px;
height: 30%;
width: 100%;
border: 1px solid #f50c0c;

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
  font-size: 10px;
justify-self: center;
width: 85%;
height: 3vh;
margin-right: 5px;


  `;

  const TermsLink = styled.a`
    color: #3B75D1;
    
  `;



const Overallpay = styled.div`
border: 1px solid #db0dff;
width: 100%;
height: 5vh;
align-self: center;
justify-self: center;
padding: 0;
margin: 0;

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
     <Overallpay></Overallpay>
    </Wrapper>
  );
}