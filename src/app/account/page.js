import { auth } from "next-auth"

import { redirect } from "next/navigation";

export default async function AccountPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div>
      {/* name property doesn't exist in user, so commented out */}
      {/* <h1>Welcome, {session.user.name}</h1> */} 
      <p>Your email: {session.user.email}</p>
    </div>
  );
}
