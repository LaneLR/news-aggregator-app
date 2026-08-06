"use client";
import styles from "./BannerSubscribe.module.scss";

export default function BannerSubscribe({ title, features, cost, children }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.planTitle}>{title}</div>
      <div className={styles.planSubTitle}>You&apos;ll get</div>
      <div className={styles.planBody}>
        {features.map((feature, index) => (
          <p className={styles.planChecklist} key={index}>{feature}</p>
        ))}
      </div>
      <div className={styles.cost}>{cost}</div>
      <div className={styles.buttonContainer}>{children}</div>
    </div>
  );
}
