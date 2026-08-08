"use client";
import styles from "./NewsGridWrapper.module.scss";

const DENSITY_CLASS = {
  list: "listWrapper",
  magazine: "magazineWrapper",
};

export default function NewsGridWrapper({ children, density = "card" }) {
  const densityClass = DENSITY_CLASS[density] ? styles[DENSITY_CLASS[density]] : "";
  return <div className={`${styles.wrapper} ${densityClass}`}>{children}</div>;
}
