import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import initializeDbAndModels from "@/lib/db.js";

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  // v5 checks the incoming request's Host header against a trusted-host
  // allowlist before proceeding (a hardening change from v4). Vercel infers
  // this on its own, but setting it explicitly costs nothing and avoids an
  // opaque UntrustedHost error on sign-in if a custom domain, preview URL,
  // or future host change ever falls outside Vercel's own auto-detection.
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize({ email, password }) {
        const { User } = await initializeDbAndModels();
        const user = await User.findOne({ where: { email } });

        if (!user) throw new Error("No user found with that email");

        if (user.status === "inactive") {
          throw new Error("This account is inactive or deleted.");
        }

        if (!user.password) {
          throw new Error("Please sign in with Google to access your account.");
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Incorrect password");

        if (!user.emailIsVerified) {
          throw new Error("Please verify your email address to log in.");
        }

        return {
          id: user.id,
          email: user.email,
          tier: user.tier,
          isPendingDeletion: user.isPendingDeletion,
          emailIsVerified: user.emailIsVerified,
          stripeSubscriptionStatus: user.stripeSubscriptionStatus,
          stripeSubscriptionEndsAt: user.stripeSubscriptionEndsAt,
          referralCode: user.referralCode,
          referralCount: user.referralCount,
          usedReferralCode: user.usedReferralCode,
          status: user.status,
          subscriptionWillCancel: user.subscriptionWillCancel,
          selectedTheme: user.selectedTheme,
          digestEnabled: user.digestEnabled,
          digestFrequency: user.digestFrequency,
          onboardingCompleted: user.onboardingCompleted,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        const { User } = await initializeDbAndModels();
        let dbUser = await User.findOne({ where: { email: user.email } });

        if (!dbUser && account.provider === "google") {
          const { email, name, image } = user;
          dbUser = await User.create({
            email,
            name,
            image,
            password: null,
            emailIsVerified: true,
          });
        }

        if (!dbUser) {
          return false;
        }

        if (dbUser.status === "inactive") {
          return "/login?error=AccountInactive";
        }

        user.id = dbUser.id;
        user.name = dbUser.name;
        user.image = dbUser.image;
        user.tier = dbUser.tier;
        user.isPendingDeletion = dbUser.isPendingDeletion;
        user.stripeSubscriptionStatus = dbUser.stripeSubscriptionStatus;
        user.stripeSubscriptionEndsAt = dbUser.stripeSubscriptionEndsAt;
        user.referralCode = dbUser.referralCode;
        user.referralCount = dbUser.referralCount;
        user.usedReferralCode = dbUser.usedReferralCode;
        user.status = dbUser.status;
        user.subscriptionWillCancel = dbUser.subscriptionWillCancel;
        user.selectedTheme = dbUser.selectedTheme;
        user.digestEnabled = dbUser.digestEnabled;
        user.digestFrequency = dbUser.digestFrequency;
        user.onboardingCompleted = dbUser.onboardingCompleted;

        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.image = user.image;
        token.tier = user.tier;
        token.isPendingDeletion = user.isPendingDeletion;
        token.stripeSubscriptionStatus = user.stripeSubscriptionStatus;
        token.stripeSubscriptionEndsAt = user.stripeSubscriptionEndsAt;
        token.referralCode = user.referralCode;
        token.referralCount = user.referralCount;
        token.usedReferralCode = user.usedReferralCode;
        token.status = user.status;
        token.subscriptionWillCancel = user.subscriptionWillCancel;
        token.selectedTheme = user.selectedTheme;
        token.digestEnabled = user.digestEnabled;
        token.digestFrequency = user.digestFrequency;
        token.onboardingCompleted = user.onboardingCompleted;
        return token;
      }

      const { User } = await initializeDbAndModels();
      const dbUser = await User.findByPk(token.id);

      if (!dbUser || dbUser.status === "inactive") {
        return null;
      }

      return {
        ...token,
        tier: dbUser.tier,
        name: dbUser.name,
        image: dbUser.image,
        isPendingDeletion: dbUser.isPendingDeletion,
        stripeSubscriptionStatus: dbUser.stripeSubscriptionStatus,
        stripeSubscriptionEndsAt: dbUser.stripeSubscriptionEndsAt,
        referralCode: dbUser.referralCode,
        referralCount: dbUser.referralCount,
        usedReferralCode: dbUser.usedReferralCode,
        status: dbUser.status,
        subscriptionWillCancel: dbUser.subscriptionWillCancel,
        selectedTheme: dbUser.selectedTheme,
        digestEnabled: dbUser.digestEnabled,
        digestFrequency: dbUser.digestFrequency,
        onboardingCompleted: dbUser.onboardingCompleted,
      };
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name;
        session.user.image = token.image;
        session.user.tier = token.tier;
        session.user.isPendingDeletion = token.isPendingDeletion;
        session.user.emailIsVerified = token.emailIsVerified;
        session.user.stripeSubscriptionStatus = token.stripeSubscriptionStatus;
        session.user.stripeSubscriptionEndsAt = token.stripeSubscriptionEndsAt;
        session.user.referralCode = token.referralCode;
        session.user.referralCount = token.referralCount;
        session.user.usedReferralCode = token.usedReferralCode;
        session.user.status = token.status;
        session.user.subscriptionWillCancel = token.subscriptionWillCancel;
        session.user.selectedTheme = token.selectedTheme;
        session.user.digestEnabled = token.digestEnabled;
        session.user.digestFrequency = token.digestFrequency;
        session.user.onboardingCompleted = token.onboardingCompleted;
      }
      return session;
    },
  },
});
