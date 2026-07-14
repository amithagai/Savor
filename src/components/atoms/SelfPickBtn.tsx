import styled from "styled-components";

const Wrapper = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  width: 20%;
`;

const Selfpick = styled.input.attrs({ type: "radio" })`
  margin-right: 50px;
  apearance: none;
  web-kit appearance: none;
  border-radius: 50%;
`;

const Text = styled.span`
  line-height: 1.4;
  
`;

export default function SelfPickBtn() {
  return (
    <Wrapper>
      <Selfpick />
      <Text>
        איסוף עצמי ממחסני החברה -  <strong>חינם</strong>
      </Text>
    </Wrapper>
  );
}