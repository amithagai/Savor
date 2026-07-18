import styled from 'styled-components'

const HeaderStyles = styled.h1`
  font-family: 'heebo';
  font-size: 2.5rem;
  box-sizing: border-box;
  width: 9.188rem;
  height: 3.183rem;
`

function Header() {
  return (
    <header>
      <HeaderStyles>צור קשר</HeaderStyles>
    </header>
  )
}

export default Header