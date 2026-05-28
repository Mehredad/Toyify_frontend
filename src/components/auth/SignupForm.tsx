"use client";

import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { GoogleLogin } from "@react-oauth/google";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext"; // ✅ import AuthContext

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

type Props = {
  onSwitchToLogin?: () => void;
};

const SignupForm: React.FC<Props> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth(); // ✅ get login function from AuthContext

  const handleContinue = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate password
    const passwordValidation = passwordSchema.safeParse(password);
    if (!passwordValidation.success) {
      setPasswordError(passwordValidation.error.errors[0].message);
      setLoading(false);
      return;
    }
    setPasswordError("");

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Signup failed");

      // ✅ Use AuthContext login
      login(data.user, data.token);

      toast({
        title: "Success!",
        description: "Account created successfully!",
      });
    } catch (err: any) {
      toast({
        title: "Signup failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

      // ✅ Use AuthContext login
      login(data.user, data.token);

      toast({
        title: "Google login successful",
        description: `Welcome ${data.user.username}`,
      });
    } catch (err: any) {
      toast({
        title: "Google login failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const handleGoogleButtonClick = () => {
    const googleBtn = googleButtonRef.current?.querySelector(
      'div[role="button"]'
    ) as HTMLElement;
    if (googleBtn) googleBtn.click();
  };

  const handleSwitchToLogin = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (onSwitchToLogin) onSwitchToLogin();
  };

  return (
    <div className="max-h-screen flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm w-full max-w-md p-8">
        <div className="flex justify-center mb-6">
          <img src="./Logo.png" alt="Toyify" className="h-10" />
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
          Create an account
        </h1>
        <p className="text-gray-500 text-center mb-8 text-sm">
          Start your 30-day free trial.
        </p>

        <input
          type="text"
          placeholder="Username (optional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />

        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />

        <input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={`w-full px-3 py-2 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm ${
            passwordError ? "border-red-500" : "border-gray-300"
          }`}
        />
        {passwordError && (
          <p className="text-sm text-red-500 mt-1">{passwordError}</p>
        )}

        <button
          onClick={handleContinue}
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2.5 rounded-lg mb-4"
        >
          {loading ? "Creating account..." : "Continue with email"}
        </button>

        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-xs text-gray-500 uppercase">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleButtonClick}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 py-2.5 rounded-lg flex items-center justify-center gap-2 mb-4"
        >
          Sign up with Google
        </button>
        <div ref={googleButtonRef} className="hidden">
          <GoogleLogin onSuccess={handleGoogleLogin} onError={() => toast({ title: "Google login failed", description: "Please try again.", variant: "destructive" })} />
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          Already have an account?{" "}
          <a
            href="#"
            onClick={handleSwitchToLogin}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  );
};

export { SignupForm };
export default SignupForm;
