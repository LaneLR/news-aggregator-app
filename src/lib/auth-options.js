import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import getSequelizeInstance from "@/lib/sequelize.js";
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

        // Check if the user is verified
        if (!user.isVerified) {
          throw new Error("Please verify your email address to log in.");
        }

        return { id: user.id, email: user.email, tier: user.tier };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.tier = user.tier;
        return token;
      }

      if (token.email) {
        const db = await initializeDbAndModels();
        const { User } = db;
        const dbUser = await User.findOne({ where: { email: token.email } });
        if (dbUser) {
          token.tier = dbUser.tier;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token?.id) session.user.id = token.id;
      if (token?.tier !== undefined) session.user.tier = token.tier;
      return session;
    },
  },
};

// import NextAuth from "next-auth";
// import CredentialsProvider from "next-auth/providers/credentials";
// import bcrypt from "bcryptjs";
// import getSequelizeInstance from "@/lib/sequelize.mjs";
// import initializeDbAndModels from "@/lib/db.mjs";

// export const authOptions = {
//   secret: process.env.NEXTAUTH_SECRET,
//   session: {
//     strategy: "jwt",
//   },
//   providers: [
//     CredentialsProvider({
//       name: "Credentials",
//       credentials: {
//         email: { label: "Email", type: "email" },
//         password: { label: "Password", type: "password" },
//       },
//       async authorize(credentials) {
//         const sequelize = await getSequelizeInstance();
//         const db = await initializeDbAndModels();
//         const User = db.User;

//         const user = await User.findOne({ where: { email: credentials.email } });
//         if (!user) throw new Error("No user found");

//         const isValid = await bcrypt.compare(credentials.password, user.password);
//         if (!isValid) throw new Error("Invalid password");

//         return {
//           id: user.id,
//           email: user.email,
//           tier: user.tier,
//         };
//       },
//     }),
//   ],
//   callbacks: {
//     async jwt({ token, user }) {
//       if (user) {
//         token.id = user.id;
//         token.tier = user.tier;
//       }
//       return token;
//     },
//     async session({ session, token }) {
//       if (session.user) {
//         session.user.id = token.id;
//         session.user.tier = token.tier;
//       }
//       return session;
//     },
//   },
// };

// const handler = NextAuth(authOptions);

// export { handler as GET, handler as POST };
