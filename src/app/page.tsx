"use client";

// Core React and state
import React, { useState } from "react";
// Animation library
import { motion } from "framer-motion";
// Clerk authentication components
import { SignedIn, SignedOut, useClerk } from "@clerk/nextjs";
// Icons used in the UI
import {
  FaShip,
  FaPlay,
  FaBook,
  FaGithub,
  FaSignInAlt,
  FaUserCircle,
  FaSignOutAlt,
  FaUserEdit,
  FaCog,
} from "react-icons/fa";


// Main homepage component - Modern Game Layout
export default function HomePage() {
  return (
    <main className="min-h-screen text-gray-100 flex flex-col bg-gradient-to-br from-[#090e1a] via-[#111827] to-[#181f2f]">
      {/* --- Top Navigation Bar --- */}
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full flex flex-wrap items-center justify-between px-4 sm:px-6 md:px-8 py-3 md:py-4 shadow-lg z-10 bg-transparent"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <FaShip className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
          <span className="text-xl sm:text-2xl font-extrabold tracking-wide">Statki</span>
        </div>
        <div className="hidden md:flex items-center gap-6">
          <a href="/queue" className="hover:text-cyan-400 font-medium transition">Graj</a>
          <a href="/rules" className="hover:text-cyan-400 font-medium transition">Dokumentacja</a>
          <a href="https://github.com/skiprez/statki" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-cyan-400 font-medium transition">
            <FaGithub className="w-5 h-5" />
            <span>Kod</span>
          </a>
        </div>
        <div className="md:hidden flex items-center gap-2">
          {/* Mobile menu button could go here if needed */}
        </div>
        <div className="ml-auto md:ml-0 mt-2 md:mt-0">
          <SignedIn>
            <UserMenu />
          </SignedIn>
          <SignedOut>
            <a href="/auth" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 transition font-medium text-sm md:text-base">
              <FaSignInAlt /> <span className="hidden xs:inline">Zaloguj się</span>
            </a>
          </SignedOut>
        </div>
      </motion.nav>

      {/* --- Hero Section --- */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-2 sm:px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-full max-w-2xl mx-auto mt-8 sm:mt-12"
        >
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg mb-3 sm:mb-4">
            Statki Online
          </h1>
          <p className="text-base xs:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8">
            Nowoczesna gra w statki dla dwóch osób. Dołącz do kolejki i zmierz się z innym graczem w czasie rzeczywistym!
          </p>
          <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 justify-center items-center">
            <SignedIn>
              <motion.a
                href="/queue"
                className="inline-flex items-center gap-2 px-6 py-3 xs:px-8 xs:py-4 rounded-2xl bg-cyan-500/95 hover:bg-cyan-400 transition shadow-xl font-bold text-base xs:text-lg max-w-fit w-full xs:w-auto"
                whileTap={{ scale: 0.97 }}
              >
                <FaPlay /> Zagraj teraz
              </motion.a>
            </SignedIn>
            <SignedOut>
              <motion.a
                href="/auth"
                className="inline-flex items-center gap-2 px-6 py-3 xs:px-8 xs:py-4 rounded-2xl bg-red-500/90 hover:bg-red-400 transition shadow-xl font-bold text-base xs:text-lg max-w-fit w-full xs:w-auto"
                whileTap={{ scale: 0.97 }}
              >
                <FaSignInAlt /> Zaloguj się
              </motion.a>
            </SignedOut>
            <motion.a
              href="/rules"
              className="inline-flex items-center gap-2 px-6 py-3 xs:px-8 xs:py-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition font-bold text-base xs:text-lg max-w-fit w-full xs:w-auto"
              whileTap={{ scale: 0.97 }}
            >
              <FaBook /> 
            </motion.a>
          </div>
        </motion.div>

        {/* --- Feature Cards --- */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10 sm:mt-16 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-4xl mx-auto w-full px-1 xs:px-0"
        >
          <div className="w-full flex justify-center md:block">
            <FeatureCard
              icon={<FaPlay className="w-7 h-7 text-cyan-400" />}
              title="Szybka rozgrywka"
              desc="Dołącz do kolejki i graj bez czekania. System automatycznie dobiera przeciwnika."
            />
          </div>
          <div className="w-full flex justify-center md:block">
            <FeatureCard
              icon={<FaUserCircle className="w-7 h-7 text-cyan-400" />}
              title="Bezpieczne logowanie"
              desc="Korzystaj z bezpiecznego systemu logowania i zarządzania profilem."
            />
          </div>
          <div className="w-full flex justify-center md:block">
            <FeatureCard
              icon={<FaBook className="w-7 h-7 text-cyan-400" />}
              title="Proste zasady"
              desc="Zasady gry dostępne w każdej chwili. Naucz się grać w kilka minut!"
            />
          </div>
        </motion.div>
      </section>

      {/* --- Team/Project Info at Bottom --- */}
      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="w-full py-6 sm:py-8 mt-10 sm:mt-16"
      >
        <div className="max-w-4xl mx-auto px-2 sm:px-4">
          <h2 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-cyan-300">Twórcy projektu</h2>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-4 sm:gap-6">
            <RoleCard
              name="Hubert Kaftan"
              role="Frontend & UX"
              bullets={["Projekt i implementacja interfejsu", "Animacje i responsywność", "Integracja logowania i autoryzacji", "Testowanie użyteczności"]}
            />
            <RoleCard
              name="Jagoda Stępień"
              role="Backend & Bazy danych"
              bullets={["Tworzenie API gry i obsługa logiki", "Projekt i zarządzanie bazą danych Supabase", "Walidacja ruchów i wyników", "Wdrożenie projektu na Vercel"]}
            />
          </div>
          <div className="mt-6 sm:mt-8 text-xs text-gray-400 flex flex-wrap items-center gap-x-3 gap-y-1 justify-center">
            <a
              href="https://github.com/skiprez/statki"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 whitespace-nowrap hover:underline text-cyan-300"
            >
              <FaGithub className="w-4 h-4" />
              <span>Kod źródłowy</span>
            </a>
            <span className="hidden sm:inline">•</span>
            <span className="whitespace-nowrap">Projekt szkolny 2025</span>
            <span className="hidden sm:inline">•</span>
            <span className="whitespace-nowrap">Next.js</span>
            <span className="hidden sm:inline">•</span>
            <span className="whitespace-nowrap">Tailwind</span>
            <span className="hidden sm:inline">•</span>
            <span className="whitespace-nowrap">Supabase</span>
          </div>
        </div>
      </motion.section>

      {/* --- Footer --- */}
      <footer className="w-full text-center text-xs text-gray-500 py-4 mt-4">
        <span>Statki © 2025 • Projekt szkolny</span>
      </footer>
    </main>
  );
}
// Feature card component
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.03 }}
      transition={{ type: "spring", stiffness: 250 }}
      className="rounded-xl p-6 shadow-lg flex flex-col items-center text-center border border-white/5 max-w-xs w-full md:max-w-none md:w-auto mx-auto"
    >
      <div className="mb-2">{icon}</div>
      <div className="font-bold text-base mb-1 text-cyan-200">{title}</div>
      <div className="text-gray-300 text-sm">{desc}</div>
    </motion.div>
  );
}


// User menu dropdown (shows when user is signed in)
function UserMenu() {
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
      >
        <FaUserCircle className="w-6 h-6 text-cyan-300" />
        <span className="hidden sm:block">Profil</span>
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute right-0 mt-2 w-48 bg-gray-800/95 backdrop-blur-md rounded-xl shadow-lg overflow-hidden border border-gray-700/60"
        >
          <a
            href="/profile"
            className="flex items-center gap-2 px-4 py-3 hover:bg-gray-700/50 text-sm text-gray-200"
          >
            <FaUserEdit /> Edytuj profil
          </a>
          <a
            href="/settings"
            className="flex items-center gap-2 px-4 py-3 hover:bg-gray-700/50 text-sm text-gray-200"
          >
            <FaCog /> Ustawienia
          </a>
          <button
            onClick={() => signOut()}
            className="w-full text-left flex items-center gap-2 px-4 py-3 hover:bg-red-600/60 text-sm text-red-400"
          >
            <FaSignOutAlt /> Wyloguj się
          </button>
        </motion.div>
      )}
    </div>
  );
}


// Team member card component
function RoleCard({ name, role, bullets }: { name: string; role: string; bullets: string[] }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 250 }}
      className="p-4 rounded-xl border border-white/6"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-cyan-300 font-semibold">{role}</div>
          <div className="mt-1 font-bold">{name}</div>
        </div>
        <div className="text-xs text-gray-400">Status: aktywny</div>
      </div>
      <ul className="mt-3 text-sm text-gray-300 list-disc list-inside space-y-1">
        {bullets.map((b) => (
          <li key={b}>{b}</li>
        ))}
      </ul>
    </motion.div>
  );
}
