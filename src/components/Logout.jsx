"use client";
import { signOut } from "next-auth/react";
import styles from "./Logout.module.scss";

//create separate component for handling logout, then import into Header
export default function LogoutComponent() {

  return <button className={styles.logoutButton} onClick={() => signOut({callbackUrl: '/login'}) }>Logout</button>;
}
