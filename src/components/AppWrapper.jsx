'use client'
import styled from "styled-components"

const Wrapper = styled.div`
display: flex;
  flex-direction: column;
  min-height: 100vh;
`

export default function AppWrapper({children}) {
  return (
    <Wrapper>{children}</Wrapper>
  )
}

