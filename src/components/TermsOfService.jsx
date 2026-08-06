"use client";
import styles from "./TermsOfService.module.scss";

export default function TermsOfServiceComponent({ contactEmail }) {
  return (
    <div className={styles.wrapper}>
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>What MorningFeeds is</h2>
      <p>
        MorningFeeds aggregates publicly available RSS feeds from third-party
        news publishers and displays headlines, thumbnails, and short
        descriptions with a link back to the original source. We do not host,
        rewrite, or claim ownership of the underlying articles — all
        referenced content remains the property of its respective publisher.
      </p>

      <h2>Your account</h2>
      <p>
        You&apos;re responsible for keeping your account credentials secure
        and for all activity under your account. You must provide an
        accurate email address, and you must be old enough to legally enter
        into these terms in your jurisdiction.
      </p>

      <h2>Subscriptions and billing</h2>
      <p>
        Paid subscriptions are billed in advance on a recurring basis
        (monthly or annually, depending on the plan you choose) through
        Stripe. Your subscription renews automatically until you cancel.
        You can cancel at any time from your account settings; cancellation
        takes effect at the end of your current billing period, and you
        retain access to paid features until then. Except where required by
        law, payments are non-refundable for partial billing periods.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You agree not to misuse the service — including attempting to
        access another user&apos;s account or data, scraping or reselling
        aggregated content at scale, interfering with the service&apos;s
        operation, or using the service for any unlawful purpose.
      </p>

      <h2>Third-party content and copyright</h2>
      <p>
        Article titles, images, and descriptions displayed on MorningFeeds
        are sourced from publicly available RSS feeds and are the
        intellectual property of their original publishers. If you are a
        rights holder and believe content displayed on MorningFeeds
        infringes your rights, contact us at{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a> with the
        article URL and we will review and remove it promptly if warranted.
      </p>

      <h2>Disclaimer of warranties</h2>
      <p>
        MorningFeeds is provided &quot;as is&quot; without warranties of any
        kind. We aggregate third-party content and can&apos;t guarantee its
        accuracy, availability, or timeliness. We do our best to keep the
        service reliable but don&apos;t guarantee uninterrupted access.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, MorningFeeds is not liable
        for any indirect, incidental, or consequential damages arising from
        your use of the service.
      </p>

      <h2>Termination</h2>
      <p>
        You may stop using the service and delete your account at any time
        from your account settings. We may suspend or terminate accounts
        that violate these terms.
      </p>

      <h2>Changes to these terms</h2>
      <p>
        We may update these terms from time to time. Continued use of the
        service after a change constitutes acceptance of the updated terms.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about these terms can be sent to{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </div>
  );
}
