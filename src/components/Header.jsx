"use client";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  width: 100vw;
  // background-image: url("images/BronzeHeaderBackground.png");
  background-color: var(--dark-blue);
  color: white;
`;

const LeftContainer = styled.div`
  display: flex;
  align-items: center;
  text-align: left;
  justify-content: space-evenly;
  max-width: 50%;
  width: auto;
  height: 100%;
  padding: 0 0 0 20px;
  background-color: inherit;
`;

const RightContainer = styled.div`
  display: flex;
  align-items: center;
  text-align: right;
  justify-content: space-evenly;
  max-width: 50%;
  width: auto;
  height: 100%;
  padding: 0 20px 0 0;
  background-color: inherit;
`;

const UserAccountIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: var(--light-white);
`;

const HeaderLogoBox = styled.div`
  display: flex;
  background-color: inherit;
  font-size: 2.5rem;
  font-weight: 700;
`;

const MenuIcon = styled.div`
  width: 20px;
  height: 16px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  cursor: pointer;
  span {
    display: block;
    width: 100%;
    height: 2px;
    background-color: var(--white);
  }
`;

const DropdownContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
`;

const DropdownMenu = styled.ul`
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  background-color: var(--white);
  border: 1px solid var(--light-gray);
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  width: auto;
  padding: 8px 0;
  list-style: none;
  z-index: 1000;
`;

const DropdownMenuItem = styled.li`
  padding: 12px 18px;
  color: var(--dark-blue);
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
  white-space: nowrap;

  &:hover {
    background-color: var(--light-gray);
    color: var(--dark-blue);
  }

  a {
    display: block;
    text-decoration: none;
    color: inherit;
  }
`;

export default function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggleDropdown = () => {
    setIsDropdownOpen((prev) => !prev);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    setIsDropdownOpen(false); // Close dropdown
    await signOut({ callbackUrl: "/login" }); // Redirect to login after logout
  };

  const handleNavigation = (path) => {
    setIsDropdownOpen(false); // Close dropdown
    router.push(path);
  };

  if (status === "loading") return null;

  return (
    <Wrapper>
      {!!session ? (
        <>
          <LeftContainer>
            <Link href={"/news"}>
              <HeaderLogoBox>News</HeaderLogoBox>
            </Link>
          </LeftContainer>
          <RightContainer>
            {/* The Logout Button is now part of the dropdown */}
            {/* <nav style={{ display: "flex", columnGap: "10px" }}>
                <Button
                    bgColor={"var(--primary-blue)"}
                    clr={"var(--light-white)"}
                    onClick={() => signOut({ callbackUrl: "/login" })}
                >
                    Log out
                </Button>
            </nav> */}

            {/* Dropdown Toggle and Menu */}
            <DropdownContainer ref={dropdownRef}>
              {" "}
              {/* Attach ref here */}
              <UserAccountIcon onClick={toggleDropdown}>
                {/* You can display initials here or use the MenuIcon */}
                {/* {userInitials} */}
                <MenuIcon>
                  {" "}
                  {/* This is your hamburger icon */}
                  <span></span>
                  <span></span>
                  <span></span>
                </MenuIcon>
              </UserAccountIcon>
              {isDropdownOpen && (
                <DropdownMenu>
                  <DropdownMenuItem onClick={handleLogout}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        columnGap: "20px",
                      }}
                    >
                      <p>News</p>
                      <Image
                        alt={"Log out image"}
                        height={22}
                        width={22}
                        src="/images/newspaper.svg"
                      />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleNavigation("/account")}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        columnGap: "20px",
                      }}
                    >
                      <p>Profile</p>
                      <Image
                        alt={"Profile image"}
                        height={22}
                        width={22}
                        src="/images/profile.svg"
                      />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleNavigation("/settings")}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        columnGap: "20px",
                      }}
                    >
                      <p>Settings</p>
                      <Image
                        alt={"Settings image"}
                        height={22}
                        width={22}
                        src="/images/gear.svg"
                      />
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                        columnGap: "20px",
                      }}
                    >
                      <p>Log out</p>
                      <Image
                        alt={"Log out image"}
                        height={22}
                        width={22}
                        src="/images/logout.svg"
                      />
                    </div>
                  </DropdownMenuItem>
                </DropdownMenu>
              )}
            </DropdownContainer>
          </RightContainer>
        </>
      ) : (
        <>
          <LeftContainer>
            <Link href={"/"}>
              <HeaderLogoBox>News</HeaderLogoBox>
            </Link>
          </LeftContainer>
          <RightContainer>
            <nav style={{ display: "flex", columnGap: "10px" }}>
              <Link href={"/login"}>
                <Button
                  bgColor={"var(--primary-blue)"}
                  clr={"var(--light-white)"}
                >
                  Log in
                </Button>
              </Link>
            </nav>
          </RightContainer>
        </>
      )}
    </Wrapper>
  );
}
