import User from "@/lib/models/User";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    await User.sync();
    const users = await User.findAll();
    return Response.json(users);
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}

export async function POST_login(req, res) {
  const {email, password} = body;
  const user = await User.findOne({where: {email}});
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  return NextResponse.json(
    { message: "Login successful", user: { email: user.email, tier: user.tier } },
    { status: 200 }
  );
};
