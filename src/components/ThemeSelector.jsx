"use client";
import { useSession } from "next-auth/react";
import styled, { useTheme } from "styled-components";
import { themes } from "@/styles/themes";

const SwatchGrid = styled.div`
  display: flex;
  gap: 1rem;
`;

const Swatch = styled.button`
  width: 100px;
  height: 60px;
  border-radius: 8px;
  border: 3px solid
    ${(props) => (props.$isActive ? props.theme.primary : "transparent")};
  cursor: pointer;
  background-color: ${(props) => props.$bgColor};
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => props.$textColor};
  font-weight: bold;
`;

const SelectThemeText = styled.p`
  margin-bottom: 14px;
  color: ${(props) => props.theme.text};
`

export default function ThemeSelector({ sessionData}) {
  const { data: session, update } = useSession({ data: sessionData });
  const currentTheme = session?.user?.selectedTheme || "default";
  const theme = useTheme();

  const handleThemeChange = async (themeName) => {
    try {
      await fetch("/api/users/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeName }),
      });
      await update({ selectedTheme: themeName });
    } catch (err) {
      console.error("Failed to update theme", err);
    }
  };

  return (
    <div>
      <SelectThemeText>Select your preferred theme:</SelectThemeText>
      <SwatchGrid>
        <Swatch
          $bgColor={themes.default.background}
          $textColor={themes.default.textTertiary}
          $isActive={currentTheme === "default"}
          onClick={() => handleThemeChange("default")}
        >
          Light
        </Swatch>
        <Swatch
          $bgColor={themes.dark.background}
          $textColor={themes.dark.text}
          $isActive={currentTheme === "dark"}
          onClick={() => handleThemeChange("dark")}
        >
          Dark
        </Swatch>
        {/* <Swatch
          $bgColor={themes.forest.background}
          $textColor={themes.forest.text}
          $isActive={currentTheme === "forest"}
          onClick={() => handleThemeChange("forest")}
        >
          Forest
        </Swatch> */}
      </SwatchGrid>
    </div>
  );
}
