"use client";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import SearchBar from "./SearchBar";
import HeaderNavBar from "./HeaderNavBar";
import HeaderSubscribeBanner from "./SubscribeHeaderBanner";
import styles from "./Header.module.scss";

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
          <div className={styles.wrapper}>
            <div className={styles.leftContainer}>
              <Link style={{ display: "inherit" }} href={"/news"}>
                <div className={styles.logoContainer}>
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
                </div>
                <div className={styles.logoText}>
                  <span>morning</span>
                  <span>feeds</span>
                </div>
              </Link>
            </div>
            <div className={styles.centerContainer}>
              <SearchBar />
            </div>
            <div className={styles.rightContainer}>
              <div className={styles.dropdownContainer} ref={dropdownRef}>
                <div className={styles.userAccountIcon} onClick={toggleDropdown}>
                  <div className={styles.menuIcon}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
                {isDropdownOpen && (
                  <ul className={styles.dropdownMenu}>
                    <li
                      className={styles.dropdownMenuItem}
                      onClick={() => handleNavigation("/news")}
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
                        <p style={{ fontWeight: "600" }}>News</p>
                        <Image
                          priority
                          alt={"Log out image"}
                          height={22}
                          width={22}
                          src="/images/newspaper.svg"
                        />
                      </div>
                    </li>
                    <li
                      className={styles.dropdownMenuItem}
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
                    </li>
                    <li
                      className={styles.dropdownMenuItem}
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
                    </li>
                    <li
                      className={styles.dropdownMenuItem}
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
                    </li>
                    <li
                      className={styles.dropdownMenuItem}
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
                    </li>
                    <li className={styles.dropdownMenuItem} onClick={handleLogout}>
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
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
          <HeaderSubscribeBanner />
          <HeaderNavBar />
        </div>
      ) : (
        <>
          <div className={styles.wrapper}>
            <div className={styles.leftContainer}>
              <Link
                style={{ display: "inherit", backgroundColor: "transparent" }}
                href={"/"}
              >
                <div
                  className={styles.logoContainer}
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
                </div>
                <div className={styles.logoText}>
                  <span>morning</span>
                  <span>feeds</span>
                </div>
              </Link>
            </div>
            <div className={styles.rightContainer}>
              <nav style={{ display: "flex", columnGap: "10px" }}>
                <Link style={{ display: "flex" }} href={"/login"}>
                  <Button bgColor={"var(--theme-title-contrast)"} clr={"var(--theme-button-text)"}>
                    Log in
                  </Button>
                </Link>
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}
