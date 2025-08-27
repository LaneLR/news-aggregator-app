import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import initializeDbAndModels from "@/lib/db.js";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
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
        if (!user.password) {
          throw new Error("Please sign in with Google to access your account.");
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Incorrect password");

        if (!user.emailIsVerified) {
          throw new Error("Please verify your email address to log in.");
        }

        // This data gets passed to the 'user' object in the jwt callback on sign-in
        return {
          id: user.id,
          email: user.email,
          tier: user.tier,
          isPendingDeletion: user.isPendingDeletion,
          emailIsVerified: user.emailIsVerified,
          stripeSubscriptionStatus: user.stripeSubscriptionStatus,
          stripeSubscriptionEndsAt: user.stripeSubscriptionEndsAt,
        };
      },
    }),
  ],

  callbacks: {
    // CORRECTED: Restored original logic for Google sign-in
    async signIn({ user, account }) {
      if (account.provider === "google") {
        try {
          const { email, name, image } = user;
          const { User } = await initializeDbAndModels();
          let dbUser = await User.findOne({ where: { email } });

          // Create user if they don't exist
          if (!dbUser) {
            dbUser = await User.create({
              email,
              name,
              image,
              password: null, // No password for OAuth users
              emailIsVerified: true,
            });
          }

          // Populate the NextAuth user object with your database user's ID and other fields
          user.id = dbUser.id;
          user.tier = dbUser.tier;
          user.stripeSubscriptionStatus = dbUser.stripeSubscriptionStatus;
          // ... etc.

          return true;
        } catch (error) {
          console.error("SSO SignIn Error:", error);
          return false;
        }
      }
      return true; // Allow sign-in for other providers
    },

    // CORRECTED: Added the logic to refresh the token with fresh DB data
    async jwt({ token, user }) {
      // The 'user' object is only available on initial sign-in.
      if (user) {
        token.id = user.id;
        token.tier = user.tier;
        token.stripeSubscriptionStatus = user.stripeSubscriptionStatus;
        token.stripeSubscriptionEndsAt = user.stripeSubscriptionEndsAt;
        // Add any other user properties you want in the token
        return token;
      }

      // On subsequent requests, 'user' is undefined.
      // We must re-fetch data from the DB to keep the session fresh.
      const { User } = await initializeDbAndModels();
      const dbUser = await User.findByPk(token.id);

      if (!dbUser) {
        // If the user was deleted, invalidate the token
        return null;
      }

      // Update the token with the latest user data
      return {
        ...token, // Preserve existing token data (like name, email, etc.)
        tier: dbUser.tier,
        stripeSubscriptionStatus: dbUser.stripeSubscriptionStatus,
        stripeSubscriptionEndsAt: dbUser.stripeSubscriptionEndsAt,
      };
    },

    // This callback is now correct because the `token` it receives is always up-to-date
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.tier = token.tier;
        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.isPendingDeletion = token.isPendingDeletion;
        session.user.emailIsVerified = token.emailIsVerified;
        session.user.stripeSubscriptionStatus = token.stripeSubscriptionStatus;
        session.user.stripeSubscriptionEndsAt = token.stripeSubscriptionEndsAt;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };