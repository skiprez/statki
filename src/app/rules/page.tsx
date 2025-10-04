"use client";

import { motion } from "framer-motion";
import { FaBook, FaBackspace } from "react-icons/fa";
import Link from "next/link";

export default function RulesPage() {
  return (
    <main className="min-h-screen text-gray-100 flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-2xl rounded-2xl p-8 shadow-xl border border-white/10 bg-black/30 backdrop-blur-md"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="flex items-center gap-3">
            <span className="p-3 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <FaBook className="w-8 h-8 text-cyan-400" />
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg">
              Zasady gry w Statki
            </h1>
          </div>
          <p className="text-base text-gray-300 mt-2 text-center max-w-xl">
            Poznaj zasady gry, zanim dołączysz do rozgrywki online. Proste reguły, szybka zabawa!
          </p>
        </div>

        {/* Rules */}
        <ol className="space-y-5 text-gray-200 leading-relaxed">
          <li className="flex items-start gap-3">
            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-lg shadow">
              1
            </span>
            <span>Każdy gracz rozmieszcza swoje statki na planszy <span className="font-bold text-cyan-300">10x10</span>.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-lg shadow">
              2
            </span>
            <span>Statki mogą być ustawiane tylko <span className="font-bold text-cyan-300">poziomo</span> lub <span className="font-bold text-cyan-300">pionowo</span>.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-lg shadow">
              3
            </span>
            <span>Gracze na zmianę <span className="font-bold text-cyan-300">„strzelają”</span> w pole przeciwnika.</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-lg shadow">
              4
            </span>
            <span>
              Trafienie statku oznacza, że gracz może strzelać dalej, <span className="font-bold text-cyan-300">pudło</span> – zmiana tury.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-7 h-7 flex items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-lg shadow">
              5
            </span>
            <span>
              Gra kończy się, gdy <span className="font-bold text-cyan-300">wszystkie statki</span> jednego gracza zostaną zatopione.
            </span>
          </li>
        </ol>

        {/* Footer note */}
        <p className="mt-8 text-sm text-gray-400 text-center italic">
          🎮 Graj online – dołącz do rozgrywki i sprawdź swoje umiejętności!
        </p>

        {/* Back button */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl border border-cyan-700 bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg transition text-base"
          >
            <FaBackspace className="w-5 h-5" />
            <span>Powrót</span>
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
