"use client";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Newspaper, Bookmark, User, Crown, Settings, LogOut } from "lucide-react";
import SearchBar from "./SearchBar";
import HeaderNavBar from "./HeaderNavBar";
import HeaderSubscribeBanner from "./SubscribeHeaderBanner";
import styles from "./Header.module.scss";

const MENU_ITEMS = [
  { label: "News", path: "/news", Icon: Newspaper },
  { label: "Archives", path: "/archives", Icon: Bookmark },
  { label: "Profile", path: "/account", Icon: User },
  { label: "Premium", path: "/pricing", Icon: Crown },
  { label: "Settings", path: "/settings", Icon: Settings },
];

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
              <Link className={styles.logoLink} href={"/news"}>
                <div className={styles.logoContainer}>
                  <Image
                    priority
                    src={"/images/morningfeeds-logo1.png"}
                    alt={"MorningFeeds logo"}
                    width={52}
                    height={48}
                  />
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
                <div className={styles.menuTrigger} onClick={toggleDropdown}>
                  <Menu size={20} strokeWidth={2} />
                </div>
                {isDropdownOpen && (
                  <ul className={styles.dropdownMenu}>
                    {MENU_ITEMS.map(({ label, path, Icon }) => (
                      <li
                        key={path}
                        className={styles.dropdownMenuItem}
                        onClick={() => handleNavigation(path)}
                      >
                        <div className={styles.dropdownItemRow}>
                          <Icon size={18} strokeWidth={2} />
                          <span>{label}</span>
                        </div>
                      </li>
                    ))}
                    <li className={styles.dropdownDivider} />
                    <li className={styles.dropdownMenuItem} onClick={handleLogout}>
                      <div className={styles.dropdownItemRow}>
                        <LogOut size={18} strokeWidth={2} />
                        <span>Log out</span>
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
        <div className={styles.wrapper}>
          <div className={styles.leftContainer}>
            <Link className={styles.logoLink} href={"/"}>
              <div className={styles.logoContainer}>
                <Image
                  priority
                  src={"/images/morningfeeds-logo1.png"}
                  alt={"MorningFeeds logo"}
                  width={52}
                  height={48}
                />
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
      )}
    </>
  );
}
