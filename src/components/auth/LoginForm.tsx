// LoginForm.tsx
"use client";

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext"; // ✅ import context

interface Props {
  onSwitchToSignup?: () => void;
  onLoginSuccess?: () => void; // we don’t need to pass user now
}

const LoginForm: React.FC<Props> = ({ onSwitchToSignup, onLoginSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth(); // ✅ use AuthContext

  // Email/password login
  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      // ✅ update context
      login(data.user, data.token);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.username}`,
      });

      if (onLoginSuccess) onLoginSuccess(); // close modal
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const handleGoogleLogin = async (credentialResponse: any) => {
    const credential = credentialResponse.credential;
    if (!credential) return;

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Google login failed");

      // ✅ update context
      login(data.user, data.token);

      toast({
        title: "Google login successful",
        description: `Welcome ${data.user.username}`,
      });

      if (onLoginSuccess) onLoginSuccess(); // close modal
    } catch (err: any) {
      toast({
        title: "Google login failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleGoogleButtonClick = () => {
    const googleBtn = googleButtonRef.current?.querySelector('div[role="button"]') as HTMLElement;
    if (googleBtn) googleBtn.click();
  };

  const handleSwitchToSignup = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onSwitchToSignup) onSwitchToSignup();
    else navigate("/signup");
  };

  return (
    <div className="max-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm w-full max-w-md p-8">
        <div className="flex justify-center mb-6">
          <img src="./Logo.png" alt="Toyify" className="h-10" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
          Log in to your account
        </h1>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Welcome back! Please enter your details.
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg mb-4"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <button
          onClick={handleGoogleButtonClick}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg mb-4 flex items-center justify-center gap-2"
        >
          Sign in with Google
        </button>

        <div ref={googleButtonRef} className="hidden">
          <GoogleLogin
            onSuccess={handleGoogleLogin}
            onError={() =>
              toast({
                title: "Google login failed",
                description: "Please try again.",
                variant: "destructive",
              })
            }
          />
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <a
            href="/signup"
            onClick={handleSwitchToSignup}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
