import SideBarNav from "@/components/SideNavBar";

export default function AccountLayout({children}) {

    return (
        
            <div style={{display: 'flex', flexGrow: '1', height: "100%"}}>
                <SideBarNav />
                <main style={{flexGrow: '1'}}>{children}</main>
            </div>
        
    )
}