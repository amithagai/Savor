import styled from "styled-components";

const ParagraphStyles = styled.span`
    font-family: 'Rubik';
    font-weight: bold;
    font-size: 1rem;
    margin-bottom:1rem;
    box-padding: border-box;
`;

const LineStyles = styled.div`
    display: flex;
    flex-direction: column;
    justify-content:space-between;
    box-sizing: border-box;
    width: 23.813rem;
    height: 8rem;
`;

function Paregraph() {
    return (
        <LineStyles>
            <ParagraphStyles>לכל שאלה מוזמנים לפנות אלינו.</ParagraphStyles>
            <p style={{ fontFamily: 'Rubik' }}>משרד טלפון: 055-556-5617</p>
            <p style={{ fontFamily: 'Rubik' }}>מייל:</p>
            <p style={{ fontFamily: 'Rubik' }}>כתובת לאיסוף עצמי: מומנטום- שדרות טום לנטוס 10, נתניה</p>
        </LineStyles>
    );
}

export default Paregraph