"use client";
import Button from "./Button";
import styles from "./BannerHomePage.module.scss";

export default function Banner3({
  title,
  features,
  cost,
  children,
  promoCode,
}) {
  return (
    <>
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
        <div>{promoCode}</div>
      </div>
    </>
  );
}
