import React, { useEffect, useRef } from "react";
import { useRouter } from "next/router";

const Callback: React.FC = () => {
  const router = useRouter();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get("state");
    const code = urlParams.get("code");
    const code_verifier = localStorage.getItem("pkce_code_verifier");
    const oauth_state = document.cookie.split('; ').find(row => row.startsWith('oauth_state='))?.split('=')[1]; // can use sessionStorage if in the same domain
    console.log('state callback', state)
    console.log('oauth_state callback', oauth_state)
    console.log('code callback', code)
    console.log('code_verifier callback', code_verifier)

    if (code && code_verifier && state === oauth_state) {
      called.current = true;
      console.log('exchange code for access token')
      fetch('http://localhost:3008/public/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-real-ip': '101.101.96.0', 'x-version-id': '4.0.0', 'x-platform': 'WEB', 'x-lang': 'en' },
        body: JSON.stringify({
          token: code,
          provider: "X",
          extra: {
            code_verifier: code_verifier,
            redirect_uri: 'http://127.0.0.1:3005/callback?provider=x',
          },
          device: {
            application: "BIC_GROUP",
            device_id: "4570e3b2-8fd0-4e6f-b28c-bfdc34b1a1d2",
            device_name: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0",
            platform: "WEB"
          },
          referral: {
            type: "COMMUNITY",
            code: "e7uo1w"
          },
          security: {
            token: "abc",
            version: 3
          }
        }),
      })
      .then(res => res.json())
      .then(data => {
        console.log('data', data)
      })
      .catch(err => {
        console.error(err)
      })
    }
  }, []);

  return <div>Signing you in...</div>;
};

export default Callback; 