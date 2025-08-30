"use client";
import { useState, useEffect } from "react";
import styled from "styled-components";
import Button from "./Button";

const ModalBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  color: var(--deep-blue);
`;
const ModalContent = styled.div`
  background: white;
  padding: 24px 40px;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
`;
const FilterList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
`;
const FilterCheckbox = styled.label`
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 16px;
  border: 1px solid #ccc;
  background: ${(props) => (props.checked ? "var(--primary-blue)" : "white")};
  color: ${(props) => (props.checked ? "white" : "black")};
  transition: all 0.2s ease-in-out;
  &:hover {
    background: #f0f0f0;
  }
`;
const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
`;

const FormTitle = styled.h2`
  padding: 0 0 3px 0;
`;

const CategoryNames = styled.h4`
  padding: 0 0 6px 0;
`;

export default function CreateFeedModal({
  isOpen,
  onClose,
  onSuccess,
  feedToEdit,
}) {
  const [title, setTitle] = useState("");
  const [availableSources, setAvailableSources] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedSources, setSelectedSources] = useState(new Set());
  const [selectedCategories, setSelectedCategories] = useState(new Set());

  const isEditMode = !!feedToEdit;

  const resetForm = () => {
    setTitle("");
    setSelectedSources(new Set());
    setSelectedCategories(new Set());
  };

  useEffect(() => {
    if (isEditMode) {
      setTitle(feedToEdit.title);
      setSelectedSources(new Set(feedToEdit.sourceNames));
      setSelectedCategories(new Set(feedToEdit.categories));
    } else {
      setTitle("");
      setSelectedSources(new Set());
      setSelectedCategories(new Set());
    }

    if (isOpen) {
      const fetchFilters = async () => {
        const res = await fetch("/api/filters");
        const data = await res.json();
        setAvailableSources(data.sources || []);
        setAvailableCategories(data.categories || []);
      };
      fetchFilters();
    }
  }, [isOpen, feedToEdit, isEditMode]);

  const handleToggle = (item, set, currentSet) => {
    const newSet = new Set(currentSet);
    if (newSet.has(item)) newSet.delete(item);
    else newSet.add(item);
    set(newSet);
  };

  const handleSave = async () => {
    const feedData = {
      title,
      sourceNames: Array.from(selectedSources),
      categories: Array.from(selectedCategories),
    };

    const url = isEditMode ? `/api/feeds/${feedToEdit.id}` : "/api/feeds";
    const method = isEditMode ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(feedData),
    });

    if (res.ok) {
      onSuccess();
      resetForm();
      onClose();
    } else {
      alert(`Failed to ${isEditMode ? "update" : "create"} feed.`);
    }
  };

  const handleDelete = async () => {
    if (!isEditMode) return;

    if (
      window.confirm(
        "Are you sure you want to delete this feed? This action cannot be undone."
      )
    ) {
      const res = await fetch(`/api/feeds/${feedToEdit.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        alert("Failed to delete feed.");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <FormTitle>{isEditMode ? "Edit Feed" : "Create a New Feed"}</FormTitle>
        <input
          type="text"
          placeholder="Feed Name (e.g., 'Tech News')"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ width: "100%", padding: "10px", marginBottom: "1rem" }}
        />

        <CategoryNames>Select Sources</CategoryNames>
        <FilterList>
          {availableSources.map((source) => (
            <FilterCheckbox key={source} checked={selectedSources.has(source)}>
              <input
                type="checkbox"
                hidden
                onChange={() =>
                  handleToggle(source, setSelectedSources, selectedSources)
                }
              />
              {source}
            </FilterCheckbox>
          ))}
        </FilterList>

        <CategoryNames>Select Categories</CategoryNames>
        <FilterList>
          {availableCategories.map((cat) => (
            <FilterCheckbox key={cat} checked={selectedCategories.has(cat)}>
              <input
                type="checkbox"
                hidden
                onChange={() =>
                  handleToggle(cat, setSelectedCategories, selectedCategories)
                }
              />
              {cat}
            </FilterCheckbox>
          ))}
        </FilterList>
        <ButtonWrapper>
          {isEditMode && (
            <Button
              onClick={handleSave}
              bgColor="var(--primary-blue)"
              clr="white"
              style={{ marginLeft: "auto" }}
            >
              Save Feed
            </Button>
          )}

          <Button
            onClick={handleDelete}
            bgColor="var(--primary-blue)"
            clr="var(--white)"
          >
            Delete Feed
          </Button>
        </ButtonWrapper>
      </ModalContent>
    </ModalBackdrop>
  );
}
