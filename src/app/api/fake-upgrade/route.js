// app/api/fake-upgrade/route.js
import { NextResponse } from "next/server";
import initializeDbAndModels from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";

export async function POST(req) {
  try {
    const body = await req.text();
    const { cardNumber, expDate, cvv } = JSON.parse(body);

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "User session not authenticated" }, { status: 401 });
    }

    if (
      !cardNumber || cardNumber.trim().length !== 16 ||
      !expDate || expDate.trim().length !== 5 || // Expecting MM/YY
      !cvv || cvv.trim().length !== 3
    ) {
      return NextResponse.json({ message: "Invalid card info" }, { status: 400 });
    }

    const db = await initializeDbAndModels();
    const User = db.User;

    const user = await User.findOne({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    user.tier = 1;
    await user.save();

    return NextResponse.json({ message: "Tier upgraded to 1!" });
  } catch (err) {
    console.error("Upgrade error:", err);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const db = await initializeDbAndModels();
    const User = db.User;

    const user = await User.findOne({ where: { email: session.user.email } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    user.tier = 0;
    await user.save();

    return NextResponse.json({ message: "Subscription canceled. Tier downgraded to 0." });
  } catch (err) {
    console.error("Unsubscribe error:", err);
    return NextResponse.json({ message: "Something went wrong" }, { status: 500 });
  }
}
