import React, { useEffect, useState } from "react";

interface UserProfileProps {
  token: string;
}

export const UserProfile: React.FC<UserProfileProps> = ({ token }) => {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch("/api/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setUser);
  }, [token]);

  if (!user) return <div>Loading...</div>;

  return (
    <div style={{ textAlign: "center" }}>
      {user.avatar && <img src={user.avatar} alt="avatar" style={{ borderRadius: "50%", width: 80, height: 80 }} />}
      <div style={{ marginTop: 10, fontWeight: "bold" }}>{user.name}</div>
      <button
        style={{ marginTop: 20, padding: "8px 16px", fontSize: 14, cursor: "pointer" }}
        onClick={() => {
          localStorage.removeItem("session_token");
          window.location.reload();
        }}
      >
        Logout
      </button>
    </div>
  );
}; 