
"use client";
// --- React and Next.js imports ---
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
// --- Animation library ---
import { motion } from "framer-motion";
// --- Supabase client ---
import { createClient, SupabaseClient } from "@supabase/supabase-js";


// --- Types and constants ---
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
  ready1: boolean | null;
  ready2: boolean | null;
  player1?: string;
  player2?: string;
  [key: string]: unknown;
};


export default function GamePage() {
  // --- State and refs ---
  // Win/Lose overlays
  const [youWin, setYouWin] = useState(false);
  const [youLose, setYouLose] = useState(false);
  // Next.js params and user
  const { id } = useParams();
  const { user } = useUser();
  // Game state
  const [game, setGame] = useState<Game | null>(null);
  const [playerBoard, setPlayerBoard] = useState<Cell[][]>([]);
  const [opponentBoard, setOpponentBoard] = useState<Cell[][]>([]);
  const [playerNum, setPlayerNum] = useState<1 | 2 | null>(null);
  // Placement phase state
  const [placementBoard, setPlacementBoard] = useState<Cell[][]>(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill("empty")));
  const [shipsToPlace] = useState<number[]>([5, 4, 3, 3, 2]);
  const [currentShipIdx, setCurrentShipIdx] = useState(0);
  const [orientation, setOrientation] = useState<'horizontal' | 'vertical'>('horizontal');
  // Timer for auto-placement
  const [timer, setTimer] = useState(150);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- Utility: check if all ships are sunk ---
  function allShipsSunk(board: Cell[][]) {
    return board.flat().filter(cell => cell === 'ship').length === 0;
  }

  // --- Polling: refresh board every 2s when it's not your turn ---
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

  // --- Timer effect for auto placement ---
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
  }, [timer, playerNum, game, handleAutoPlace]);

  // --- Assign player number based on user and game state ---
  useEffect(() => {
    if (!id || !user) return;
    const assignPlayer = async () => {
      const { data } = await supabase.from("games").select("*").eq("id", id).single();
      if (!data) return;
      if (data.player1 === user.id) { setPlayerNum(1); return; }
      if (data.player2 === user.id) { setPlayerNum(2); return; }
      if (!data.player1) { await supabase.from("games").update({ player1: user.id }).eq("id", id); setPlayerNum(1); return; }
      if (!data.player2) { await supabase.from("games").update({ player2: user.id }).eq("id", id); setPlayerNum(2); return; }
      setPlayerNum(null);
    };
    assignPlayer();
  }, [id, user]);

  // --- Check win/lose state and update overlays and result ---
  const checkWinLose = useCallback(async (g: Game) => {
    if (!playerNum) return;
    // If result is set, show win/lose overlays immediately for both players
    if (g.result) {
      if ((playerNum === 1 && g.result === g.player1) || (playerNum === 2 && g.result === g.player2)) {
        setYouWin(true); setYouLose(false);
      } else {
        setYouWin(false); setYouLose(true);
      }
      return;
    }
    // Otherwise, use board state
    if (playerNum === 1) {
      if (allShipsSunk(g.board2)) {
        setYouWin(true); setYouLose(false);
        if (!g.result) await supabase.from("games").update({ result: g.player1 }).eq("id", id);
      } else if (allShipsSunk(g.board1)) {
        setYouWin(false); setYouLose(true);
        if (!g.result) await supabase.from("games").update({ result: g.player2 }).eq("id", id);
      } else {
        setYouWin(false); setYouLose(false);
      }
    } else if (playerNum === 2) {
      if (allShipsSunk(g.board1)) {
        setYouWin(true); setYouLose(false);
        if (!g.result) await supabase.from("games").update({ result: g.player2 }).eq("id", id);
      } else if (allShipsSunk(g.board2)) {
        setYouWin(false); setYouLose(true);
        if (!g.result) await supabase.from("games").update({ result: g.player1 }).eq("id", id);
      } else {
        setYouWin(false); setYouLose(false);
      }
    }
  }, [playerNum, id]);

  useEffect(() => {
    if (!id || !playerNum) return;
    // Initial fetch
    const fetchGame = async () => {
      const { data } = await supabase.from("games").select("*").eq("id", id).single();
      if (data) {
        setGame(data);
        setPlayerBoard(playerNum === 1 ? data.board1 : data.board2);
        setOpponentBoard(playerNum === 1 ? data.board2 : data.board1);
        await checkWinLose(data);
      }
    };
    fetchGame();
    // Real-time updates: only update boards and turn
    const channel = supabase
      .channel(`game-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "games", filter: `id=eq.${id}` },
        async (payload) => {
          const g = payload.new as Game;
          setGame(g); // Update the whole game object for type safety
          setPlayerBoard(playerNum === 1 ? g.board1 : g.board2);
          setOpponentBoard(playerNum === 1 ? g.board2 : g.board1);
          await checkWinLose(g);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, playerNum, checkWinLose]);

  // --- Toggle ready state for placement phase ---
  const handleReadyToggle = async (nextReady: boolean) => {
    if (!playerNum) return;
    const boardKey = playerNum === 1 ? "board1" : "board2";
    const readyKey = playerNum === 1 ? "ready1" : "ready2";
    // If unreadying, set to null (empty); if readying, set to true
    const update: Record<string, unknown> = { [boardKey]: placementBoard, [readyKey]: nextReady ? true : null };
    await supabase.from("games").update(update).eq("id", id);
  };

  // --- Automatically place ships if timer runs out ---
  function handleAutoPlace() {
    (async () => {
      const autoBoard = randomPlaceShips();
      setPlacementBoard(autoBoard);
      const boardKey = playerNum === 1 ? "board1" : "board2";
      const readyKey = playerNum === 1 ? "ready1" : "ready2";
      await supabase.from("games").update({ [boardKey]: autoBoard, [readyKey]: true }).eq("id", id);
      // Force a state refresh for both players by updating a dummy field (to trigger realtime)
      await supabase.from("games").update({ updated_at: new Date().toISOString() }).eq("id", id);
    })();
  }

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
  }, [timer, playerNum, game, handleAutoPlace]);

  // --- Check if a ship can be placed at given coordinates ---
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

  // --- Place a ship on the placement board ---
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

  // --- Reset placement board to empty ---
  const resetPlacement = () => {
    setPlacementBoard(Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill("empty")));
    setCurrentShipIdx(0);
  };

  // --- Helpers for random ship placement (auto) ---
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


  // --- Get boards for rendering ---
  const getPlayerViewBoard = () => playerBoard;
  const getOpponentViewBoard = () => (opponentBoard || []).map(row => row.map(cell => (cell === 'hit' || cell === 'miss') ? cell : 'unknown'));


  // --- Handle shooting at opponent's board ---
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
    let winDetected = false;
    let winnerId = null;
    if (target === "empty") {
      oppBoard[y][x] = "miss";
      nextTurn = playerNum === 1 ? "player2" : "player1";
    } else if (target === "ship") {
      oppBoard[y][x] = "hit";
      // Check for win after hit
      const testBoard = oppBoard;
      if (allShipsSunk(testBoard)) {
        winDetected = true;
        winnerId = playerNum === 1 ? freshGame.player1 : freshGame.player2;
      }
      // nextTurn stays the same if hit
    } else {
      return;
    }
    // Prepare update
    const updateObj = {
      [opponentBoardKey]: oppBoard,
      turn: winDetected ? null : nextTurn
    };
    if (winDetected && winnerId && !freshGame.result) {
      updateObj["result"] = winnerId;
    }
    await supabase.from("games").update(updateObj).eq("id", id);
    // Force manual refresh after shooting
    const { data: updatedGame } = await supabase.from("games").select("*").eq("id", id).single();
    if (updatedGame) {
      setGame(updatedGame);
      setPlayerBoard(playerNum === 1 ? updatedGame.board1 : updatedGame.board2);
      setOpponentBoard(playerNum === 1 ? updatedGame.board2 : updatedGame.board1);
      // Immediately check win/lose after shooting
      if (typeof checkWinLose === 'function') {
        checkWinLose(updatedGame);
      }
    }
  };

  if (!game || !playerNum) return (
    <main className="min-h-screen flex items-center justify-center text-gray-100 bg-none p-2 sm:p-0">
      <div className="animate-pulse text-2xl sm:text-3xl font-extrabold tracking-tight bg-black/30 backdrop-blur-lg p-4 sm:p-8 rounded-2xl shadow-2xl border border-white/10 w-full max-w-xs sm:max-w-md text-center">
        Ładowanie gry...
      </div>
    </main>
  );

  const bothReady = game.ready1 && game.ready2;
  const iAmReady = (playerNum === 1 ? game.ready1 : game.ready2);
  const isMyTurn = game.turn === `player${playerNum}`;

  // Placement phase UI
  if (!bothReady) {
    // Placement UI/UX: modern glassy card, unified accent colors
    return (
      <main className="min-h-screen flex flex-col items-center justify-center text-gray-100 bg-none p-2 sm:p-6">
        <div className="max-w-3xl w-full flex flex-col items-center gap-6 sm:gap-8">
          {/* Stepper with icons */}
          <section className="w-full flex flex-col items-center mb-2">
            <h1 className="text-2xl xs:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow mb-3 sm:mb-4">Ustaw swoje statki</h1>
            <div className="flex flex-row gap-1 xs:gap-2 items-center mb-3 sm:mb-4 flex-wrap justify-center">
              {shipsToPlace.map((size, idx) => (
                <div key={idx} className={`flex items-center justify-center px-2 xs:px-3 py-1 rounded-lg text-base xs:text-lg font-extrabold border-2 transition-all duration-150 shadow-lg
                  ${idx < currentShipIdx ? 'bg-green-500 border-green-300 text-white' : ''}
                  ${idx === currentShipIdx ? 'bg-cyan-400 border-cyan-200 text-cyan-900 scale-110 ring-4 ring-cyan-300/60' : ''}
                  ${idx > currentShipIdx ? 'bg-gray-700 border-gray-600 text-cyan-200 opacity-60' : ''}
                `}>
                  <span className="drop-shadow-lg">🚢</span>
                  <span className="ml-1 font-mono">{size}</span>
                </div>
              ))}
            </div>
            <div className="mb-2 text-cyan-200 text-xs xs:text-sm">Pozostały czas: <span className="font-mono">{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}</span></div>
            <div className="flex gap-2 xs:gap-4 mb-3 sm:mb-4 flex-wrap justify-center">
              <button
                className={`px-3 xs:px-4 py-2 rounded-xl font-semibold shadow transition-all duration-150 border-2 border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${orientation === 'horizontal' ? 'bg-cyan-600 text-white scale-105' : 'bg-gray-700 text-cyan-200 hover:bg-cyan-800'}`}
                onClick={() => setOrientation('horizontal')}
              >Poziomo</button>
              <button
                className={`px-3 xs:px-4 py-2 rounded-xl font-semibold shadow transition-all duration-150 border-2 border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${orientation === 'vertical' ? 'bg-cyan-600 text-white scale-105' : 'bg-gray-700 text-cyan-200 hover:bg-cyan-800'}`}
                onClick={() => setOrientation('vertical')}
              >Pionowo</button>
              <button className="px-3 xs:px-4 py-2 rounded-xl font-semibold bg-gray-500 text-white hover:bg-gray-600 transition" onClick={resetPlacement}>Reset</button>
            </div>
            <button
              className={`w-full max-w-xs sm:max-w-fit px-6 sm:px-8 py-3 rounded-2xl font-bold text-base sm:text-lg shadow-xl transition-all duration-150 border-2 focus:outline-none focus:ring-2 focus:ring-cyan-400/50 ${iAmReady ? 'bg-red-600 border-red-400 text-white hover:bg-red-700' : 'bg-green-500 border-green-300 text-white hover:bg-green-600'} disabled:bg-gray-600 disabled:border-gray-400`}
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
            {iAmReady && <p className="mt-3 sm:mt-4 text-cyan-200 animate-pulse">Czekaj na drugiego gracza...</p>}
          </section>
          {/* Placement board with animated preview and glow */}
          <section className="rounded-2xl bg-black/30 backdrop-blur-lg p-3 xs:p-5 sm:p-8 shadow-2xl border border-white/10 flex flex-col items-center relative overflow-visible w-full max-w-xs xs:max-w-md sm:max-w-2xl mx-auto">
            <div className="mb-5 sm:mb-8 text-cyan-200 font-bold text-base xs:text-lg flex items-center gap-2 xs:gap-4 flex-wrap justify-center">
              <span>Aktualny statek:</span>
              <span className="bg-cyan-400 text-cyan-900 px-2 xs:px-3 py-1 rounded-lg shadow-lg text-lg xs:text-xl tracking-widest ring-4 ring-cyan-300/60">{shipsToPlace[currentShipIdx] || '-'}</span>
              <span className="text-xs font-normal">({orientation === 'horizontal' ? 'Poziomo' : 'Pionowo'})</span>
            </div>
            <div className="grid grid-cols-10 gap-0.5 xs:gap-1 mb-2 scale-100 xs:scale-110 relative">
              {placementBoard.map((row, y) =>
                row.map((cell, x) => (
                  <motion.div
                    key={`placement-${x}-${y}`}
                    className={`w-7 h-7 xs:w-8 xs:h-8 sm:w-10 sm:h-10 border-2 rounded-lg cursor-pointer flex items-center justify-center text-base xs:text-lg font-bold transition-all duration-100
                      ${cell === "empty" ? `bg-gray-700 border-gray-600 hover:bg-cyan-900` : 'bg-cyan-500 border-cyan-300 shadow-lg'}
                    `}
                    whileHover={{ scale: 1.13 }}
                    onClick={() => placeShip(x, y)}
                  />
                ))
              )}
            </div>
            <div className="text-xs text-gray-400 mt-4 sm:mt-6">Kliknij, aby ustawić statek. <span className="text-cyan-300 font-bold">{orientation === 'horizontal' ? '← poziomo' : '↓ pionowo'}</span></div>
          </section>
        </div>
      </main>
    );
  }

  // Main game UI
  return (
    <main className="min-h-screen text-gray-100 flex items-center justify-center bg-none p-2 sm:p-6">
      <div className="max-w-5xl w-full flex flex-col items-center gap-5 sm:gap-8">
        {/* Status and controls above */}
        <section className="w-full flex flex-col items-center mb-2">
          <h1 className="text-2xl xs:text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow mb-2">Bitwa Morska #{id}</h1>
          <div className={`px-4 sm:px-6 py-2 sm:py-3 rounded-2xl font-bold text-base sm:text-lg shadow-xl border-2 transition-all duration-200 mb-2
            ${isMyTurn ? 'bg-green-600 border-green-400 text-white animate-pulse' : 'bg-gray-700 border-gray-500 text-cyan-200'}`}
          >
            {isMyTurn ? 'Twoja tura!' : 'Czekaj na przeciwnika...'}
          </div>
          <div className="text-xs text-gray-400">Gracz: <span className="font-mono">{playerNum}</span></div>
        </section>
        {/* Boards side by side or stacked */}
        <section className="flex flex-col md:flex-row gap-4 sm:gap-8 w-full items-center justify-center">
          {/* Player board */}
          <div className="flex flex-col items-center rounded-2xl bg-black/30 backdrop-blur-lg p-2 xs:p-4 sm:p-6 shadow-2xl border border-white/10 w-full max-w-xs xs:max-w-md sm:max-w-lg md:max-w-none">
            <h2 className="text-base xs:text-lg font-bold text-cyan-200 mb-1 xs:mb-2">Twoja plansza</h2>
            <div className="grid grid-cols-10 gap-0.5 xs:gap-1 bg-gray-800/80 p-1 xs:p-2 rounded-xl shadow-lg">
              {(getPlayerViewBoard() || []).map((row, y) =>
                (row || []).map((cell, x) => (
                  <motion.div
                    key={`player-${x}-${y}`}
                    className={`w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 border-2 rounded-md text-xs xs:text-base md:text-lg flex items-center justify-center font-bold transition-all duration-100
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
            <div className="mt-1 xs:mt-2 text-xs text-gray-400">Twoje statki i trafienia przeciwnika</div>
          </div>
          {/* Opponent board */}
          <div className="flex flex-col items-center rounded-2xl bg-black/30 backdrop-blur-lg p-2 xs:p-4 sm:p-6 shadow-2xl border border-white/10 w-full max-w-xs xs:max-w-md sm:max-w-lg md:max-w-none">
            <h2 className="text-base xs:text-lg font-bold text-cyan-200 mb-1 xs:mb-2">Plansza przeciwnika</h2>
            <div className="grid grid-cols-10 gap-0.5 xs:gap-1 bg-gray-800/80 p-1 xs:p-2 rounded-xl shadow-lg">
              {(getOpponentViewBoard() || []).map((row, y) =>
                (row || []).map((cell, x) => (
                  <motion.div
                    key={`opponent-${x}-${y}`}
                    className={`w-6 h-6 xs:w-8 xs:h-8 sm:w-10 sm:h-10 border-2 rounded-md cursor-pointer text-xs xs:text-base md:text-lg flex items-center justify-center font-bold transition-all duration-100
                      ${cell === "unknown" ? "bg-gray-700 border-gray-600 hover:bg-cyan-900" : ""}
                      ${cell === "hit" ? "bg-red-500 border-red-300" : ""}
                      ${cell === "miss" ? "bg-white/50 border-gray-300 text-gray-700" : ""}
                      ${isMyTurn && cell === 'unknown' ? 'hover:scale-110 hover:shadow-xl' : ''}
                    `}
                    whileHover={cell === 'unknown' && isMyTurn ? { scale: 1.13 } : {}}
                    onClick={() => {
                      if (cell === 'unknown' && isMyTurn && !youWin && !youLose) shoot(x, y);
                    }}
                  >
                    {cell === 'hit' ? '✕' : cell === 'miss' ? '•' : ''}
                  </motion.div>
                ))
              )}
            </div>
            <div className="mt-1 xs:mt-2 text-xs text-gray-400">Twoje strzały</div>
          </div>
        </section>
        {/* Overlays centered over game area */}
        <section className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-50 p-2 xs:p-0">
          {!isMyTurn && !youWin && !youLose && (
            <div className="bg-black/80 backdrop-blur-lg px-4 xs:px-8 py-4 xs:py-6 rounded-2xl shadow-2xl border-4 border-cyan-700 animate-fade-in text-center w-full max-w-xs xs:max-w-md sm:max-w-lg">
              <div className="text-lg xs:text-2xl font-bold text-cyan-200 mb-2">Czekaj na ruch przeciwnika...</div>
              <div className="text-base xs:text-lg text-gray-300">Plansza odświeża się automatycznie</div>
            </div>
          )}
          {youWin && (
            <div className="bg-gradient-to-br from-green-700 via-cyan-900 to-green-900 px-6 xs:px-12 py-6 xs:py-10 rounded-3xl shadow-2xl border-4 border-green-400 text-center animate-fade-in w-full max-w-xs xs:max-w-md sm:max-w-lg">
              <div className="text-2xl xs:text-4xl font-extrabold text-green-200 mb-3 xs:mb-4 drop-shadow">Wygrałeś!</div>
              <div className="text-base xs:text-lg text-cyan-100 mb-4 xs:mb-6">Wszystkie statki przeciwnika zostały zatopione.</div>
              <button className="px-6 xs:px-8 py-3 rounded-2xl font-bold text-base xs:text-lg shadow-lg bg-green-600 hover:bg-green-700 text-white transition-all duration-150 mt-2 pointer-events-auto" onClick={() => window.location.href = '/'}>
                Wróć do lobby
              </button>
            </div>
          )}
          {youLose && (
            <div className="bg-gradient-to-br from-red-700 via-cyan-900 to-red-900 px-6 xs:px-12 py-6 xs:py-10 rounded-3xl shadow-2xl border-4 border-red-400 text-center animate-fade-in w-full max-w-xs xs:max-w-md sm:max-w-lg">
              <div className="text-2xl xs:text-4xl font-extrabold text-red-200 mb-3 xs:mb-4 drop-shadow">Przegrałeś!</div>
              <div className="text-base xs:text-lg text-cyan-100 mb-4 xs:mb-6">Wszystkie twoje statki zostały zatopione.</div>
              <button className="px-6 xs:px-8 py-3 rounded-2xl font-bold text-base xs:text-lg shadow-lg bg-red-600 hover:bg-red-700 text-white transition-all duration-150 mt-2 pointer-events-auto" onClick={() => window.location.href = '/'}>
                Wróć do lobby
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
