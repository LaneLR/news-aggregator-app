"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import styled from "styled-components";

function useTemporaryRouter() {
  const routerRefresh = () => {
    console.log(
      "Mock router refresh triggered. A parent component would now re-fetch data."
    );
  };
  return { refresh: routerRefresh };
}


const CardContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  max-width: 350px;
  height: 220px;
  border-radius: 16px;
  // Use themed colors for the border and text
  border: 2px dashed ${(props) => props.theme.textSecondary};
  cursor: pointer;
  color: ${(props) => props.theme.textSecondary};
  transition: all 0.2s ease-in-out;
  &:hover {
    // Use themed colors for the hover state
    border-color: ${(props) => props.theme.primary};
    color: ${(props) => props.theme.primary};
    background-color: ${(props) => props.theme.cardBackground};
    filter: brightness(0.95);
  }
`;

const PlusIcon = styled.div`
  font-size: 4rem;
  font-weight: 200;
  line-height: 1;
`;

const CreateText = styled.p`
  font-size: 1.125rem;
  font-weight: 600;
  margin-top: 0.5rem;
`;

const ModalBackdrop = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  transition: opacity 0.3s;
`;

const ModalContent = styled.div`
  background-color: ${(props) => props.theme.background};
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 400px;
  animation: slideIn 0.3s forwards;

  @keyframes slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const ModalHeader = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 1rem;
  // color: ${(props) => props.theme.textTertiary};
`;

const Input = styled.input`
  padding: 12px;
  font-size: 1rem;
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 8px;
  margin-bottom: 1rem;
  width: 100%;
`;

const ErrorText = styled.p`
  color: ${(props) => props.theme.warning};
  margin-bottom: 0.5rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;

  &.cancel {
    background-color: transparent;
    border: 1px solid ${(props) => props.theme.border};
    color: ${(props) => props.theme.text};
    &:hover {
      // background-color: ${(props) => props.theme.background};
      filter: brightness(0.95);
    }
  }

  &.create {
    background-color: ${(props) => props.theme.primary};
    color: ${(props) => props.theme.darkBlue};
    &:hover {
      filter: brightness(0.85);
    }
  }
`;

const Card = styled.div`
  margin-bottom: 10px;
`;


export default function CreateNewArchiveCard({ sessionData }) {
  const { data: session, status, update } = useSession({ data: sessionData });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { refresh } = useTemporaryRouter();
  const router = useRouter();

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Archive name cannot be empty.");
      return;
    }

    try {
      const res = await fetch("/api/archives", {
        method: "POST",
        body: JSON.stringify({ name }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        setName("");
        setError("");
        setIsModalOpen(false);
        refresh();
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create archive.");
      }
    } catch (err) {
      console.error("Failed to create archive:", err);
      setError("An unexpected error occurred.");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName("");
    setError("");
  };

  return (
    <>
      <Card>
        <CardContainer onClick={() => setIsModalOpen(true)}>
          <PlusIcon>+</PlusIcon>
          <CreateText>Create New Archive</CreateText>
        </CardContainer>
      </Card>

      {isModalOpen && (
        <ModalBackdrop onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>Create New Archive</ModalHeader>
            <Input
              type="text"
              placeholder="Enter archive name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
            />
            {error && <ErrorText>{error}</ErrorText>}
            <ButtonContainer>
              <Button className="cancel" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button className="create" onClick={handleCreate}>
                Create
              </Button>
            </ButtonContainer>
          </ModalContent>
        </ModalBackdrop>
      )}
    </>
  );
}
