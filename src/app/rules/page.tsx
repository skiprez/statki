"use client";

import { motion } from "framer-motion";
import { FaBook, FaBackspace } from "react-icons/fa";

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-8 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl w-full rounded-3xl bg-black/50 p-10 shadow-2xl backdrop-blur-xl border border-gray-700/40"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="p-3 rounded-xl bg-cyan-500/20">
            <FaBook className="w-8 h-8 text-cyan-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Zasady gry w Statki
          </h1>
        </div>

        {/* Rules */}
        <ol className="space-y-5 text-gray-200 leading-relaxed">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
              1
            </span>
            <span>Każdy gracz rozmieszcza swoje statki na planszy 10x10.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
              2
            </span>
            <span>Statki mogą być ustawiane tylko poziomo lub pionowo.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
              3
            </span>
            <span>Gracze na zmianę „strzelają” w pole przeciwnika.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
              4
            </span>
            <span>
              Trafienie statku oznacza, że gracz może strzelać dalej, pudło – zmiana
              tury.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold">
              5
            </span>
            <span>
              Gra kończy się, gdy wszystkie statki jednego gracza zostaną zatopione.
            </span>
          </li>
        </ol>

        {/* Footer note */}
        <p className="mt-8 text-sm text-gray-400 text-center italic">
          🎮 Graj online – dołącz do rozgrywki i sprawdź swoje umiejętności!
        </p>

        {/* Back button */}
        <div className="mt-8 flex justify-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-gray-700 bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-medium shadow-md hover:from-cyan-500 hover:to-cyan-400 transition"
          >
            <FaBackspace className="w-4 h-4" />
            <span>Powrót</span>
          </a>
        </div>
      </motion.div>
    </main>
  );
}
