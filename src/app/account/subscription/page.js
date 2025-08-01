import SideBarNav from "@/components/SideNavBar";
import UnsubscribeComponent from "@/components/Pages/Unsubscribe";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";
import Link from "next/link";

export default async function SubcriptionPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          width: "auto",
          height: "auto",
        }}
      >
        Your subscription tier:
        {session.user.tier === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "auto",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <p>
              <b>Free tier</b>
            </p>
            <br />
            <p>
              Want to upgrade?
              <Link href={"/subscribe"}>
                <u>Click here to subscribe!</u>
              </Link>
            </p>
          </div>
        ) : session.user.tier === 1 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "auto",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <p>
              <b>Subscribed</b>
            </p>
            <br />
            <div>
              Want to cancel your subscription?
              <UnsubscribeComponent />
            </div>
          </div>
        ) : (
          <p>
            <b>Admin</b>
          </p>
        )}
      </div>
    </>
  );
}
