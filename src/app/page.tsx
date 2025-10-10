"use client";

// Core React and state
import Link from "next/link";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SignedIn, SignedOut, useClerk } from "@clerk/nextjs";
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
  FaRegCircle,
  FaRegTimesCircle,
  FaChessKing,
} from "react-icons/fa";

export default function HomePage() {
  const games = [
    { name: "Statki", route: "/queue-ships", icon: <FaShip className="mx-auto text-cyan-300" size={32} />, desc: "Zagraj w klasyczne statki" },
    { name: "Connect 4", route: "/queue-connect4", icon: <FaRegCircle className="mx-auto text-yellow-300" size={32} />, desc: "Połącz cztery w linii" },
    { name: "Kółko i krzyżyk", route: "/queue-tictactoe", icon: <FaRegTimesCircle className="mx-auto text-red-400" size={32} />, desc: "Klasyczna gra X/O" },
    { name: "Szachy", route: "/queue-chess", icon: <FaChessKing className="mx-auto text-gray-300" size={32} />, desc: "Zagraj w szachy online" },
  ];
  return (
  <main className="min-h-screen text-gray-100 flex flex-col items-center bg-gradient-to-br from-[#090e1a] via-[#111827] to-[#181f2f]">
      {/* --- Top Navigation Bar --- */}
      <motion.nav
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full flex flex-wrap items-center justify-center px-4 sm:px-6 md:px-8 py-3 md:py-4 shadow-lg z-10 bg-transparent"
      >
        <div className="flex items-center gap-2 sm:gap-3 mx-auto">
          <FaShip className="w-7 h-7 sm:w-8 sm:h-8 text-cyan-400" />
          <span className="text-xl sm:text-2xl font-extrabold tracking-wide">Game Hub</span>
        </div>
        <div className="hidden md:flex items-center gap-6 mx-auto">
          <a href="/queue" className="hover:text-cyan-400 font-medium transition">Graj</a>
          <a href="/rules" className="hover:text-cyan-400 font-medium transition">Dokumentacja</a>
          <a href="https://github.com/skiprez/statki" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-cyan-400 font-medium transition">
            <FaGithub className="w-5 h-5" />
            <span>Kod</span>
          </a>
        </div>
        <div className="md:hidden flex items-center gap-2 mx-auto">
          {/* Mobile menu button could go here if needed */}
        </div>
        <div className="mt-2 md:mt-0 mx-auto">
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
  <section className="flex-1 flex flex-col items-center justify-center text-center px-2 sm:px-4 w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="w-full max-w-2xl mx-auto mt-8 sm:mt-12"
        >
          <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg mb-3 sm:mb-4">
            Game Hub of Jagoda & Hubert
          </h1>
          <p className="text-base xs:text-lg md:text-xl text-gray-300 mb-6 sm:mb-8">
            Wybierz grę i baw się dobrze!
          </p>
          <SignedIn>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 w-full max-w-3xl mx-auto">
              {games.map((game) => (
                <Link
                  key={game.route}
                  href={game.route}
                  className={
                    `group block rounded-xl shadow-lg border border-white/10 bg-gradient-to-br from-[#101a2b] via-[#18243a] to-[#1a2333] p-4 text-center transition-all duration-150
                    hover:scale-[1.04] hover:shadow-xl hover:border-cyan-400/40 hover:bg-gradient-to-br hover:from-cyan-900 hover:via-blue-900 hover:to-cyan-700`
                  }
                  style={{ minHeight: "110px" }}
                >
                  <span className="mb-2 block drop-shadow transition-all duration-150 group-hover:scale-105">
                    {game.icon}
                  </span>
                  <span className="text-lg font-bold mb-1 block bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-200 bg-clip-text text-transparent group-hover:from-cyan-400 group-hover:to-blue-400">
                    {game.name}
                  </span>
                  <span className="text-xs text-cyan-100 opacity-80 group-hover:opacity-100">{game.desc}</span>
                </Link>
              ))}
            </div>
          </SignedIn>
          <SignedOut>
            <div className="mb-8 w-full max-w-3xl mx-auto flex flex-col items-center justify-center">
              <div className="rounded-xl bg-black/30 border border-white/10 shadow-lg p-6 text-center">
                <span className="text-xl font-bold text-cyan-300 mb-2 block">Zaloguj się, aby zobaczyć gry!</span>
                <Link href="/auth" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-cyan-600 hover:bg-cyan-500 transition shadow font-bold text-base text-white mt-4">
                  <FaSignInAlt /> Zaloguj się
                </Link>
              </div>
            </div>
          </SignedOut>
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
              desc="Dołącz do kolejki i graj bez czekania. Bezproblemowe doświadczenie."
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
        <span>Game Hub © 2025 • Projekt szkolny</span>
      </footer>
    </main>
  );
}

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
