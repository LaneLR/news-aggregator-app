'use client'
import styles from "./AppWrapper.module.scss"

export default function AppWrapper({children}) {
  return (
    <div className={styles.wrapper}>{children}</div>
  )
}

