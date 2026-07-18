
import FromHeader from "../Atoms/FormHeader"
import NameInput from "../Atoms/NameInput"
import styled from "styled-components";
import Button from "../Atoms/Button";

const ApplicationFormContainer = styled.div`
display: flex;
flex-direction: column;
align-items: right;
justify-content: space-between;
padding: 1.25rem;
border-radius: 1.25rem;
width: 42.875rem;
height: 28.125rem;
box-sizing: border-box;
border: 0.063rem solid #CCCCCC;
`

const InputContainerStyles= styled.div `
display: flex;
flex-direction:row;
justify-content: space-between;`

const ButtonContainerStyles= styled.div `
display:flex;
flex-direction:row;
align-self: end;
`



function ApplicationForm() {
    return (
       
       <ApplicationFormContainer>
            <FromHeader />
                <InputContainerStyles>    
                    <NameInput />
                    <NameInput hgt="4.438rem" wdh="20.75rem"> מייל</NameInput>
                </InputContainerStyles>
                 <NameInput hgt="11.125rem" wdh="38.438rem"> תוכן פנייה </NameInput>
                <ButtonContainerStyles>           
                    <Button />
                </ButtonContainerStyles> 
        </ApplicationFormContainer>
    )
    
}

export default ApplicationForm