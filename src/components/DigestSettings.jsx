"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";
import styled, { useTheme } from "styled-components";

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
`;

const Label = styled.div`
  font-weight: 600;
  color: ${(props) => props.theme.text};
`;

const SubLabel = styled.p`
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: ${(props) => props.theme.textSecondary};
`;

// A standard sliding toggle switch.
const SwitchWrapper = styled.label`
  position: relative;
  display: inline-block;
  width: 46px;
  height: 26px;
  flex-shrink: 0;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;

  &:checked + span {
    background-color: ${(props) => props.theme.primary};
  }
  &:checked + span:before {
    transform: translateX(20px);
  }
  &:disabled + span {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  inset: 0;
  background-color: ${(props) => props.theme.border};
  transition: background-color 0.2s ease;
  border-radius: 26px;

  &:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: transform 0.2s ease;
    border-radius: 50%;
  }
`;

const FrequencyToggle = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const FrequencyOption = styled.button`
  padding: 6px 14px;
  border-radius: 16px;
  border: 2px solid ${(props) => props.theme.border};
  background: ${(props) => (props.$active ? props.theme.primary : "transparent")};
  color: ${(props) => (props.$active ? props.theme.buttonText : props.theme.text)};
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export default function DigestSettings({ sessionData }) {
  const { data: session, update } = useSession({ data: sessionData });
  const [saving, setSaving] = useState(false);
  const theme = useTheme();

  const enabled = !!session?.user?.digestEnabled;
  const frequency = session?.user?.digestFrequency || "weekly";

  const savePreferences = async (fields) => {
    setSaving(true);
    try {
      const res = await fetch("/api/users/digest-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      if (!res.ok) throw new Error("Failed to update digest preferences");
      await update(fields);
    } catch (err) {
      console.error("Failed to update digest preferences:", err);
      alert("Something went wrong updating your email digest settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Wrapper>
      <Row>
        <div>
          <Label>Email Digest</Label>
          <SubLabel>
            Get trending headlines and picks based on what you&apos;ve liked
            and saved, sent to your inbox.
          </SubLabel>
        </div>
        <SwitchWrapper>
          <SwitchInput
            type="checkbox"
            checked={enabled}
            disabled={saving}
            onChange={(e) => savePreferences({ digestEnabled: e.target.checked })}
          />
          <SwitchSlider />
        </SwitchWrapper>
      </Row>

      {enabled && (
        <Row>
          <Label style={{ fontWeight: 400, color: theme.textSecondary }}>
            How often?
          </Label>
          <FrequencyToggle>
            <FrequencyOption
              type="button"
              disabled={saving}
              $active={frequency === "daily"}
              onClick={() => savePreferences({ digestFrequency: "daily" })}
            >
              Daily
            </FrequencyOption>
            <FrequencyOption
              type="button"
              disabled={saving}
              $active={frequency === "weekly"}
              onClick={() => savePreferences({ digestFrequency: "weekly" })}
            >
              Weekly
            </FrequencyOption>
          </FrequencyToggle>
        </Row>
      )}
    </Wrapper>
  );
}
