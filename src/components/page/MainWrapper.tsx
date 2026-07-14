import styled from "styled-components";

const Wrapper = styled.div`
width: 100%;
height: 100%;
display: flex;
flex-direction: column;

`






export default function MainWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Wrapper>
      {children}
    </Wrapper>
  );
}