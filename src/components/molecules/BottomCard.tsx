import styled   from "styled-components";

const Wrapper = styled.div`
  display: flex;
  align-items: flex-start;
  flex-direction: row;
  justify-content: flex-start;
  border: 0.0625rem solid #000; 
  width: 20%;
  height: 14vh;
  border-radius: 0.625rem; 
  margin-right: 3.125rem; 
  margin-top: 1.25rem; 
  margin-bottom: 0.625rem; 
`;

const Imagewrapper = styled.div`
  width: 30%;
  height: 11vh;
  border-radius: 10px;
  border: 1px solid #000;
  align-self: flex-start;
  
`;

const SecondaryWrapper = styled.div`
align-self: center;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  margin-right: 5px;
  position: relative;
  `;

const Cream = styled.p`
  font-size: 10px;
  margin: 0;
  margin-bottom: 3px;
`;

const Mini = styled.p`
    font-size: 9px;
  color: #545454;
margin-bottom: 20px;
`;

const Circle = styled.div`
 width: 12%;
 height: 2vh;
  background-color: #D9D9D9;
  border-radius: 100%;
  
`;

const ArrowButton = styled.select`
  width: 40%;
  height: 4vh;
  border: 1px solid black;
  border-radius: 5px;
  position: absolute;
  right: 20%; 
  top: 80%;
  transform: translateY(-50%);
`;

const XButton = styled.button`
  width: 2%;
  height: 2vh;
font-size: 10px;
  border-radius: 5px;
  position: absolute;
  right: 22%;
  top: 41%;
  transform: translateY(-50%);
`;


const Price = styled.p`
  font-size: 10px;
position: absolute;
  right: 20.5%;
  top: 51%;
  transform: translateY(-50%);
  `


  export default function BottomCard() {
  return (
    <Wrapper>
      <Imagewrapper><img src="" alt=""  /></Imagewrapper>
      <XButton>X</XButton>
      <SecondaryWrapper>
        <Cream>דגם CREAM - יחידת תנור<br />דגם CREAM - יחידת תנור</Cream> 
        <Mini>חזית 2 דלתות</Mini>
        <Circle></Circle>
        <ArrowButton>
          <option value="option1">1</option>
          <option value = "option2"> 2</option>
        </ArrowButton>
      </SecondaryWrapper>
      <Price><strong>₪1,230</strong></Price>
      
      
        
    </Wrapper>
  );
}







