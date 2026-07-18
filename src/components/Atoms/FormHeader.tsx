import styled from "styled-components";

const FormStyles = styled.header`
Font-family: 'Rubik';
Font-size:1.5rem,
font-weight: 37.5rem;
box-sizing: border-box;`

function FormHeader() {
    return (
       <FormStyles>
        <h2>טופס פנייה</h2>
       </FormStyles>
    )
}

export default FormHeader
