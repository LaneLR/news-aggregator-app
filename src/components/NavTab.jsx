import Link from "next/link";
import styles from "./NavTab.module.scss";

export default function NavTab({ href, children }) {
  return (
    <>
      <Link className={styles.navBarWrapper} href={`${href}`}>
        {children}
      </Link>
    </>
  );
}
