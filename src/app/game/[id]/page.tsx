// ...existing code up to the final return statement of the main GamePage component...
"use client";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState, useRef } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { motion } from "framer-motion";

type Cell = "empty" | "ship" | "hit" | "miss";
const BOARD_SIZE = 10;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

type Game = {
  id: string;
  board1: Cell[][];
  board2: Cell[][];
  turn: "player1" | "player2";
  ready1: boolean;
  ready2: boolean;
  [key: string]: any;
};

export default function GamePage() {
  // Helper: check if all ships are hit
  function allShipsSunk(board: Cell[][]) {
    return board.flat().filter(cell => cell === 'ship').length === 0;
  }

  const { id } = useParams();
  const { user } = useUser();
  const [game, setGame] = useState<Game | null>(null);
  const [playerBoard, setPlayerBoard] = useState<Cell[][]>([]);
  const [opponentBoard, setOpponentBoard] = useState<Cell[][]>([]);
  const [playerNum, setPlayerNum] = useState<1 | 2 | null>(null);
  const [placementBoard, setPlacementBoard] = useState<Cell[][]>(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill("empty")));
  const [shipsToPlace] = useState<number[]>([5, 4, 3, 3, 2]);
  const [currentShipIdx, setCurrentShipIdx] = useState(0);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  const [timer, setTimer] = useState(180);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  // Removed shooting state for instant UI

  // Polling: refresh board every 2s when it's not your turn
    useEffect(() => {
      if (!id || !playerNum || !game) return;
      const isMyTurn = game.turn === `player${playerNum}`;
      let interval: NodeJS.Timeout | null = null;
      if (!isMyTurn) {
        interval = setInterval(async () => {
          const { data: updatedGame } = await supabase.from("games").select("*").eq("id", id).single();
          if (updatedGame) {
            setGame(updatedGame);
            setPlayerBoard(playerNum === 1 ? updatedGame.board1 : updatedGame.board2);
            setOpponentBoard(playerNum === 1 ? updatedGame.board2 : updatedGame.board1);
          }
        }, 2000);
      }
      return () => {
        if (interval) clearInterval(interval);
      };
    }, [id, playerNum, game]);

  useEffect(() => {
    if (!playerNum || !game) return;
    const iAmReady = (playerNum === 1 ? game.ready1 : game.ready2);
    if (iAmReady) return;
    if (timer <= 0) {
      handleAutoPlace();
      return;
    }
    timerRef.current = setTimeout(() => setTimer(timer - 1), 1000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timer, playerNum, game]);

  useEffect(() => {
    if (!id || !user) return;
    const assignPlayer = async () => {
      const { data } = await supabase.from("games").select("*").eq("id", id).single();
      if (!data) return;
      // If user is already assigned
      if (data.player1 === user.id) {
        setPlayerNum(1);
        return;
      }
      if (data.player2 === user.id) {
        setPlayerNum(2);
        return;
      }
      // If slot is empty, assign user to it
      if (!data.player1) {
        await supabase.from("games").update({ player1: user.id }).eq("id", id);
        setPlayerNum(1);
        return;
      }
      if (!data.player2) {
        await supabase.from("games").update({ player2: user.id }).eq("id", id);
        setPlayerNum(2);
        return;
      }
      // Otherwise, not a player
      setPlayerNum(null);
    };
    assignPlayer();
  }, [id, user]);

  useEffect(() => {
    if (!id || !playerNum) return;
    // Initial fetch
    const fetchGame = async () => {
      const { data } = await supabase.from("games").select("*").eq("id", id).single();
      if (data) {
        setGame(data);
        setPlayerBoard(playerNum === 1 ? data.board1 : data.board2);
        setOpponentBoard(playerNum === 1 ? data.board2 : data.board1);
      }
    };
    fetchGame();
    // Real-time updates: only update boards and turn
    const channel = supabase
      .channel(`game-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${id}` },
        (payload) => {
          const g = payload.new as Game;
          setGame(g); // Update the whole game object for type safety
          setPlayerBoard(playerNum === 1 ? g.board1 : g.board2);
          setOpponentBoard(playerNum === 1 ? g.board2 : g.board1);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, playerNum]);

  const handleReadyToggle = async (nextReady: boolean) => {
  if (!playerNum) return;
  const boardKey = playerNum === 1 ? "board1" : "board2";
  const readyKey = playerNum === 1 ? "ready1" : "ready2";
  // If unreadying, set to null (empty); if readying, set to true
  const update: any = { [boardKey]: placementBoard, [readyKey]: nextReady ? true : null };
  await supabase.from("games").update(update).eq("id", id);
  };

  const handleAutoPlace = async () => {
    const autoBoard = randomPlaceShips();
    setPlacementBoard(autoBoard);
    const boardKey = playerNum === 1 ? "board1" : "board2";
    const readyKey = playerNum === 1 ? "ready1" : "ready2";
    await supabase.from("games").update({ [boardKey]: autoBoard, [readyKey]: true }).eq("id", id);
  };

  const canPlaceShip = (x: number, y: number, size: number, orientation: 'horizontal' | 'vertical') => {
    if (orientation === 'horizontal') {
      if (x + size > BOARD_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (placementBoard[y][x + i] !== 'empty') return false;
      }
    } else {
      if (y + size > BOARD_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (placementBoard[y + i][x] !== 'empty') return false;
      }
    }
    return true;
  };

  const placeShip = (x: number, y: number) => {
    if (currentShipIdx >= shipsToPlace.length) return;
    const size = shipsToPlace[currentShipIdx];
    if (!canPlaceShip(x, y, size, orientation)) return;
    const newBoard = placementBoard.map(row => [...row]);
    if (orientation === 'horizontal') {
      for (let i = 0; i < size; i++) {
        newBoard[y][x + i] = 'ship';
      }
    } else {
      for (let i = 0; i < size; i++) {
        newBoard[y + i][x] = 'ship';
      }
    }
    setPlacementBoard(newBoard);
    setCurrentShipIdx(currentShipIdx + 1);
  };

  const resetPlacement = () => {
    setPlacementBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill("empty")));
    setCurrentShipIdx(0);
  };

  function getRandomInt(max: number) {
    return Math.floor(Math.random() * max);
  }

  function randomPlaceShips(): Cell[][] {
    const board: Cell[][] = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill("empty"));
    const ships = [...shipsToPlace];
    for (let s = 0; s < ships.length; s++) {
      let placed = false;
      let attempts = 0;
      while (!placed && attempts < 100) {
        const orientation = getRandomInt(2) === 0 ? 'horizontal' : 'vertical';
        const x = getRandomInt(BOARD_SIZE);
        const y = getRandomInt(BOARD_SIZE);
        if (canPlaceShipRandom(board, x, y, ships[s], orientation)) {
          if (orientation === 'horizontal') {
            for (let i = 0; i < ships[s]; i++) board[y][x + i] = 'ship';
          } else {
            for (let i = 0; i < ships[s]; i++) board[y + i][x] = 'ship';
          }
          placed = true;
        }
        attempts++;
      }
    }
    return board;
  }

  function canPlaceShipRandom(board: Cell[][], x: number, y: number, size: number, orientation: 'horizontal' | 'vertical') {
    if (orientation === 'horizontal') {
      if (x + size > BOARD_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (board[y][x + i] !== 'empty') return false;
      }
    } else {
      if (y + size > BOARD_SIZE) return false;
      for (let i = 0; i < size; i++) {
        if (board[y + i][x] !== 'empty') return false;
      }
    }
    return true;
  }

  const getPlayerViewBoard = () => {
    return playerBoard;
  };

  const getOpponentViewBoard = () => {
    return (opponentBoard || []).map(row => row.map(cell => (cell === 'hit' || cell === 'miss') ? cell : 'unknown'));
  };

  const shoot = async (x: number, y: number) => {
    if (!game) return;
    if ((playerNum === 1 && game.turn !== "player1") || (playerNum === 2 && game.turn !== "player2")) return;
    // Always fetch the latest game state
    const { data: freshGame } = await supabase.from("games").select("*").eq("id", id).single();
    if (!freshGame) return;
    const opponentBoardKey = playerNum === 1 ? "board2" : "board1";
    const oppBoard = JSON.parse(JSON.stringify(freshGame[opponentBoardKey]));
    const target = oppBoard[y][x];
    let nextTurn = freshGame.turn;
    if (target === "empty") {
      oppBoard[y][x] = "miss";
      nextTurn = playerNum === 1 ? "player2" : "player1";
    } else if (target === "ship") {
      oppBoard[y][x] = "hit";
      // nextTurn stays the same
    } else {
      return;
    }
    await supabase.from("games").update({
      [opponentBoardKey]: oppBoard,
      turn: nextTurn
    }).eq("id", id);
    // Force manual refresh after shooting
    const { data: updatedGame } = await supabase.from("games").select("*").eq("id", id).single();
    if (updatedGame) {
      setGame(updatedGame);
      setPlayerBoard(playerNum === 1 ? updatedGame.board1 : updatedGame.board2);
      setOpponentBoard(playerNum === 1 ? updatedGame.board2 : updatedGame.board1);
    }
  };

  // No shooting state needed

  if (!game || !playerNum) return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100">
      <div className="animate-pulse text-3xl font-extrabold tracking-tight bg-gradient-to-br from-slate-800/60 to-black/50 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
        Ładowanie gry...
      </div>
    </main>
  );

  const bothReady = game.ready1 && game.ready2;
  const iAmReady = (playerNum === 1 ? game.ready1 : game.ready2);
  const isMyTurn = game.turn === `player${playerNum}`;

  // Win/Lose detection
  const youWin = bothReady && allShipsSunk(playerNum === 1 ? game.board2 : game.board1);
  const youLose = bothReady && allShipsSunk(playerNum === 1 ? game.board1 : game.board2);

  // Placement phase UI
  if (!bothReady) {
    // Placement UI/UX: visually stunning, no mechanic changes, no pulsing background
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 p-6">
        <div className="max-w-3xl w-full flex flex-col items-center gap-8">
          {/* Stepper with icons */}
          <section className="w-full flex flex-col items-center mb-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-cyan-300 drop-shadow mb-4">Ustaw swoje statki</h1>
            <div className="flex flex-row gap-2 items-center mb-4">
              {shipsToPlace.map((size, idx) => (
                <div key={idx} className={`flex items-center justify-center px-3 py-1 rounded-lg text-lg font-extrabold border-2 transition-all duration-150 shadow-lg
                  ${idx < currentShipIdx ? 'bg-green-500 border-green-300 text-white' : ''}
                  ${idx === currentShipIdx ? 'bg-cyan-400 border-cyan-200 text-cyan-900 scale-110 ring-4 ring-cyan-300/60' : ''}
                  ${idx > currentShipIdx ? 'bg-gray-700 border-gray-600 text-cyan-200 opacity-60' : ''}
                `}>
                  <span className="drop-shadow-lg">🚢</span>
                  <span className="ml-1 font-mono">{size}</span>
                </div>
              ))}
            </div>
            <div className="mb-2 text-cyan-200 text-sm">Pozostały czas: <span className="font-mono">{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</span></div>
            <div className="flex gap-4 mb-4">
              <button
                className={`px-4 py-2 rounded-xl font-semibold shadow transition-all duration-150 border-2 border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${orientation === 'horizontal' ? 'bg-cyan-600 text-white scale-105' : 'bg-gray-700 text-cyan-200 hover:bg-cyan-800'}`}
                onClick={() => setOrientation('horizontal')}
              >Poziomo</button>
              <button
                className={`px-4 py-2 rounded-xl font-semibold shadow transition-all duration-150 border-2 border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${orientation === 'vertical' ? 'bg-cyan-600 text-white scale-105' : 'bg-gray-700 text-cyan-200 hover:bg-cyan-800'}`}
                onClick={() => setOrientation('vertical')}
              >Pionowo</button>
              <button className="px-4 py-2 rounded-xl font-semibold bg-gray-500 text-white hover:bg-gray-600 transition" onClick={resetPlacement}>Reset</button>
            </div>
            <button
              className={`px-8 py-3 rounded-xl font-bold text-lg shadow-lg transition-all duration-150 border-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${iAmReady ? 'bg-red-600 border-red-400 text-white hover:bg-red-700' : 'bg-green-500 border-green-300 text-white hover:bg-green-600'} disabled:bg-gray-600 disabled:border-gray-400`}
              disabled={currentShipIdx < shipsToPlace.length}
              onClick={async () => {
                if (!iAmReady && game && ((playerNum === 1 && game.ready2) || (playerNum === 2 && game.ready1))) {
                  await handleReadyToggle(true);
                  await supabase.from("games").update({ turn: 'player1' }).eq("id", id);
                } else {
                  await handleReadyToggle(!iAmReady);
                }
                // Always fetch latest game state after toggling ready
                const { data: updatedGame } = await supabase.from("games").select("*").eq("id", id).single();
                if (updatedGame) {
                  setGame(updatedGame);
                  setPlayerBoard(playerNum === 1 ? updatedGame.board1 : updatedGame.board2);
                  setOpponentBoard(playerNum === 1 ? updatedGame.board2 : updatedGame.board1);
                }
              }}
            >{iAmReady ? 'Cofnij gotowość' : 'Gotowe'}</button>
            {iAmReady && <p className="mt-4 text-cyan-200 animate-pulse">Czekaj na drugiego gracza...</p>}
          </section>
          {/* Placement board with animated preview and glow */}
          <section className="rounded-2xl bg-gradient-to-br from-black/40 to-slate-800/40 p-8 backdrop-blur-md shadow-2xl flex flex-col items-center relative overflow-visible">
            <div className="mb-8 text-cyan-200 font-bold text-lg flex items-center gap-4">
              <span>Aktualny statek:</span>
              <span className="bg-cyan-400 text-cyan-900 px-3 py-1 rounded-lg shadow-lg text-xl tracking-widest ring-4 ring-cyan-300/60">{shipsToPlace[currentShipIdx] || '-'}</span>
              <span className="text-xs font-normal">({orientation === 'horizontal' ? 'Poziomo' : 'Pionowo'})</span>
            </div>
            <div className="grid grid-cols-10 gap-1 mb-2 scale-110 relative">
              {placementBoard.map((row, y) =>
                row.map((cell, x) => {
                  // Ship preview highlight
                  let preview = false;
                  if (currentShipIdx < shipsToPlace.length && canPlaceShip(x, y, shipsToPlace[currentShipIdx], orientation)) {
                    preview = true;
                  }
                  return (
                    <motion.div
                      key={`placement-${x}-${y}`}
                      className={`w-10 h-10 border-2 rounded-lg cursor-pointer flex items-center justify-center text-lg font-bold transition-all duration-100
                        ${cell === "empty" ? `bg-gray-700 border-gray-600 hover:bg-cyan-900` : 'bg-cyan-500 border-cyan-300 shadow-lg'}
                      `}
                      whileHover={{ scale: 1.13 }}
                      onClick={() => placeShip(x, y)}
                    />
                  );
                })
              )}
            </div>
            <div className="text-xs text-gray-400 mt-6">Kliknij, aby ustawić statek. <span className="text-cyan-300 font-bold">{orientation === 'horizontal' ? '← poziomo' : '↓ pionowo'}</span></div>
          </section>
        </div>
      </main>
    );
  }

  // Main game UI
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-5xl w-full flex flex-col items-center gap-8">
        {/* Status and controls above */}
        <section className="w-full flex flex-col items-center mb-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-cyan-300 drop-shadow mb-2">Bitwa Morska #{id}</h1>
          <div className={`px-6 py-3 rounded-xl font-bold text-lg shadow-lg border-2 transition-all duration-200 mb-2
            ${isMyTurn ? 'bg-green-600 border-green-400 text-white animate-pulse' : 'bg-gray-700 border-gray-500 text-cyan-200'}`}
          >
            {isMyTurn ? 'Twoja tura!' : 'Czekaj na przeciwnika...'}
          </div>
          <div className="text-xs text-gray-400">Gracz: <span className="font-mono">{playerNum}</span></div>
        </section>
        {/* Boards side by side */}
        <section className="flex flex-row gap-8 w-full items-center justify-center">
          {/* Player board */}
          <div className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-slate-800/60 to-black/50 p-6 backdrop-blur-md shadow-2xl">
            <h2 className="text-lg font-bold text-cyan-200 mb-2">Twoja plansza</h2>
            <div className="grid grid-cols-10 gap-1 bg-gray-800/80 p-2 rounded-xl shadow-lg">
              {(getPlayerViewBoard() || []).map((row, y) =>
                (row || []).map((cell, x) => (
                  <motion.div
                    key={`player-${x}-${y}`}
                    className={`w-8 h-8 md:w-10 md:h-10 border-2 rounded-md text-base md:text-lg flex items-center justify-center font-bold transition-all duration-100
                      ${cell === "empty" ? "bg-gray-700 border-gray-600" : ""}
                      ${cell === "ship" ? "bg-cyan-700 border-cyan-400" : ""}
                      ${cell === "hit" ? "bg-red-500 border-red-300" : ""} 
                      ${cell === "miss" ? "bg-white/50 border-gray-300 text-gray-700" : ""}
                    `}
                  >
                    {cell === 'hit' ? '✕' : cell === 'miss' ? '•' : ''}
                  </motion.div>
                ))
              )}
            </div>
            <div className="mt-2 text-xs text-gray-400">Twoje statki i trafienia przeciwnika</div>
          </div>
          {/* Opponent board */}
          <div className="flex flex-col items-center rounded-2xl bg-gradient-to-br from-black/40 to-slate-800/40 p-6 backdrop-blur-md shadow-2xl">
            <h2 className="text-lg font-bold text-cyan-200 mb-2">Plansza przeciwnika</h2>
            <div className="grid grid-cols-10 gap-1 bg-gray-800/80 p-2 rounded-xl shadow-lg">
              {(getOpponentViewBoard() || []).map((row, y) =>
                (row || []).map((cell, x) => (
                  <motion.div
                    key={`opponent-${x}-${y}`}
                    className={`w-8 h-8 md:w-10 md:h-10 border-2 rounded-md cursor-pointer text-base md:text-lg flex items-center justify-center font-bold transition-all duration-100
                      ${cell === "unknown" ? "bg-gray-700 border-gray-600 hover:bg-cyan-900" : ""}
                      ${cell === "hit" ? "bg-red-500 border-red-300" : ""}
                      ${cell === "miss" ? "bg-white/50 border-gray-300 text-gray-700" : ""}
                      ${isMyTurn && cell === 'unknown' ? 'hover:scale-110 hover:shadow-xl' : ''}
                    `}
                    whileHover={cell === 'unknown' && isMyTurn ? { scale: 1.13 } : {}}
                    onClick={() => {
                      if (cell === 'unknown' && isMyTurn) shoot(x, y);
                    }}
                  >
                    {cell === 'hit' ? '✕' : cell === 'miss' ? '•' : ''}
                  </motion.div>
                ))
              )}
            </div>
            <div className="mt-2 text-xs text-gray-400">Twoje strzały</div>
          </div>
        </section>
        {/* Overlays centered over game area */}
        <section className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-50">
          {!isMyTurn && !youWin && !youLose && (
            <div className="bg-gray-900/90 px-8 py-6 rounded-2xl shadow-2xl border-4 border-cyan-700 animate-fade-in text-center">
              <div className="text-2xl font-bold text-cyan-200 mb-2">Czekaj na ruch przeciwnika...</div>
              <div className="text-lg text-gray-300">Plansza odświeża się automatycznie</div>
            </div>
          )}
          {youWin && (
            <div className="bg-gradient-to-br from-green-700 via-cyan-900 to-green-900 px-12 py-10 rounded-3xl shadow-2xl border-4 border-green-400 text-center animate-fade-in">
              <div className="text-4xl font-extrabold text-green-200 mb-4 drop-shadow">Wygrałeś!</div>
              <div className="text-lg text-cyan-100 mb-6">Wszystkie statki przeciwnika zostały zatopione.</div>
              <button className="px-8 py-3 rounded-xl font-bold text-lg shadow-lg bg-green-600 hover:bg-green-700 text-white transition-all duration-150 mt-2 pointer-events-auto" onClick={() => window.location.href = '/'}>
                Wróć do lobby
              </button>
            </div>
          )}
          {youLose && (
            <div className="bg-gradient-to-br from-red-700 via-cyan-900 to-red-900 px-12 py-10 rounded-3xl shadow-2xl border-4 border-red-400 text-center animate-fade-in">
              <div className="text-4xl font-extrabold text-red-200 mb-4 drop-shadow">Przegrałeś!</div>
              <div className="text-lg text-cyan-100 mb-6">Wszystkie twoje statki zostały zatopione.</div>
              <button className="px-8 py-3 rounded-xl font-bold text-lg shadow-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-150 mt-2 pointer-events-auto" onClick={() => window.location.href = '/'}>
                Wróć do lobby
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
