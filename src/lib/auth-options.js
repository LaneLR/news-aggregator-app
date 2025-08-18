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
    async signIn({ user, account }) {
      if (account.provider === "google") {
        try {
          const { email, name, image } = user; // Get name and image from Google user object
          const { User } = await initializeDbAndModels();
          let dbUser = await User.findOne({ where: { email } });

          if (!dbUser) {
            dbUser = await User.create({
              email,
              name, 
              image,
              password: null,
              emailIsVerified: true,
            });
          }

          // Pass all necessary data to the JWT callback
          user.id = dbUser.id;
          user.tier = dbUser.tier;
          user.name = dbUser.name;
          user.image = dbUser.image; // Pass the image along
          user.pendingDeletion = dbUser.pendingDeletion;
          user.emailIsVerified = dbUser.emailIsVerified;
          return true;
        } catch (error) {
          console.error("SSO SignIn Error:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        // This runs on initial sign-in for both providers
        token.id = user.id;
        token.tier = user.tier;
        token.name = user.name; // <-- ADDED: Save name to token
        token.picture = user.image; // <-- ADDED: Save picture to token
        token.pendingDeletion = user.pendingDeletion;
        token.emailIsVerified = user.emailIsVerified;
      }
      // This part for keeping the token fresh is fine
      return token;
    },
    async session({ session, token }) {
      if (token?.id) session.user.id = token.id;
      if (token?.tier !== undefined) session.user.tier = token.tier;
      if (token?.name) session.user.name = token.name; // <-- ADDED: Expose name to session
      if (token?.picture) session.user.image = token.picture; // <-- ADDED: Expose picture to session
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
