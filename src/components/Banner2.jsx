import styled from "styled-components";

const Wrapper = styled.div`
  width: 100%;
  height: 320px;
  background-color: var(--secondary-blue);
  background-image: linear-gradient(
    to right,
    var(--primary-blue),
    var(--secondary-blue)
  );
`;

export default function Banner2() {
  return (
    <>
      <Wrapper></Wrapper>
    </>
  );
}
