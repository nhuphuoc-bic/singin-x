import React from "react";
import { generateCodeVerifier, generateCodeChallenge } from "../utils/pkce";

const X_CLIENT_ID = process.env.NEXT_PUBLIC_X_CLIENT_ID!;
const X_REDIRECT_URI = process.env.NEXT_PUBLIC_X_REDIRECT_URI!;

export const SignInWithXButton: React.FC = () => {
  const handleSignIn = async () => {
    // Cryptographically secure random
    const generateState = () => {
      const array = new Uint8Array(32);
      window.crypto.getRandomValues(array);
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    };
    
    const state = generateState();
    document.cookie = `oauth_state=${state}; path=/; max-age=600; SameSite=Lax`;
    console.log('state', state)

    const code_verifier = generateCodeVerifier();
    console.log('code_verifier sign in', code_verifier)
    const code_challenge = await generateCodeChallenge(code_verifier);
    console.log('code_challenge sign in', code_challenge)

    // Store code_verifier for use after redirect
    localStorage.setItem("pkce_code_verifier", code_verifier);

    const params = new URLSearchParams({
      response_type: "code",
      client_id: X_CLIENT_ID,
      redirect_uri: X_REDIRECT_URI,
      scope: "tweet.read users.read users.email",
      state,
      code_challenge,
      code_challenge_method: "S256",
    });
    window.location.href = `https://x.com/i/oauth2/authorize?${params.toString()}`;
  };

  return (
    <button onClick={handleSignIn} style={{ padding: "10px 20px", fontSize: 16, cursor: "pointer" }}>
      Sign in with X
    </button>
  );
}; 