"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SignedIn, SignedOut, UserButton, useClerk } from "@clerk/nextjs";
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

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Hero */}
        <motion.section
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl bg-gradient-to-br from-slate-800/60 to-black/50 p-8 backdrop-blur-md shadow-2xl"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div
                className="bg-white/5 rounded-full p-4"
                whileHover={{ scale: 1.08, rotate: 6 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FaShip className="w-9 h-9 text-cyan-300" />
              </motion.div>

              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold">Statki</h1>
                <p className="text-sm text-gray-300 mt-1">
                  Prosta, online gra w statki — Next.js + Framer Motion + React Icons
                </p>
              </div>
            </div>

            {/* 🔑 User menu */}
            <SignedIn>
              <UserMenu />
            </SignedIn>
          </div>

          <p className="mt-6 text-gray-200 leading-relaxed">
            Witaj w grze „Statki”! Stwórz rozgrywkę, zaproś znajomego i rywalizuj na polu 10x10. Ten starter zawiera
            responsywną stronę startową z animacjami, CTA oraz kartami ról zespołu.
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <SignedIn>
              <motion.a
                href="/queue"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500/95 hover:bg-cyan-400 transition shadow-md font-medium"
                whileTap={{ scale: 0.98 }}
              >
                <FaPlay /> Rozpocznij grę
              </motion.a>
            </SignedIn>

            <SignedOut>
              <motion.a
                href="/auth"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-red-500/90 hover:bg-red-400 transition shadow-md font-medium"
                whileTap={{ scale: 0.98 }}
              >
                <FaSignInAlt /> Zaloguj się
              </motion.a>
            </SignedOut>

            <motion.a
              href="/rules"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/6 transition font-medium"
              whileTap={{ scale: 0.98 }}
            >
              <FaBook /> Zasady
            </motion.a>
          </div>

          <div className="mt-6 text-xs text-gray-400 flex items-center gap-3">
            <FaGithub /> Repozytorium • <span className="ml-1">Next.js 15 • Tailwind • Framer Motion</span>
          </div>
        </motion.section>

        {/* Right: Team cards */}
        <motion.aside
          id="roles"
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="rounded-2xl bg-gradient-to-br from-black/40 to-slate-800/40 p-6 backdrop-blur-md shadow-lg flex flex-col gap-6"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Zespół</h2>
            <motion.div animate={{ rotate: [0, 6, -6, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
              <FaShip className="w-7 h-7 text-cyan-300/90" />
            </motion.div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <RoleCard
              name="Hubert Kaftan"
              role="Frontend"
              bullets={[
                "Next.js (src/app)",
                "UI/UX + Tailwind",
                "Framer Motion - animacje",
                "Integracja Clerk (frontend)",
              ]}
            />

            <RoleCard
              name="Jagoda Stępień"
              role="Backend"
              bullets={[
                "API routes (app/api)",
                "Baza danych - Supabase/Postgres",
                "Logika gry i walidacja",
                "Deploy na Vercel",
              ]}
            />
          </div>
        </motion.aside>

        {/* Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="col-span-full mt-4 rounded-2xl p-4 bg-white/3 backdrop-blur-sm text-gray-200"
        >
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <strong>Statki</strong> — starter projektu • Next.js 15
            </div>
            <div className="flex items-center gap-3">
              <a href="#" className="text-sm hover:underline">
                Dokumentacja
              </a>
              <a href="#" className="text-sm hover:underline">
                Zgłoś błąd
              </a>
            </div>
          </div>
        </motion.footer>
      </div>
    </main>
  );
}

/* User menu dropdown */
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

/* Role cards */
function RoleCard({ name, role, bullets }: { name: string; role: string; bullets: string[] }) {
  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 250 }}
      className="p-4 rounded-xl bg-gradient-to-r from-slate-900/60 to-slate-800/40 border border-white/6"
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
