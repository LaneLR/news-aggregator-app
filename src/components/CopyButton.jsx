"use client";
import { useState } from "react";
import styled from "styled-components";

const StyledButton = styled.button`
  padding: 8px 16px;
  font-size: 1rem;
  font-weight: 600;
  border-top-right-radius: 10px;
  border-bottom-right-radius: 10px;
  height: 100%;
  width: 150px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 3px;

  background-color: ${(props) =>
    props.status === "Copied" ? "var(--deep-blue)" : "var(--primary-blue)"};
  color: ${(props) => (props.status === "Copied" ? "white" : "var(--white)")};

  &:hover {
    background-color: ${(props) =>
      props.status === "Copied" ? "var(--deep-blue)" : "var(--deep-blue)"};
  }
`;

export default function CopyButton({ textToCopy }) {
  const [copyStatus, setCopyStatus] = useState("Copy");

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      alert("Clipboard API not available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopyStatus("Copied");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      setCopyStatus("Failed!");
    } finally {
      setTimeout(() => {
        setCopyStatus("Copy");
      }, 2000);
    }
  };

  return (
    <StyledButton onClick={handleCopy} status={copyStatus.toUpperCase()}>
      {copyStatus === "Copy" ? (
        <img src="/images/copy-unfilled-white.svg" height={29} width={29} alt="Copy referral code" />
      ) : copyStatus === "Copied" ? (
        <img src="/images/copy-filled-white.svg" height={29} width={29} alt="Referral code copied"/>
      ) : (
        <img src="/images/copy-unfilled.svg" height={29} width={29} alt="Copy referral code"/>
      )}
      <div style={{width: '100%'}}>
        {copyStatus}
      </div>
      
    </StyledButton>
  );
}
