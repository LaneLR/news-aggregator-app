import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import initializeDbAndModels from "@/lib/db.js"; 

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize({ email, password }) {
        const db = await initializeDbAndModels();
        const { User } = db;

        const user = await User.findOne({ where: { email } });
        if (!user) throw new Error("No user found with that email");

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) throw new Error("Incorrect password");

        if (!user.emailIsVerified) {
          throw new Error("Please verify your email address to log in.");
        }

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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = user.tier;
        token.pendingDeletion = user.pendingDeletion; 
        token.emailIsVerified = user.emailIsVerified;
      }

      if (token.email) {
        const db = await initializeDbAndModels();
        const { User } = db;
        const dbUser = await User.findOne({ where: { email: token.email } });
        if (dbUser) {
          token.tier = dbUser.tier;
          token.pendingDeletion = dbUser.pendingDeletion;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token?.id) session.user.id = token.id;
      if (token?.tier !== undefined) session.user.tier = token.tier;
      if (token?.pendingDeletion !== undefined) {
        session.user.pendingDeletion = token.pendingDeletion; 
      }
      if (token?.emailIsVerified) session.user.emailIsVerified = token.emailIsVerified;
      return session;
    },
  },
};
