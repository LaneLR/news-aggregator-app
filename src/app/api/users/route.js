import User from "@/lib/models/User";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await User.sync();
    const users = await User.findAll();
    return NextResponse.json(users);
  } catch (err) {
    return NextResponse(JSON.stringify({ error: err.message }), {
      status: 500,
    });
  }
}
