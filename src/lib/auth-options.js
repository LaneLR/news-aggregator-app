import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google"; // 1. Import Google Provider
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import initializeDbAndModels from "@/lib/db.js";

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login", // Specify your custom login page
  },

  providers: [
    // 2. Add GoogleProvider to the array
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
        // Prevent Google users from signing in with credentials
        if (!user.password) {
          throw new Error("Please sign in with Google to access your account.");
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Incorrect password");

        if (!user.emailIsVerified) {
          throw new Error("Please verify your email address to log in.");
        }

        // Return all necessary fields for the JWT
        return {
          id: user.id,
          email: user.email,
          tier: user.tier,
          pendingDeletion: user.pendingDeletion,
          emailIsVerified: user.emailIsVerified,
        };
      },
    }),
  ],

  callbacks: {
    // 3. Add the 'signIn' callback (crucial for SSO)
    async signIn({ user, account }) {
      // This callback is triggered on a successful sign-in.
      if (account.provider === "google") {
        try {
          const { email, name } = user;
          const { User } = await initializeDbAndModels();

          // Check if user already exists in your DB
          let dbUser = await User.findOne({ where: { email } });

          // If not, create a new user entry
          if (!dbUser) {
            dbUser = await User.create({
              email,
              name, // Assuming you have a name field
              password: null, // No password for SSO users
              emailIsVerified: true, // Google handles email verification
            });
          }

          // Attach your internal DB user ID to the user object
          // This ensures it gets passed to the JWT callback
          user.id = dbUser.id;
          user.tier = dbUser.tier;
          user.pendingDeletion = dbUser.pendingDeletion;
          user.emailIsVerified = dbUser.emailIsVerified;

          return true; // Allow sign-in
        } catch (error) {
          console.error("SSO SignIn Error:", error);
          return false; // Prevent sign-in on error
        }
      }
      // For credentials provider, the authorize function already handled it.
      return true;
    },

    async jwt({ token, user }) {
      // This runs after signIn. The 'user' object is available on initial login.
      if (user) {
        token.id = user.id;
        token.tier = user.tier;
        token.pendingDeletion = user.pendingDeletion;
        token.emailIsVerified = user.emailIsVerified;
      }

      // This logic for keeping the token fresh on subsequent requests is fine.
      if (token.email) {
        const { User } = await initializeDbAndModels();
        const dbUser = await User.findOne({ where: { email: token.email } });
        if (dbUser) {
          token.tier = dbUser.tier;
          token.pendingDeletion = dbUser.pendingDeletion;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Your session callback is already perfect and needs no changes.
      if (token?.id) session.user.id = token.id;
      if (token?.tier !== undefined) session.user.tier = token.tier;
      if (token?.pendingDeletion !== undefined) {
        session.user.pendingDeletion = token.pendingDeletion;
      }
      if (token?.emailIsVerified)
        session.user.emailIsVerified = token.emailIsVerified;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
