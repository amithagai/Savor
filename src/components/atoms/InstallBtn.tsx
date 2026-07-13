import styled from "styled-components";

const Wrapper = styled.label`
align-items: bottom;
display: flex;
  gap: 6px;
  font-size: 10px;
  margin-top: 15px;
  width: 20%;
`;

const Installbtn = styled.input.attrs({ type: "checkbox" })`
  margin-right: 50px;
  apearance: none;
  web-kit appearance: none;
  border-radius: 100px;
`;

const Text = styled.span`
  line-height: 1.4;
  `;

  
  export default function InstallBtn() {
  return (
    <Wrapper>
      <Installbtn />
      <Text>
      התקנה בבית הלקוח(תשלום למתקין): <strong>₪500</strong>
      </Text>
    </Wrapper>
  );
}