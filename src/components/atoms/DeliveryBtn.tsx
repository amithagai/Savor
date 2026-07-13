import styled from "styled-components";

const Wrapper = styled.label`
align-items: bottom;
display: flex;
  gap: 6px;
  font-size: 10px;
  margin-top: 5px;
  width: 15%;
`;

const Deliverybtn = styled.input.attrs({ type: "radio" })`
  margin-right: 50px;
`;

const Text = styled.span`
  line-height: 1.4;
  
`;

export default function DeliveryBtn() {
  return (
    <Wrapper>
      <Deliverybtn />
      <Text>
       משלוח עד הבית תוספת <strong>₪400</strong>
      </Text>
    </Wrapper>
  );
}