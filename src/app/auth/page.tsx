"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useSignIn, useSignUp, useClerk } from "@clerk/nextjs";
import { FaSignInAlt, FaUserPlus } from "react-icons/fa";

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");

  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      if (mode === "login") {
        // login przez email lub username
        const res = await signIn?.create({
          identifier: email || username,
          password,
        });

        if (res?.status === "complete") {
          await setActive({ session: res.createdSessionId });
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
        } else {
          setError("Nie udało się zarejestrować.");
        }
      }
    } catch (err: any) {
      setError(err.errors?.[0]?.message || "Wystąpił błąd.");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-black/40 backdrop-blur-md p-8 rounded-2xl shadow-xl"
      >
        <div className="flex justify-center mb-6">
          {mode === "login" ? (
            <FaSignInAlt className="w-10 h-10 text-cyan-400" />
          ) : (
            <FaUserPlus className="w-10 h-10 text-green-400" />
          )}
        </div>

        <h1 className="text-2xl font-bold text-center mb-6">
          {mode === "login" ? "Zaloguj się" : "Zarejestruj się"}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* username zawsze wymagany */}
          <div>
            <label className="block text-sm mb-1">Nazwa użytkownika</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-900/60 border border-gray-700 focus:ring-2 focus:ring-cyan-400 outline-none"
              placeholder="np. Hubert123"
              required
            />
          </div>

          {/* email tylko jeśli ktoś chce */}
          {mode === "register" && (
            <div>
              <label className="block text-sm mb-1">
                Email <span className="text-gray-500">(opcjonalny)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-gray-900/60 border border-gray-700 focus:ring-2 focus:ring-cyan-400 outline-none"
                placeholder="twoj@email.com"
              />
            </div>
          )}

          <div>
            <label className="block text-sm mb-1">Hasło</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-900/60 border border-gray-700 focus:ring-2 focus:ring-cyan-400 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className={`w-full py-3 rounded-lg font-semibold shadow-md transition ${
              mode === "login"
                ? "bg-cyan-500 hover:bg-cyan-400"
                : "bg-green-500 hover:bg-green-400"
            }`}
          >
            {mode === "login" ? "Zaloguj się" : "Zarejestruj się"}
          </motion.button>
        </form>

        <p className="text-sm text-center text-gray-400 mt-6">
          {mode === "login" ? (
            <>
              Nie masz konta?{" "}
              <button
                onClick={() => setMode("register")}
                className="text-cyan-400 hover:underline"
              >
                Zarejestruj się
              </button>
            </>
          ) : (
            <>
              Masz już konto?{" "}
              <button
                onClick={() => setMode("login")}
                className="text-cyan-400 hover:underline"
              >
                Zaloguj się
              </button>
            </>
          )}
        </p>
      </motion.div>
    </main>
  );
}
