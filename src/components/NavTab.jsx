"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./NavTab.module.scss";

export default function NavTab({ href, children, Icon }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      className={`${styles.navBarWrapper} ${isActive ? styles.active : ""}`}
      href={`${href}`}
    >
      {Icon && <Icon size={17} strokeWidth={2} />}
      {children}
    </Link>
  );
}
