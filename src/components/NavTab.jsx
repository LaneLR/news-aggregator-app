import Link from "next/link";
import styled from "styled-components";

const NavBarWrapper = styled(Link)`
display: flex;
justify-content: center;
align-items: center;
text-align: center;
width: 100%;
height: auto;
padding: 3px;
border: 1px solid black;
margin: 15px 0;
font-size: 1.3rem;
background-color: var(--deep-blue);
`

export default function NavTab({ href, children}) {


    return (
        <>
            <NavBarWrapper href={`${href}`}>{children}</NavBarWrapper>
        </>
    )
}