"use client";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useState } from "react";
import { FaArrowLeft, FaPalette, FaBell, FaMoon, FaLanguage, FaSave } from "react-icons/fa";

// Example settings options (expand as needed)
const LANGUAGES = [
  { code: "pl", label: "Polski" },
  { code: "en", label: "English" },
];

export default function SettingsPage() {
  const { user } = useUser();
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("pl");
  const [notifications, setNotifications] = useState(true);

  // Simulate save (replace with real logic as needed)
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Ustawienia zapisane!");
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-transparent px-4 py-8 text-gray-100">
      <div className="w-full max-w-xl bg-black/30 border border-white/20 rounded-2xl shadow-xl backdrop-blur p-8 flex flex-col gap-8 relative">
        {/* Return button */}
        <Link
          href="/"
          className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-cyan-500/80 hover:text-white transition font-semibold text-cyan-200 shadow z-20"
        >
          <FaArrowLeft /> Powrót
        </Link>
        <h1 className="text-3xl font-extrabold text-center mb-2 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg flex items-center justify-center gap-3">
          <FaPalette className="inline-block text-cyan-300 mb-1" size={32} /> Ustawienia
        </h1>
        <form className="flex flex-col gap-8" onSubmit={handleSave}>
          {/* Theme setting */}
          <div>
            <label className="block text-white/80 mb-2 font-semibold flex items-center gap-2">
              <FaMoon className="text-cyan-300" /> Motyw
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                className={`px-4 py-2 rounded-xl border font-medium transition ${theme === "light" ? "bg-cyan-500/80 text-white border-cyan-400" : "bg-white/10 border-white/20 text-white hover:bg-cyan-400/30"}`}
                onClick={() => setTheme("light")}
              >
                Jasny
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-xl border font-medium transition ${theme === "dark" ? "bg-cyan-500/80 text-white border-cyan-400" : "bg-white/10 border-white/20 text-white hover:bg-cyan-400/30"}`}
                onClick={() => setTheme("dark")}
              >
                Ciemny
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-xl border font-medium transition ${theme === "system" ? "bg-cyan-500/80 text-white border-cyan-400" : "bg-white/10 border-white/20 text-white hover:bg-cyan-400/30"}`}
                onClick={() => setTheme("system")}
              >
                Systemowy
              </button>
            </div>
          </div>
          {/* Language setting */}
          <div>
            <label className="block text-white/80 mb-2 font-semibold flex items-center gap-2">
              <FaLanguage className="text-cyan-300" /> Język
            </label>
            <select
              className="w-full rounded-xl px-4 py-3 bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium text-lg shadow"
              value={language}
              onChange={e => setLanguage(e.target.value)}
            >
              {LANGUAGES.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </div>
          {/* Notifications setting */}
          <div className="flex items-center gap-3">
            <input
              id="notifications"
              type="checkbox"
              checked={notifications}
              onChange={e => setNotifications(e.target.checked)}
              className="accent-cyan-400 w-5 h-5 rounded focus:ring-cyan-400 border-white/20 bg-white/10"
            />
            <label htmlFor="notifications" className="text-white/80 font-semibold flex items-center gap-2">
              <FaBell className="text-cyan-300" /> Powiadomienia email
            </label>
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-cyan-500/95 hover:bg-cyan-400 transition font-bold text-lg shadow-xl flex items-center justify-center gap-2"
          >
            <FaSave /> Zapisz ustawienia
          </button>
        </form>
      </div>
    </main>
  );
}
