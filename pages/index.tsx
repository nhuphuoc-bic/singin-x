import { useEffect, useState } from "react";
import { SignInWithXButton } from "../components/SignInWithXButton";
import { UserProfile } from "../components/UserProfile";
import React from "react";

export default function Home() {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setToken(typeof window !== "undefined" ? localStorage.getItem("session_token") : null);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 100 }}>
      <h1>Sign In with X Demo</h1>
      {token ? <UserProfile token={token} /> : <SignInWithXButton />}
    </div>
  );
} 