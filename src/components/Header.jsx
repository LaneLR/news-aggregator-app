"use client";
import Image from "next/image";
import Link from "next/link";
import Button from "./Button";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sun, Moon, Menu, X } from "lucide-react";
import SearchBar from "./SearchBar";
import WeatherWidget from "./WeatherWidget";
import HeaderSubscribeBanner from "./SubscribeHeaderBanner";
import { useMobileNav } from "./MobileNavProvider";
import { shouldShowSidebar } from "@/lib/navLinks";
import styles from "./Header.module.scss";

export default function Header({ hideLogo = false }) {
  const { data: session, status, update } = useSession();
  const pathname = usePathname();
  const { isOpen: isNavOpen, toggle: toggleNav } = useMobileNav();
  // Only worth opening on pages that actually render the sidebar this
  // drawer contains (see MainContentWrapper) — showing a hamburger that
  // opens nothing on marketing/auth pages would be a dead-end control.
  const showMenuButton = shouldShowSidebar(pathname);

  const menuButton = showMenuButton && (
    <button
      type="button"
      className={`${styles.iconButton} ${styles.menuButton}`}
      onClick={toggleNav}
      aria-label={isNavOpen ? "Close menu" : "Open menu"}
      aria-expanded={isNavOpen}
    >
      {isNavOpen ? <X size={20} strokeWidth={2} /> : <Menu size={20} strokeWidth={2} />}
    </button>
  );

  // When selectedTheme is null (no explicit choice — see themes.scss), the
  // page is actually following the OS's prefers-color-scheme. Reading that
  // here too, not just falling back to "default", is what makes the quick
  // toggle's icon and direction match what the user is actually looking at.
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    setSystemPrefersDark(mql.matches);
    const handleChange = (e) => setSystemPrefersDark(e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
  }, []);

  const explicitTheme = session?.user?.selectedTheme || null;
  const currentTheme = explicitTheme || (systemPrefersDark ? "dark" : "default");

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

  // Neither the logged-in header (search bar + icon group) nor the
  // logged-out one ("Log in" button) is correct yet while the session is
  // still resolving — committing to either one risks a visible flash to the
  // wrong state a moment later. This renders a state-neutral shell instead.
  if (status === "loading") {
    return (
      <div className={styles.wrapper}>
        <div className={styles.leftContainer}>
          {menuButton}
          {!hideLogo && (
            <div className={styles.logoLink}>
              <div className={styles.logoContainer}>
                <Image
                  preload
                  src={"/images/MochaReads-M.png"}
                  alt={"MochaReads logo"}
                  width={52}
                  height={48}
                />
              </div>
              <div className={styles.logoTextWrapper}>
                <div className={`${styles.logoText}`}>
                  <span>Mocha</span>
                  <span>Reads</span>
                </div>
                <span className={styles.tagline}>All the news. One place.</span>
              </div>
            </div>
          )}
        </div>
        <div className={styles.centerContainer}>
          <div className={styles.headerShimmer} style={{ width: "min(520px, 100%)", height: 38 }} />
        </div>
        <div className={styles.rightContainer}>
          <div className={styles.iconButtonGroup}>
            <div className={styles.headerShimmer} style={{ width: 40, height: 40, borderRadius: 999 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!!session ? (
        <div style={{ width: "100%" }}>
          <div className={styles.wrapper}>
            <div className={styles.leftContainer}>
              {menuButton}
              {!hideLogo && (
                <Link className={styles.logoLink} href={"/news"}>
                  <div className={styles.logoContainer}>
                    <Image
                      preload
                      src={"/images/MochaReads-M.png"}
                      alt={"MochaReads logo"}
                      width={52}
                      height={48}
                    />
                  </div>
                  <div className={styles.logoTextWrapper}>
                    <div className={`${styles.logoText} headline`}>
                      <span>Mocha</span>
                      <span>Reads</span>
                    </div>
                    <span className={styles.tagline}>All the news. One place.</span>
                  </div>
                </Link>
              )}
            </div>
            <div className={styles.centerContainer}>
              <SearchBar />
            </div>
            <div className={styles.rightContainer}>
              <WeatherWidget />
              <div className={styles.iconButtonGroup}>
                <button
                  type="button"
                  className={styles.iconButton}
                  onClick={handleToggleTheme}
                  title="Toggle light/dark theme"
                  aria-label="Toggle light/dark theme"
                >
                  {currentTheme === "dark" ? (
                    <Sun size={19} strokeWidth={2} />
                  ) : (
                    <Moon size={19} strokeWidth={2} />
                  )}
                </button>
              </div>
            </div>
          </div>
          <HeaderSubscribeBanner />
        </div>
      ) : (
        <div className={styles.wrapper}>
          <div className={styles.leftContainer}>
            {menuButton}
            {!hideLogo && (
              <Link className={styles.logoLink} href={"/"}>
                <div className={styles.logoContainer}>
                  <Image
                    preload
                    src={"/images/MochaReads-M.png"}
                    alt={"MochaReads logo"}
                    width={52}
                    height={48}
                  />
                </div>
                <div className={styles.logoTextWrapper}>
                  <div className={`${styles.logoText} headline`}>
                    <span>Mocha</span>
                    <span>Reads</span>
                  </div>
                  <span className={styles.tagline}>All the news. One place.</span>
                </div>
              </Link>
            )}
          </div>
          <div className={styles.rightContainer}>
            <nav style={{ display: "flex", columnGap: "10px" }}>
              <Link style={{ display: "flex" }} href={"/login"}>
                <Button
                  bgColor={"var(--theme-title-contrast)"}
                  clr={"var(--theme-primary-contrast)"}
                  className={styles.logInButton}
                >
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
