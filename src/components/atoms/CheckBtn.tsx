import styled from "styled-components";

const Wrapper = styled.label`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
`;

const Checkbox = styled.input`
  accent-color: #000;
`;

const Text = styled.span`
  line-height: 1.4;
`;

export default function CheckBtn() {
  return (
    <Wrapper>
      <Checkbox type="checkbox" />
      <Text>
        איסוף עצמי ממחסני החברה-<strong>חינם</strong>
      </Text>
    </Wrapper>
  );
}