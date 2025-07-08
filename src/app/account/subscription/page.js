import SideBarNav from "@/components/SideNavBar";
import { authOptions } from "@/lib/auth-options";
import { getServerSession } from "next-auth";

export default async function SubcriptionPage() {
      const session = await getServerSession(authOptions);
    
      if (!session) {
        redirect("/login");
      }

    return (
        <>
            <p>Your subscription tier: {session.user.tier === 0 ? (<p>Free tier</p>) : session.user.tier === 1 ? (<p>Subscribed</p>) : (<p>Admin</p>)}</p>
        </>        
    )
}