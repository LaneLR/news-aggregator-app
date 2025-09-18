"use client";
import styled from "styled-components";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SearchBar from "./SearchBar";
import HeaderNavBar from "./HeaderNavBar";
import HeaderSubscribeBanner from "./SubscribeHeaderBanner";

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 80px;
  width: 100%;
  background-color: ${(props) => props.theme.primary};
  color: ${(props) => props.theme.primaryContrast};
`;

const LeftContainer = styled.div`
  display: flex;
  align-items: center;
  text-align: left;
  justify-content: left;
  width: 33%;
  // width: 327px;
  height: 100%;
  padding: 0 0 0 20px;
  background-color: transparent;

  @media (max-width: 1000px) {
    width: auto;
    padding: 0 0 0 20px;
  }
`;

const CenterContainer = styled.div`
  display: flex;
  align-items: center;
  text-align: right;
  justify-content: space-evenly;
  // max-width: 33%;
  width: 50%;
  height: 100%;
  padding: 0 50px;
  background-color: inherit;

  @media (max-width: 860px) {
    justify-content: center;
    width: 100%;
    padding: 0 10px;
  }

  @media (max-width: 440px) {
    justify-content: center;
    width: 65%;
    padding: 0 10px;
  }
`;

const RightContainer = styled.div`
  display: flex;
  align-items: center;
  text-align: right;
  justify-content: right;
  width: 33%;
  // width: 327px;
  height: 100%;
  padding: 0 20px 0 0;
  background-color: inherit;
  user-select: none;

  @media (max-width: 1000px) {
    width: auto;
    padding: 0 20px 0 0;
  }
`;

const UserAccountIcon = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  color: ${(props) => props.theme.primaryContrast};
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
    background-color: ${(props) => props.theme.primaryContrast};
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
  background-color: ${(props) => props.theme.cardBackground};
  border: 1px solid ${(props) => props.theme.border};
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  width: auto;
  padding: 8px 0;
  list-style: none;
  z-index: 1000;

  @media (max-width: 430px) {
    right: calc(-20%);
  }
`;

const DropdownMenuItem = styled.li`
  padding: 12px 18px;
  color: ${(props) => props.theme.text};
  font-size: 0.95rem;
  cursor: pointer;
  transition: background-color 0.15s ease-in-out;
  white-space: nowrap;

  &:hover {
    background-color: ${(props) => props.theme.border};
    color: ${(props) => props.theme.text};
  }

  a {
    display: block;
    text-decoration: none;
    color: inherit;
  }
`;

const LogoContainer = styled.div`
  display: "flex";
  alignitems: "center";
  columngap: "10px";
  background-color: transparent;
  width: 100%;
`;

const LogoText = styled.p`
  font-size: 2.1rem;
  padding: 0 0 0 10px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: transparent;

  span:first-child {
    color: #eba613ff;
    font-weight: 700;
    background-color: transparent;
  }

  span:last-child {
    color: ${(props) => props.theme.primaryContrast};
    font-weight: 400;
    background-color: transparent;
  }

  @media (max-width: 860px) {
    width: auto;
    background-color: transparent;

    span {
      display: none;
    }
  }
`;

export default function Header({ priceId, sessionData, }) {
  const { data: session, status, update } = useSession({ data: sessionData });
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
    setIsDropdownOpen(false);
    await signOut({ callbackUrl: "/login" });
  };

  const handleNavigation = (path) => {
    setIsDropdownOpen(false);
    router.push(path);
  };

  if (status === "loading") return null;

  return (
    <>
      {!!session ? (
        <div style={{ width: "100%" }}>
          <Wrapper>
            <LeftContainer>
              <Link style={{ display: "inherit" }} href={"/news"}>
                <LogoContainer>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "transparent",
                      padding: "2px",
                      borderRadius: "8px",
                    }}
                  >
                    <Image
                      priority
                      src={"/images/morningfeeds-logo1.png"}
                      alt={"MorningFeeds logo"}
                      width={65}
                      height={60}
                    />
                  </div>
                </LogoContainer>
                <LogoText>
                  <span>morning</span>
                  <span>feeds</span>
                </LogoText>
              </Link>
            </LeftContainer>
            <CenterContainer>
              <SearchBar />
            </CenterContainer>
            <RightContainer>
              <DropdownContainer ref={dropdownRef}>
                <UserAccountIcon onClick={toggleDropdown}>
                  <MenuIcon>
                    <span></span>
                    <span></span>
                    <span></span>
                  </MenuIcon>
                </UserAccountIcon>
                {isDropdownOpen && (
                  <DropdownMenu>
                    <DropdownMenuItem onClick={() => handleNavigation("/news")}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          width: "100%",
                          columnGap: "20px",
                        }}
                      >
                        <p style={{ fontWeight: "600" }}>News</p>
                        <Image
                          priority
                          alt={"Log out image"}
                          height={22}
                          width={22}
                          src="/images/newspaper.svg"
                        />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleNavigation("/archives")}
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
                        <p style={{ fontWeight: "600" }}>Archives</p>
                        <Image
                          priority
                          alt={"Log out image"}
                          height={22}
                          width={22}
                          src="/images/list-heart.svg"
                          style={{ filter: "grayscale(100%)" }}
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
                        <p style={{ fontWeight: "600" }}>Profile</p>
                        <Image
                          priority
                          alt={"Profile image"}
                          height={22}
                          width={22}
                          src="/images/profile.svg"
                        />
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleNavigation("/pricing")}
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
                        <p style={{ fontWeight: "600" }}>Premium</p>
                        <Image
                          priority
                          alt={"Subscribe image"}
                          height={22}
                          width={22}
                          src="/images/subscribe.svg"
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
                        <p style={{ fontWeight: "600" }}>Settings</p>
                        <Image
                          priority
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
                        <p style={{ fontWeight: "600" }}>Log out</p>
                        <Image
                          priority
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
          </Wrapper>
          <HeaderSubscribeBanner />
          <HeaderNavBar />
        </div>
      ) : (
        <>
          <Wrapper>
            <LeftContainer>
              <Link
                style={{ display: "inherit", backgroundColor: "transparent" }}
                href={"/"}
              >
                <LogoContainer
                  style={{
                    display: "flex",
                    alignItems: "center",
                    columnGap: "10px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: "transparent",
                      padding: "2px",
                      borderRadius: "8px",
                    }}
                  >
                    <Image
                      priority
                      src={"/images/morningfeeds-logo1.png"}
                      alt={"MorningFeeds logo"}
                      width={65}
                      height={60}
                    />
                  </div>
                </LogoContainer>
                <LogoText>
                  <span>morning</span>
                  <span>feeds</span>
                </LogoText>
              </Link>
            </LeftContainer>
            <RightContainer>
              <nav style={{ display: "flex", columnGap: "10px" }}>
                <Link style={{ display: "flex" }} href={"/login"}>
                  <Button bgColor={"var(--orange)"} clr={"var(--white)"}>
                    Log in
                  </Button>
                </Link>
              </nav>
            </RightContainer>
          </Wrapper>
        </>
      )}
    </>
  );
}
