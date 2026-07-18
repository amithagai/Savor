import styled from "styled-components";

const Inputstyle = styled.input`
    width: 33.5rem;  
    padding-bottom: 11rem;
    padding-left: 0.7rem;
    padding-right: 0.7rem;
    height: 13.94rem;
    border-radius: 1.25rem;
    background: #EDEDED;
    outline:none;
    border:none;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    box-sizing: border-box;
    `

function TextInput() {
    return (

        <Inputstyle
         type="text" placeholder="Enter your name" />

    )
}
 
export default TextInput