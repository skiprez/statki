"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSignIn, useSignUp, useClerk, useUser } from "@clerk/nextjs";
import { FaSignInAlt, FaUserPlus, FaArrowLeft, FaUserCircle, FaEnvelope, FaLock } from "react-icons/fa";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();
  const { isSignedIn } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        // login przez email lub username
        const res = await signIn?.create({
          identifier: email || username,
          password,
        });
        if (res?.status === "complete") {
          await setActive({ session: res.createdSessionId });
          router.push("/");
        } else {
          setError("Nie udało się zalogować. Sprawdź dane.");
        }
      } else {
        // rejestracja z username i password, email opcjonalny
        const res = await signUp?.create({
          username,
          password,
          ...(email ? { emailAddress: email } : {}), // dodaj email tylko jeśli podany
        });
        if (res?.status === "complete") {
          await setActive({ session: res.createdSessionId });
          router.push("/");
        } else {
          setError("Nie udało się zarejestrować.");
        }
      }
    } catch (err) {
      if (typeof err === "object" && err !== null && "errors" in err && Array.isArray((err as { errors?: { message?: string }[] }).errors)) {
        setError((err as { errors?: { message?: string }[] }).errors?.[0]?.message || "Wystąpił błąd.");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Wystąpił błąd.");
      }
    } finally {
      setLoading(false);
    }
  };

  // If already logged in, redirect to main page
  useEffect(() => {
    if (isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-transparent px-4 py-8 text-gray-100">
      <div className="w-full max-w-lg bg-black/30 border border-white/20 rounded-2xl shadow-xl backdrop-blur p-0 flex flex-col overflow-hidden relative">
        {/* Return button */}
        <Link
          href="/"
          className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-cyan-500/80 hover:text-white transition font-semibold text-cyan-200 shadow z-20"
        >
          <FaArrowLeft /> Powrót
        </Link>
        <div className="flex flex-col items-center justify-center py-10 px-8">
          <div className="mb-6 flex items-center justify-center">
            <div className="rounded-full bg-cyan-900/30 p-4 shadow-lg">
              {mode === "login" ? (
                <FaSignInAlt className="w-10 h-10 text-cyan-400" />
              ) : (
                <FaUserPlus className="w-10 h-10 text-green-400" />
              )}
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-center mb-8 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg flex items-center justify-center gap-3">
            {mode === "login" ? "Zaloguj się" : "Zarejestruj się"}
          </h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
            {/* Username */}
            <div>
              <label className="text-white/80 mb-1 font-semibold flex items-center gap-2">
                <FaUserCircle className="text-cyan-300" /> Nazwa użytkownika
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 pl-11 bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium text-lg shadow"
                  placeholder="Nazwa użytkownika"
                  required
                  disabled={loading}
                />
                <FaUserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300 opacity-70 pointer-events-none" size={22} />
              </div>
            </div>
            {/* Email (register only) */}
            {mode === "register" && (
              <div>
                <label className="text-white/80 mb-1 font-semibold flex items-center gap-2">
                  <FaEnvelope className="text-cyan-300" /> Email <span className="text-gray-500 font-normal">(opcjonalny)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl px-4 py-3 pl-11 bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium text-lg shadow"
                    placeholder="twoj@email.com"
                    disabled={loading}
                  />
                  <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300 opacity-70 pointer-events-none" size={20} />
                </div>
              </div>
            )}
            {/* Password */}
            <div>
              <label className="text-white/80 mb-1 font-semibold flex items-center gap-2">
                <FaLock className="text-cyan-300" /> Hasło
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl px-4 py-3 pl-11 bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium text-lg shadow"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300 opacity-70 pointer-events-none" size={20} />
              </div>
            </div>
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              className={`w-full py-3 rounded-2xl font-bold shadow-xl transition text-lg mt-2 ${
                mode === "login"
                  ? "bg-cyan-500/95 hover:bg-cyan-400"
                  : "bg-green-500/90 hover:bg-green-400"
              } ${loading ? "opacity-60 cursor-not-allowed" : ""}`}
              disabled={loading}
            >
              {loading
                ? (mode === "login" ? "Logowanie..." : "Rejestracja...")
                : (mode === "login" ? "Zaloguj się" : "Zarejestruj się")}
            </motion.button>
          </form>
          <p className="text-sm text-center text-gray-400 mt-8">
            {mode === "login" ? (
              <span>
                {"Nie masz konta? "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Zarejestruj się
                </button>
              </span>
            ) : (
              <span>
                {"Masz już konto? "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-cyan-400 hover:underline font-semibold"
                >
                  Zaloguj się
                </button>
              </span>
            )}
          </p>
        </div>
      </div>
    </main>
  );
}
