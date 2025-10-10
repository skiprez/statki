
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useUser } from "@clerk/nextjs";
// import { motion } from "framer-motion";
import Link from "next/link";
import { FaArrowLeft, FaHashtag, FaRegCopy, FaUser } from "react-icons/fa";

// Main Rooms Page for listing/joining/creating game rooms
export default function RoomsPage() {
  const { user } = useUser();
  const router = useRouter();
  type Room = {
    id: string;
    player1: string;
    player2?: string;
    status: string;
    result?: string;
    [key: string]: unknown;
  };
  const [rooms, setRooms] = useState<Room[]>([]);
  // Holds stats and usernames for each player1
  const [playerStats, setPlayerStats] = useState<Record<string, { username: string; wins: number; losses: number }>>({});
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Fetch rooms (games waiting for player2) and player stats
  useEffect(() => {
    if (!user) return;
    const fetchRoomsAndStats = async () => {
      // Get all waiting rooms
      const { data } = await supabase
        .from("ships")
        .select("*")
        .eq("status", "waiting")
        .is("player2", null)
        .is("result", null);
      setRooms(data || []);

      // Get unique player1 ids
      const player1Ids = Array.from(new Set((data || []).map((r: Room) => r.player1).filter(Boolean)));
      if (player1Ids.length === 0) return;

      // Fetch usernames from our API route (logic from route.ts)
      let usernames: Record<string, string> = {};
      try {
        const res = await fetch("/api/usernames", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: player1Ids })
        });
        usernames = await res.json();
      } catch (e) {
        player1Ids.forEach(userId => {
          usernames[userId] = `Gracz_${userId.slice(0, 8)}`;
        });
      }

      // Fetch stats for each player1 (username, wins, losses)
      const stats: Record<string, { username: string; wins: number; losses: number }> = {};
      for (const pid of player1Ids) {
        // Count wins
        const { count: winCount } = await supabase
          .from("ships")
          .select("id", { count: "exact", head: true })
          .eq("result", pid);
        // Count losses
        const { count: lossCount } = await supabase
          .from("ships")
          .select("id", { count: "exact", head: true })
          .or(`player1.eq.${pid},player2.eq.${pid}`)
          .neq("result", pid)
          .not("result", "is", null);
        // Username from API route
        stats[pid] = { username: usernames[pid], wins: winCount || 0, losses: lossCount || 0 };
      }
      setPlayerStats(stats);
    };
    fetchRoomsAndStats();
    const interval = setInterval(fetchRoomsAndStats, 2000);
    return () => clearInterval(interval);
  }, [user]);

  // Polling for joined game: if user is in a ready game, redirect
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("ships")
        .select("*")
        .or(`player1.eq.${user.id},player2.eq.${user.id}`)
        .eq("status", "ready")
        .is("result", null)
        .limit(1)
        .single();
      if (data && data.id) {
        router.push(`/ships/${data.id}`);
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [user, router]);

  // Create a new room
  // Always set turn to player1 to avoid blank turn bug
  const handleCreateRoom = async () => {
    if (!user) return;
    setCreating(true);
    const { error } = await supabase
      .from("ships")
      .insert({ player1: user.id, status: "waiting", turn: "player1" })
      .select()
      .single();
    setCreating(false);
    if (error) {
      alert("Błąd przy tworzeniu pokoju: " + error.message);
    }
  };

  // Join a room as player2
  const handleJoinRoom = async (roomId: string) => {
    if (!user) return;
    setJoiningId(roomId);
    const { data: updated, error } = await supabase
      .from("ships")
      .update({ player2: user.id, status: "ready" })
      .eq("id", roomId)
      .select()
      .single();
    setJoiningId(null);
    if (updated && (updated as Room).id) {
      router.push(`/ships/${(updated as Room).id}`);
    }
    if (error) {
      alert("Błąd przy dołączaniu do pokoju: " + error.message);
    }
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent px-4 py-8 text-gray-100">
      {/* Back button above the card, not overlapping */}
      <div className="w-full max-w-6xl flex justify-end mb-2">
        <Link
          href="/"
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-cyan-500/80 hover:text-white transition font-semibold text-cyan-200 shadow z-20 mt-2 mr-2"
        >
          <FaArrowLeft /> Powrót
        </Link>
      </div>
      <div className="relative w-full max-w-6xl mx-auto rounded-2xl shadow-2xl border border-white/20 bg-black/30 backdrop-blur flex flex-col overflow-hidden mt-0">
        <div className="flex flex-col gap-8 md:gap-12 p-6 md:p-12">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-10 mt-2">
            <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow mb-4 md:mb-0 tracking-tight leading-tight">Lobby gry</h1>
            <button
              onClick={handleCreateRoom}
              disabled={creating}
              className={`px-4 py-2 rounded-2xl font-bold text-xl md:text-2xl shadow-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-400 hover:from-cyan-400 hover:to-blue-400 text-white transition-all duration-150 border-2 border-cyan-300 ${creating ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              {creating ? "Tworzenie..." : "Utwórz pokój"}
            </button>
          </div>
          <div className="flex flex-col gap-4">
            <h2 className="text-xl md:text-2xl font-semibold text-cyan-200 text-center md:text-left mb-2 md:mb-4 tracking-tight">Dostępne pokoje</h2>
            <div className="relative">
              {rooms.length === 0 && (
                <div className="text-gray-400 text-center text-lg py-12">Brak dostępnych pokoi. Utwórz nowy!</div>
              )}
              <div
                className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10${rooms.length > 6 ? ' scrollbar-theme' : ''}`}
                style={{
                  maxHeight: rooms.length > 6 ? '500px' : undefined,
                  overflowY: rooms.length > 6 ? 'auto' : undefined,
                  paddingRight: rooms.length > 6 ? '0.5rem' : undefined
                }}
              >
                {rooms.map((room) => {
                  const stats = playerStats[room.player1] || { username: room.player1, wins: 0, losses: 0 };
                  const displayName = stats.username;
                  // Copy room code to clipboard
                  const copyRoomId = () => {
                    navigator.clipboard.writeText(room.id);
                  };
                  return (
                    <div
                      key={room.id}
                      className="flex flex-col gap-3 items-stretch justify-between rounded-xl px-6 py-6 shadow-lg border border-white/10 bg-white/10 min-h-[170px] transition-all hover:scale-[1.025] hover:shadow-2xl relative"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-cyan-900/30 border border-cyan-400/20 text-cyan-200 text-xs font-semibold shadow-sm select-none">
                          <FaHashtag className="text-cyan-300 text-xs" />
                          <span className="font-mono">{room.id.slice(-5)}</span>
                        </span>
                        <button
                          onClick={copyRoomId}
                          title="Kopiuj ID pokoju"
                          className="ml-1 p-1 rounded-full hover:bg-cyan-700/30 text-cyan-300 transition"
                        >
                          <FaRegCopy size={14} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 text-cyan-100 text-base font-semibold mb-2">
                        <FaUser className="text-cyan-300" />
                        <span className="font-mono text-cyan-200">{displayName}</span>
                      </div>
                      <div className="flex gap-2 justify-center mb-2">
                        <span className="bg-green-700/60 text-green-200 px-2 py-1 rounded-lg font-bold text-xs">Wygrane: {stats.wins}</span>
                        <span className="bg-red-700/60 text-red-200 px-2 py-1 rounded-lg font-bold text-xs">Przegrane: {stats.losses}</span>
                      </div>
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={joiningId === room.id || room.player1 === user?.id}
                        className={`w-full mt-2 px-4 py-2 rounded-xl font-bold shadow bg-green-500 hover:bg-green-400 text-white transition-all duration-150 border-2 border-green-300 text-base ${joiningId === room.id || room.player1 === user?.id ? "opacity-60 cursor-not-allowed" : ""}`}
                      >
                        {room.player1 === user?.id ? "Oczekiwanie..." : (joiningId === room.id ? "Dołączanie..." : "Dołącz")}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <p className="mt-4 text-base text-gray-400 italic text-center">
            🏠 Utwórz pokój lub dołącz do istniejącego, aby rozpocząć grę.
          </p>
        </div>
      </div>
    </main>
  );
}
