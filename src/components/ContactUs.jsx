"use client";
import styles from "./ContactUs.module.scss";

export default function ContactUsComponent({ contactEmail }) {
  return (
    <div className={styles.wrapper}>
      <h1>Contact Us</h1>
      <p>
        Have a question, found a bug, or want to report an issue with an
        article or feed? We&apos;d love to hear from you.
      </p>
      <p>
        Reach us at{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a> and
        we&apos;ll get back to you as soon as we can.
      </p>
      <p>
        If your message is about a copyright concern regarding content
        displayed from a third-party source, please include the article URL
        and the publication you represent so we can look into it promptly.
      </p>
    </div>
  );
}
