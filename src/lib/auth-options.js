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
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      try {
        const { User } = await initializeDbAndModels();
        const dbUser = await User.findOne({ where: { email: user.email } });

        if (dbUser) {
          if (dbUser.status === "inactive") {
            return "/login?error=AccountInactive";
          }
          user.id = dbUser.id;
        } else if (account.provider === "google") {
          const { email, name, image } = user;
          const newDbUser = await User.create({
            email,
            name,
            image,
            password: null,
            emailIsVerified: true,
          });
          user.id = newDbUser.id;
        }

        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        return false;
      }
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = user.tier;
        token.isPendingDeletion = user.isPendingDeletion;
        token.stripeSubscriptionStatus = user.stripeSubscriptionStatus;
        token.stripeSubscriptionEndsAt = user.stripeSubscriptionEndsAt;
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
        isPendingDeletion: dbUser.isPendingDeletion,
        stripeSubscriptionStatus: dbUser.stripeSubscriptionStatus,
        stripeSubscriptionEndsAt: dbUser.stripeSubscriptionEndsAt,
      };
    },

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
