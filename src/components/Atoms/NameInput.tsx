import styled from "styled-components";
import type { ReactNode } from "react";

const NameInputStyles = styled.input<{ wdh?: string; hgt?:string;}>`
  width: ${({ wdh }) => wdh || "14.125rem"};
  height: ${({hgt}) => hgt || "4.438rem"};
  border-radius: 1.25rem;
  border: 0.063rem solid #D4D4D4;
  box-sizing: border-box;
  gepedding-left: 0.7rem;
  pedding-right: 0.7rem;
`;

const TopSectionStyles = styled.div`
    display: flex;
    flex-direction: column;
`

type NameInputProps = {
  children?: ReactNode;
  id?: string;
  type?: string;
  placeholder?: string;
  hgt?: string;
  wdh?: string;
};



function NameInput(props: NameInputProps) {
    const {
  children = "שם מלא",
  id = "name",
  type = "text",
  placeholder = "",
} = props
  return (
    <TopSectionStyles>
      <label htmlFor={id}>{children}</label>
      <NameInputStyles id={id} type={type} placeholder={placeholder}
      hgt={props.hgt} wdh={props.wdh}/>
    </TopSectionStyles>
  );
}

export default NameInput;






