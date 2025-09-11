import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db.js";
import { authRateLimitMiddleware } from "@/lib/rate-limiter";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail } from "@/utils/emailer";
import { nanoid } from "nanoid";

export const dynamic = "force-dynamic";

export async function POST(req) {
  try {
    await authRateLimitMiddleware(req, NextResponse);

    const { email, password } = await req.json();

    // Basic manual validation (kept as-is)
    if (!email || !password)
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return NextResponse.json(
        { error: "Must be a valid email." },
        { status: 400 }
      );
    if (password.length < 6)
      return NextResponse.json(
        { error: "Password must be at least 6 characters." },
        { status: 400 }
      );

    const db = await initializeDbAndModels();
    const { User, Archive } = db;

    // Check for existing user before creating a new one to provide a clearer error message
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists." },
        { status: 409 }
      );
    }

    const newUser = await User.create({
      email,
      password: password,
      emailIsVerified: false,
      referralCode: nanoid(8).toUpperCase(), // Generate the code here
    });

    await db.Archive.findOrCreate({
      where: {
        userId: newUser.id,
        name: "Saved for later",
      },
    });

    const token = jwt.sign({ id: newUser.id }, process.env.NEXTAUTH_SECRET, {
      expiresIn: "24h",
    });

    const verifyUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/verify/${token}`;

    await sendEmail({
      to: newUser.email,
      subject: "Verify your MorningFeeds account",
      html: `<p>Click the link below to verify your MorningFeeds account</p>
               <a href="${verifyUrl}">Verify Account</a>
               <p>This link is only valid for 24 hours.</p>`,
    });

    const { password: _pw, ...userWithoutPassword } = newUser.toJSON();

    return NextResponse.json(
      {
        message:
          "Registration successful! Please check your email to verify your account.",
        user: userWithoutPassword,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error in /api/register:", err);

    if (err.name === "SequelizeUniqueConstraintError") {
      return NextResponse.json(
        { error: "User with this email already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error", details: err.message },
      { status: 500 }
    );
  }
}

// import { NextResponse } from "next/server";
// import initializeDbAndModels from "@/lib/db.js";
// import { authRateLimitMiddleware } from "@/lib/rate-limiter";

// export const dynamic = "force-dynamic";

// export async function POST(req) {
//   try {
//     await authRateLimitMiddleware(req, NextResponse);

//     const { email, password } = await req.json();

//     // Basic manual validation
//     if (!email || !password)
//       return NextResponse.json(
//         { error: "Email and password are required." },
//         { status: 400 }
//       );
//     if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
//       return NextResponse.json(
//         { error: "Must be a valid email." },
//         { status: 400 }
//       );
//     if (password.length < 6)
//       return NextResponse.json(
//         { error: "Password must be at least 6 characters." },
//         { status: 400 }
//       );

//     const db = await initializeDbAndModels();
//     const { User } = db;

//     const newUser = await User.create({ email, password });

//     await db.Archive.findOrCreate({
//       where: {
//         userId: newUser.id,
//         name: "Saved for later",
//       },
//     });
//     const { password: _pw, ...userWithoutPassword } = newUser.toJSON();

//     return NextResponse.json(
//       { message: "User registered successfully!", user: userWithoutPassword },
//       { status: 201 }
//     );
//   } catch (err) {
//     console.error("Error in /api/register:", err);

//     if (err.name === "SequelizeUniqueConstraintError") {
//       return NextResponse.json(
//         { error: "User with this email already exists." },
//         { status: 409 }
//       );
//     }
//     return NextResponse.json(
//       { error: "Internal server error", details: err.message },
//       { status: 500 }
//     );
//   }
// }
