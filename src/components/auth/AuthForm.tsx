"use client";

import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[0-9]/, "Password must contain a number");

interface AuthFormProps {
  isSignupDefault?: boolean; // optional default mode
  onClose?: () => void; // optional for modal to close
}

export default function AuthForm({
  isSignupDefault = false,
  onClose,
}: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isSignup, setIsSignup] = useState(isSignupDefault);
  const [rememberMe, setRememberMe] = useState(false);

  const googleButtonRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth(); // <-- NEW

  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/";

  // Trigger Google button click from custom button
  const handleGoogleButtonClick = () => {
    const googleBtn = googleButtonRef.current?.querySelector(
      'div[role="button"]'
    ) as HTMLElement;
    if (googleBtn) googleBtn.click();
  };

  /** LOGIN/SIGNUP FUNCTIONS **/

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate password
    const validation = passwordSchema.safeParse(password);
    if (!validation.success) {
      setPasswordError(validation.error.errors[0].message);
      setLoading(false);
      return;
    }
    setPasswordError("");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/signup`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        }
      );

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server did not return valid JSON");
      }

      if (!res.ok) throw new Error(data?.message || "Signup failed");

     login(data.user, data.token); // updates context + localStorage + dispatch event


      toast({
        title: "Success!",
        description: "Account created successfully. Redirecting...",
      });

      if (onClose) onClose(); // close modal if exists
      navigate(redirectPath);
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Server did not return valid JSON");
      }

      if (!res.ok) throw new Error(data?.message || "Login failed");

      login(data.user, data.token); // updates context + localStorage + dispatch event

// Check if there’s a saved redirect
const redirectAfterLogin = sessionStorage.getItem("postLoginRedirect") || redirectPath;
sessionStorage.removeItem("postLoginRedirect");

navigate(redirectAfterLogin); // goes to /cart if that’s where the user wanted
      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.user.username}`,
      });

      if (onClose) onClose();
      navigate(redirectPath);
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

  const handleGoogleLogin = async (credentialResponse: any) => {
    const credential = credentialResponse.credential;
    if (!credential) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/api/auth/google-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: credential }),
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Google login failed");

  login(data.user, data.token); // updates context + localStorage + dispatch event

// Check if there’s a saved redirect
const redirectAfterLogin = sessionStorage.getItem("postLoginRedirect") || redirectPath;
sessionStorage.removeItem("postLoginRedirect");

navigate(redirectAfterLogin); // goes to /cart if that’s where the user wanted
      toast({
        title: "Google login successful",
        description: `Welcome ${data.user.username}`,
      });

      if (onClose) onClose();
      navigate(redirectPath);
    } catch (err: any) {
      toast({
        title: "Google login failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  /** RENDER **/
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex justify-center mb-6">
        <img src="./Logo.png" alt="Buzzy" className="h-10" />
      </div>

      <h1 className="text-2xl font-semibold text-gray-900 text-center mb-2">
        {isSignup ? "Create an account" : "Log in to your account"}
      </h1>
      <p className="text-gray-500 text-center mb-8 text-sm">
        {isSignup
          ? "Start your 30-day free trial."
          : "Welcome back! Please enter your details."}
      </p>

      {/* FORM */}
      <form
        onSubmit={isSignup ? handleEmailSignup : handleEmailLogin}
        className="space-y-5"
      >
        {isSignup && (
          <div>
            <input
              id="signup-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            />
          </div>
        )}

        {/* Email */}
        <div>
          <input
            id={isSignup ? "signup-email" : "signin-email"}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div>

        {/* Password */}
        <div>
          <input
            id={isSignup ? "signup-password" : "signin-password"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm ${
              passwordError ? "border-red-500" : "border-gray-300"
            }`}
          />
          {passwordError && (
            <p className="text-sm text-red-500 mt-1">{passwordError}</p>
          )}
        </div>

        {!isSignup && (
          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                Remember for 30 days
              </span>
            </label>
            <a
              href="#"
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              Forgot password
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg transition-colors"
        >
          {loading
            ? isSignup
              ? "Creating account..."
              : "Signing in..."
            : isSignup
            ? "Continue with email"
            : "Sign in"}
        </button>

        {/* OR Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 border-t border-gray-300"></div>
          <span className="px-4 text-xs text-gray-500 uppercase">OR</span>
          <div className="flex-1 border-t border-gray-300"></div>
        </div>

        {/* Google Login */}
        <button
          type="button"
          onClick={handleGoogleButtonClick}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 18 18"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"
              fill="#4285F4"
            />
            <path
              d="M9.003 18c2.43 0 4.467-.806 5.956-2.184l-2.909-2.258c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9.003 18z"
              fill="#34A853"
            />
            <path
              d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"
              fill="#FBBC05"
            />
            <path
              d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.426 0 9.003 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29c.708-2.127 2.692-3.71 5.039-3.71z"
              fill="#EA4335"
            />
          </svg>
          {isSignup ? "Sign up with Google" : "Sign in with Google"}
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

        {/* Toggle Link */}
        <p className="text-center text-sm text-gray-600 mt-6">
          {isSignup ? "Already have an account? " : "Don't have an account? "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsSignup(!isSignup);
            }}
            className="text-purple-600 hover:text-purple-700 font-medium"
          >
            {isSignup ? "Log in" : "Sign up"}
          </a>
        </p>
      </form>
    </div>
  );
}
