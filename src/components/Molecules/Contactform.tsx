import Header from "../Atoms/ContactHeader";
import Paregraph from "../../components/Atoms/Paregraph";
import Input from "../Atoms/TextInput";
import styled from "styled-components";

const ContactFormContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: right;
  justify-content: space-between;
  gap: 1rem;
  box-sizing: border-box;
`


function ContactForm() {
    return (
        <ContactFormContainer>
            <Header />
            <Paregraph />
            <Input />
        </ContactFormContainer>
    )
}

export default ContactForm

