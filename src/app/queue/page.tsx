"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
import { motion } from "framer-motion";

export default function QueuePage() {
  const { user } = useUser();
  const router = useRouter();
  const [status, setStatus] = useState("Dołączanie do kolejki...");
  const [gameId, setGameId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const joinQueue = async () => {
      // sprawdź czy istnieje gra oczekująca
      const { data: waitingGame } = await supabase
        .from("games")
        .select("*")
        .eq("status", "waiting")
        .is("player2", null)
        .limit(1)
        .single();

      if (waitingGame) {
        // dołącz jako player2
        const { data: updated } = await supabase
          .from("games")
          .update({ player2: user.id, status: "ready" })
          .eq("id", waitingGame.id)
          .select()
          .single();

        setGameId(updated?.id || null);
        setStatus("Połączono z graczem, rozpoczynanie gry...");
      } else {
        // utwórz nową grę jako player1
        const { data: created } = await supabase
          .from("games")
          .insert({ player1: user.id, status: "waiting" })
          .select()
          .single();

        setGameId(created?.id || null);
        setStatus("Czekasz na drugiego gracza...");
      }
    };

    joinQueue();
  }, [user]);

  // Polling co 2 sekundy do sprawdzania statusu gry
  useEffect(() => {
    if (!gameId) return;

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("games")
        .select("*")
        .eq("id", gameId)
        .single();

      if (data?.status === "ready" && data?.player2) {
        router.push(`/game/${gameId}`);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [gameId, router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="p-8 rounded-2xl bg-black/50 backdrop-blur-xl shadow-2xl text-center max-w-md w-full border border-gray-700/50"
      >
        {/* nagłówek */}
        <motion.h1
          className="text-3xl font-extrabold mb-6 text-cyan-400 drop-shadow"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, repeat: Infinity, repeatType: "reverse" }}
        >
          Kolejka
        </motion.h1>

        {/* spinner */}
        <motion.div
          className="mx-auto mb-6 w-14 h-14 border-4 border-cyan-400/40 border-t-cyan-400 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
        />

        {/* status */}
        <p className="text-gray-300 text-lg font-medium">{status}</p>

        {/* mały hint na dole */}
        <p className="mt-6 text-xs text-gray-500 italic">
          ⏳ System dobiera przeciwnika...  
          <br /> Nie zamykaj tej strony.
        </p>
      </motion.div>
    </main>
  );
}
