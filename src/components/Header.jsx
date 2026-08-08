"use client";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Newspaper, Bookmark, User, Crown, Settings, LogOut, Sun, Moon } from "lucide-react";
import SearchBar from "./SearchBar";
import HeaderNavBar from "./HeaderNavBar";
import HeaderSubscribeBanner from "./SubscribeHeaderBanner";
import styles from "./Header.module.scss";

// News and Archives moved to their own icon buttons in the header (next to
// the burger menu) — kept out of this dropdown so the two aren't listed
// twice.
const MENU_ITEMS = [
  { label: "Profile", path: "/account", Icon: User },
  { label: "Premium", path: "/pricing", Icon: Crown },
  { label: "Settings", path: "/settings", Icon: Settings },
];

export default function Header() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const isSubscribed = session?.user?.tier && session.user.tier !== "Free";
  const currentTheme = session?.user?.selectedTheme || "default";

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

  const handleToggleTheme = async () => {
    const nextTheme = currentTheme === "dark" ? "default" : "dark";
    try {
      await fetch("/api/users/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeName: nextTheme }),
      });
      await update({ selectedTheme: nextTheme });
    } catch (err) {
      console.error("Failed to update theme", err);
    }
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
                <div className={styles.logoTextWrapper}>
                  <div className={styles.logoText}>
                    <span>morning</span>
                    <span>feeds</span>
                  </div>
                  <span className={styles.tagline}>All the news. One place.</span>
                </div>
              </Link>
            </div>
            <div className={styles.centerContainer}>
              <SearchBar />
            </div>
            <div className={styles.rightContainer}>
              <div className={styles.iconButtonGroup}>
                <Link className={styles.iconButton} href="/news" title="News">
                  <Newspaper size={19} strokeWidth={2} />
                </Link>
                <Link className={styles.iconButton} href="/archives" title="Archives">
                  <Bookmark size={19} strokeWidth={2} />
                </Link>
                {isSubscribed && (
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={handleToggleTheme}
                    title="Toggle light/dark theme"
                  >
                    {currentTheme === "dark" ? (
                      <Sun size={19} strokeWidth={2} />
                    ) : (
                      <Moon size={19} strokeWidth={2} />
                    )}
                  </button>
                )}
                <div className={styles.dropdownContainer} ref={dropdownRef}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    onClick={toggleDropdown}
                  >
                    <Menu size={20} strokeWidth={2} />
                  </button>
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
              <div className={styles.logoTextWrapper}>
                <div className={styles.logoText}>
                  <span>morning</span>
                  <span>feeds</span>
                </div>
                <span className={styles.tagline}>All the news. One place.</span>
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
