"use client";
import styles from "./Privacy.module.scss";

export default function PrivacyPageComponent({ contactEmail }) {
  return (
    <div className={styles.wrapper}>
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>What we collect</h2>
      <p>
        When you create an account, we collect the email address and
        password you provide, or — if you sign in with Google — your name,
        email address, and profile image as shared by Google. We store the
        articles you like or save, the archives you create, your
        subscription tier and billing status, and basic usage data needed to
        operate the product (such as which theme you&apos;ve selected). We
        also count clicks on article links in aggregate — this powers
        features like Trending and Most Liked and isn&apos;t used to build
        an advertising profile or shared with third parties.
      </p>

      <h2>What we don&apos;t collect</h2>
      <p>
        We never see or store your payment card details. Billing is handled
        entirely by Stripe; we only receive and store the subscription
        status, plan, and renewal date Stripe reports back to us.
      </p>

      <h2>How we use your data</h2>
      <p>
        We use your data to operate your account (authentication, saved
        articles and archives, subscription status), to send you
        transactional email (verification, password reset, billing
        receipts and subscription notices), and — only if you turn it on in
        Settings — a periodic email digest of trending and recommended
        articles. We do not sell your personal data to third parties or use
        it for third-party advertising.
      </p>

      <h2>Third-party services</h2>
      <p>
        We rely on a small number of third-party services to run the app:
        Google (sign-in), Stripe (billing), and our email provider
        (transactional email delivery). Each of these providers processes
        the minimum data needed to perform its function and is subject to
        its own privacy policy.
      </p>

      <h2>Cookies and sessions</h2>
      <p>
        We use a session cookie to keep you signed in. We don&apos;t use
        third-party advertising or tracking cookies.
      </p>

      <h2>Your rights</h2>
      <p>
        You can request deletion of your account and associated data at any
        time from your account settings. Deletion requests are processed
        automatically after a short grace period, during which you can
        cancel the request if you change your mind.
      </p>

      <h2>Contact us</h2>
      <p>
        Questions about this policy or your data can be sent to{" "}
        <a href={`mailto:${contactEmail}`}>{contactEmail}</a>.
      </p>
    </div>
  );
}
