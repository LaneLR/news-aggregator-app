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
`

export default function NavTab({ href, children}) {


    return (
        <>
            <NavBarWrapper href={`${href}`}>{children}</NavBarWrapper>
        </>
    )
}