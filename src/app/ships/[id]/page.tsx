"use client";
import Link from "next/link";
// --- React and Next.js imports ---
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
// --- Animation library ---
import { motion } from "framer-motion";
// --- Supabase client ---
import { createClient, SupabaseClient } from "@supabase/supabase-js";
// --- Icons ---
import { 
  FaShip, 
  FaShieldAlt, 
  FaCrosshairs, 
  FaClipboardList, 
  FaCheck, 
  FaClock, 
  FaArrowRight, 
  FaArrowDown, 
  FaRedo, 
  FaTimes, 
  FaTrophy, 
  FaSkull, 
  FaHome,
  FaFlag,
  FaBomb,
  FaWater
} from "react-icons/fa";


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
  // Surrender timer
  const [surrenderTimer, setSurrenderTimer] = useState(60); // 1 minute timer
  const [lastMoveTime, setLastMoveTime] = useState<Date | null>(null);

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
  const { data: updatedGame } = await supabase.from("ships").select("*").eq("id", id).single();
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
  const { data } = await supabase.from("ships").select("*").eq("id", id).single();
  if (!data) return;
  if (data.player1 === user.id) { setPlayerNum(1); return; }
  if (data.player2 === user.id) { setPlayerNum(2); return; }
  if (!data.player1) { await supabase.from("ships").update({ player1: user.id }).eq("id", id); setPlayerNum(1); return; }
  if (!data.player2) { await supabase.from("ships").update({ player2: user.id }).eq("id", id); setPlayerNum(2); return; }
      setPlayerNum(null);
    };
    assignPlayer();
  }, [id, user]);

  // --- Check win/lose state and update overlays and result ---
  const checkWinLose = useCallback(async (g: Game) => {
    if (!playerNum) return;
    // If result is set, show win/lose overlays immediately for both players
    if (g.result) {
      if (g.result === "draw") {
        setYouWin(false);
        setYouLose(false);
      } else if ((playerNum === 1 && g.result === "player1") || (playerNum === 2 && g.result === "player2")) {
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
        if (!g.result) await supabase.from("ships").update({ result: "player1" }).eq("id", id);
      } else if (allShipsSunk(g.board1)) {
        setYouWin(false); setYouLose(true);
        if (!g.result) await supabase.from("ships").update({ result: "player2" }).eq("id", id);
      } else {
        setYouWin(false); setYouLose(false);
      }
    } else if (playerNum === 2) {
      if (allShipsSunk(g.board1)) {
        setYouWin(true); setYouLose(false);
        if (!g.result) await supabase.from("ships").update({ result: "player2" }).eq("id", id);
      } else if (allShipsSunk(g.board2)) {
        setYouWin(false); setYouLose(true);
        if (!g.result) await supabase.from("ships").update({ result: "player1" }).eq("id", id);
      } else {
        setYouWin(false); setYouLose(false);
      }
    }
  }, [playerNum, id]);

  useEffect(() => {
    if (!id || !playerNum) return;
    // Initial fetch
    const fetchGame = async () => {
      const { data } = await supabase.from("ships").select("*").eq("id", id).single();
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
        { event: "*", schema: "public", table: "ships", filter: `id=eq.${id}` },
        async (payload) => {
          const g = payload.new as Game;
          setGame(g); // Update the whole game object for type safety
          setPlayerBoard(playerNum === 1 ? g.board1 : g.board2);
          setOpponentBoard(playerNum === 1 ? g.board2 : g.board1);
          await checkWinLose(g);
        }
      )
      .subscribe();

    // Polling for game state updates (fallback for real-time)
    const pollInterval = setInterval(async () => {
      const { data } = await supabase.from("ships").select("*").eq("id", id).single();
      if (data) {
        setGame(data);
        setPlayerBoard(playerNum === 1 ? data.board1 : data.board2);
        setOpponentBoard(playerNum === 1 ? data.board2 : data.board1);
        await checkWinLose(data);
      }
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [id, playerNum, checkWinLose]);

  // --- Toggle ready state for placement phase ---
  const handleReadyToggle = async (nextReady: boolean) => {
    if (!playerNum) return;
    const boardKey = playerNum === 1 ? "board1" : "board2";
    const readyKey = playerNum === 1 ? "ready1" : "ready2";
    // If unreadying, set to null (empty); if readying, set to true
    const update: Record<string, unknown> = { [boardKey]: placementBoard, [readyKey]: nextReady ? true : null };
  await supabase.from("ships").update(update).eq("id", id);
  };

  // --- Automatically place ships if timer runs out ---
  function handleAutoPlace() {
    (async () => {
      const autoBoard = randomPlaceShips();
      setPlacementBoard(autoBoard);
      const boardKey = playerNum === 1 ? "board1" : "board2";
      const readyKey = playerNum === 1 ? "ready1" : "ready2";
  await supabase.from("ships").update({ [boardKey]: autoBoard, [readyKey]: true }).eq("id", id);
  // Force a state refresh for both players by updating a dummy field (to trigger realtime)
  await supabase.from("ships").update({ updated_at: new Date().toISOString() }).eq("id", id);
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


  // --- Surrender function ---
  const handleSurrender = async () => {
    if (!game || !playerNum || game.result) return;
    
    const opponent = playerNum === 1 ? "player2" : "player1";
    await supabase.from("ships").update({ 
      result: opponent,
      turn: null 
    }).eq("id", id);
  };

  // --- Update last active time in database ---
  const updateLastActive = async () => {
    if (!game || !playerNum) return;
    const playerKey = playerNum === 1 ? "player1_last_active" : "player2_last_active";
    await supabase.from("ships").update({ 
      [playerKey]: new Date().toISOString() 
    }).eq("id", id);
  };

  // --- Timer effect for automatic surrender ---
  useEffect(() => {
    if (!game || !playerNum || game.result) return;
    
    const isMyTurn = game.turn === `player${playerNum}`;
    if (!isMyTurn) {
      setSurrenderTimer(60); // Reset timer when it's not my turn
      return;
    }

    // Update last active time every 10 seconds
    const activeInterval = setInterval(updateLastActive, 10000);
    
    // Start countdown when it's my turn
    const interval = setInterval(() => {
      setSurrenderTimer(prev => {
        if (prev <= 1) {
          // Auto surrender
          handleSurrender();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(activeInterval);
    };
  }, [game, playerNum, id]);

  // --- Reset timer when a move is made ---
  useEffect(() => {
    if (game && game.turn) {
      setSurrenderTimer(60);
    }
  }, [game?.turn]);

  // --- Handle shooting at opponent's board ---
  const shoot = async (x: number, y: number) => {
    if (!game) return;
    if ((playerNum === 1 && game.turn !== "player1") || (playerNum === 2 && game.turn !== "player2")) return;
    // Always fetch the latest game state
  const { data: freshGame } = await supabase.from("ships").select("*").eq("id", id).single();
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
      updateObj["result"] = playerNum === 1 ? "player1" : "player2";
    }
  await supabase.from("ships").update(updateObj).eq("id", id);
  // Force manual refresh after shooting
  const { data: updatedGame } = await supabase.from("ships").select("*").eq("id", id).single();
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
    return (
      <main className="min-h-screen text-gray-100 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="max-w-6xl mx-auto">
          {/* Modern Header */}
          <header className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
                  <FaShip className="text-2xl text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                    Ustaw swoje statki
                  </h1>
                  <p className="text-sm text-gray-400 font-mono">Bitwa Morska #{id}</p>
                </div>
              </div>
              
              {/* Timer */}
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-mono text-sm font-bold shadow-lg">
                  <FaClock className="inline mr-1" />{Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/20">
                  <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
                  <span className="text-sm font-semibold">Gracz {playerNum}</span>
                </div>
              </div>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Ship Progress */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <FaClipboardList className="text-sm text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-cyan-200">Postęp</h2>
                </div>
                
                <div className="space-y-3">
                  {shipsToPlace.map((size, idx) => (
                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                      idx < currentShipIdx ? 'bg-gradient-to-r from-green-600/20 to-green-500/20 border border-green-400/30' : 
                      idx === currentShipIdx ? 'bg-gradient-to-r from-cyan-600/20 to-cyan-500/20 border border-cyan-400/50 ring-2 ring-cyan-400/30' : 
                      'bg-gradient-to-r from-gray-700/20 to-gray-600/20 border border-gray-600/30 opacity-60'
                    }`}>
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${
                        idx < currentShipIdx ? 'bg-gradient-to-br from-green-500 to-green-600' : 
                        idx === currentShipIdx ? 'bg-gradient-to-br from-cyan-500 to-cyan-600' : 
                        'bg-gradient-to-br from-gray-600 to-gray-700'
                      }`}>
                        {idx < currentShipIdx ? <FaCheck className="text-white" /> : idx === currentShipIdx ? <FaShip className="text-white" /> : <FaClock className="text-white" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-sm">Statek {idx + 1}</div>
                        <div className="text-xs text-gray-400">{size} kratek</div>
                      </div>
                      {idx === currentShipIdx && (
                        <div className="text-xs font-mono bg-cyan-400/20 text-cyan-200 px-2 py-1 rounded">
                          {orientation === 'horizontal' ? <FaArrowRight /> : <FaArrowDown />}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Placement Area */}
            <div className="lg:col-span-2">
              <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                    <FaCrosshairs className="text-sm text-white" />
                  </div>
                  <h2 className="text-xl font-bold text-cyan-200">Plansza rozmieszczenia</h2>
                </div>

                {/* Current Ship Info */}
                <div className="flex items-center justify-center gap-4 mb-6 p-4 bg-gradient-to-r from-cyan-600/20 to-cyan-500/20 rounded-2xl border border-cyan-400/30">
                  <div className="text-cyan-200 font-semibold">Aktualny statek:</div>
                  <div className="flex items-center gap-2">
                    <FaShip className="text-2xl text-cyan-200" />
                    <span className="bg-gradient-to-r from-cyan-400 to-cyan-500 text-cyan-900 px-3 py-1 rounded-lg font-bold text-lg">
                      {shipsToPlace[currentShipIdx] || '-'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    ({orientation === 'horizontal' ? <>Poziomo <FaArrowRight className="inline" /></> : <>Pionowo <FaArrowDown className="inline" /></>})
                  </div>
                </div>

                {/* Placement Board */}
                <div className="flex justify-center mb-6">
                  <div className="grid grid-cols-10 gap-1 bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-4 rounded-2xl shadow-inner">
                    {placementBoard.map((row, y) =>
                      row.map((cell, x) => (
                        <motion.div
                          key={`placement-${x}-${y}`}
                          className={`w-8 h-8 sm:w-10 sm:h-10 border-2 rounded-lg cursor-pointer flex items-center justify-center text-sm font-bold transition-all duration-200 shadow-sm
                            ${cell === "empty" ? 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:from-cyan-800 hover:to-cyan-900 hover:border-cyan-400' : 'bg-gradient-to-br from-cyan-500 to-cyan-600 border-cyan-300 shadow-cyan-400/25'}
                          `}
                          whileHover={{ scale: 1.1 }}
                          onClick={() => placeShip(x, y)}
                        >
                          {cell === 'ship' ? <FaShip className="text-cyan-200" /> : ''}
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                  <div className="flex gap-2">
                    <button
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 border-2 ${
                        orientation === 'horizontal' ? 
                        'bg-gradient-to-r from-cyan-600 to-cyan-500 border-cyan-400 text-white shadow-lg' : 
                        'bg-gradient-to-r from-gray-700 to-gray-600 border-gray-500 text-cyan-200 hover:from-cyan-800 hover:to-cyan-700'
                      }`}
                      onClick={() => setOrientation('horizontal')}
                    >
                      <FaArrowRight className="inline mr-1" />Poziomo
                    </button>
                    <button
                      className={`px-4 py-2 rounded-xl font-semibold transition-all duration-200 border-2 ${
                        orientation === 'vertical' ? 
                        'bg-gradient-to-r from-cyan-600 to-cyan-500 border-cyan-400 text-white shadow-lg' : 
                        'bg-gradient-to-r from-gray-700 to-gray-600 border-gray-500 text-cyan-200 hover:from-cyan-800 hover:to-cyan-700'
                      }`}
                      onClick={() => setOrientation('vertical')}
                    >
                      <FaArrowDown className="inline mr-1" />Pionowo
                    </button>
                    <button 
                      className="px-4 py-2 rounded-xl font-semibold bg-gradient-to-r from-gray-600 to-gray-500 text-white hover:from-gray-700 hover:to-gray-600 transition-all duration-200 border-2 border-gray-500" 
                      onClick={resetPlacement}
                    >
                      <FaRedo className="inline mr-1" />Reset
                    </button>
                  </div>
                  
                  <button
                    className={`px-8 py-3 rounded-2xl font-bold text-lg shadow-xl transition-all duration-200 border-2 ${
                      iAmReady ? 
                      'bg-gradient-to-r from-red-600 to-red-500 border-red-400 text-white hover:from-red-700 hover:to-red-600' : 
                      'bg-gradient-to-r from-green-600 to-green-500 border-green-400 text-white hover:from-green-700 hover:to-green-600'
                    } disabled:bg-gradient-to-r disabled:from-gray-600 disabled:to-gray-500 disabled:border-gray-400`}
                    disabled={currentShipIdx < shipsToPlace.length}
                    onClick={async () => {
                      if (!iAmReady && game && ((playerNum === 1 && game.ready2) || (playerNum === 2 && game.ready1))) {
                        await handleReadyToggle(true);
                        await supabase.from("ships").update({ turn: 'player1' }).eq("id", id);
                      } else {
                        await handleReadyToggle(!iAmReady);
                      }
                      // Force refresh after ready toggle
                      const { data: updatedGame } = await supabase.from("ships").select("*").eq("id", id).single();
                      if (updatedGame) {
                        setGame(updatedGame);
                        setPlayerBoard(playerNum === 1 ? updatedGame.board1 : updatedGame.board2);
                        setOpponentBoard(playerNum === 1 ? updatedGame.board2 : updatedGame.board1);
                        await checkWinLose(updatedGame);
                      }
                    }}
                  >
                    {iAmReady ? <><FaTimes className="inline mr-2" />Cofnij gotowość</> : <><FaCheck className="inline mr-2" />Gotowe</>}
                  </button>
                </div>

                {iAmReady && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-600/20 to-green-500/20 rounded-2xl border border-green-400/30 text-center">
                    <div className="flex items-center justify-center gap-2 text-green-200 animate-pulse">
                      <FaClock className="text-lg" />
                      <span className="font-semibold">Czekaj na drugiego gracza...</span>
                    </div>
                  </div>
                )}

                <p className="mt-4 text-sm text-gray-400 text-center">
                  Kliknij na planszę, aby ustawić statek. 
                  <span className="text-cyan-300 font-bold ml-1">
                    {orientation === 'horizontal' ? <><FaArrowRight className="inline" /> poziomo</> : <><FaArrowDown className="inline" /> pionowo</>}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Main game UI
  return (
    <main className="min-h-screen text-gray-100 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
                <FaShip className="text-2xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Bitwa Morska
                </h1>
                <p className="text-sm text-gray-400 font-mono">#{id}</p>
              </div>
            </div>
            
            {/* Game Status Card */}
            <div className="flex items-center gap-4">
              <div className={`px-6 py-3 rounded-2xl font-bold text-lg shadow-xl border-2 transition-all duration-300 ${
                isMyTurn ? 'bg-gradient-to-r from-green-600 to-green-500 border-green-400 text-white animate-pulse shadow-green-500/25' : 
                'bg-gradient-to-r from-gray-700 to-gray-600 border-gray-500 text-cyan-200'
              }`}>
                {isMyTurn ? <><FaCrosshairs className="inline mr-2" />Twoja tura!</> : <><FaClock className="inline mr-2" />Czekaj na przeciwnika...</>}
              </div>
              
              {isMyTurn && !game.result && (
                <div className="flex items-center gap-3">
                  <div className={`px-4 py-2 rounded-xl font-mono text-sm font-bold shadow-lg transition-all duration-300 ${
                    surrenderTimer <= 10 ? 'bg-gradient-to-r from-red-600 to-red-500 text-white animate-pulse shadow-red-500/25' : 
                    surrenderTimer <= 30 ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 text-white shadow-yellow-500/25' : 
                    'bg-gradient-to-r from-gray-600 to-gray-500 text-gray-200'
                  }`}>
                    <FaClock className="inline mr-1" />{Math.floor(surrenderTimer/60)}:{(surrenderTimer%60).toString().padStart(2,'0')}
                  </div>
                  <button
                    onClick={handleSurrender}
                    className="px-4 py-2 rounded-xl font-semibold bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white transition-all duration-200 border-2 border-red-400 text-sm shadow-lg hover:shadow-red-500/25"
                  >
                    <FaFlag className="inline mr-1" />Poddaj się
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Player Info */}
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 backdrop-blur border border-white/20">
              <div className="w-3 h-3 rounded-full bg-cyan-400"></div>
              <span className="text-sm font-semibold">Gracz {playerNum}</span>
            </div>
          </div>
        </header>
        {/* Game Boards */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {/* Player Board */}
          <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <FaShieldAlt className="text-sm text-white" />
              </div>
              <h2 className="text-xl font-bold text-cyan-200">Twoja plansza</h2>
            </div>
            <div className="grid grid-cols-10 gap-1 bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-3 rounded-2xl shadow-inner">
              {(getPlayerViewBoard() || []).map((row, y) =>
                (row || []).map((cell, x) => (
                  <motion.div
                    key={`player-${x}-${y}`}
                    className={`w-8 h-8 sm:w-10 sm:h-10 border-2 rounded-lg text-sm flex items-center justify-center font-bold transition-all duration-200 shadow-sm
                      ${cell === "empty" ? "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600" : ""}
                      ${cell === "ship" ? "bg-gradient-to-br from-cyan-600 to-cyan-700 border-cyan-400 shadow-cyan-400/25" : ""}
                      ${cell === "hit" ? "bg-gradient-to-br from-red-500 to-red-600 border-red-300 shadow-red-400/25" : ""} 
                      ${cell === "miss" ? "bg-gradient-to-br from-white/60 to-white/40 border-gray-300 text-gray-700" : ""}
                    `}
                    whileHover={{ scale: 1.05 }}
                  >
                    {cell === 'hit' ? <FaBomb className="text-red-300" /> : cell === 'miss' ? <FaWater className="text-blue-300" /> : ''}
                  </motion.div>
                ))
              )}
            </div>
            <p className="mt-4 text-sm text-gray-400 text-center">Twoje statki i trafienia przeciwnika</p>
          </div>

          {/* Opponent Board */}
          <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center">
                <FaCrosshairs className="text-sm text-white" />
              </div>
              <h2 className="text-xl font-bold text-cyan-200">Plansza przeciwnika</h2>
            </div>
            <div className="grid grid-cols-10 gap-1 bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-3 rounded-2xl shadow-inner">
              {(getOpponentViewBoard() || []).map((row, y) =>
                (row || []).map((cell, x) => (
                  <motion.div
                    key={`opponent-${x}-${y}`}
                    className={`w-8 h-8 sm:w-10 sm:h-10 border-2 rounded-lg cursor-pointer text-sm flex items-center justify-center font-bold transition-all duration-200 shadow-sm
                      ${cell === "unknown" ? "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 hover:from-cyan-800 hover:to-cyan-900 hover:border-cyan-400" : ""}
                      ${cell === "hit" ? "bg-gradient-to-br from-red-500 to-red-600 border-red-300 shadow-red-400/25" : ""}
                      ${cell === "miss" ? "bg-gradient-to-br from-white/60 to-white/40 border-gray-300 text-gray-700" : ""}
                      ${isMyTurn && cell === 'unknown' ? 'hover:scale-110 hover:shadow-xl hover:shadow-cyan-400/25' : ''}
                    `}
                    whileHover={cell === 'unknown' && isMyTurn ? { scale: 1.1 } : {}}
                    onClick={() => {
                      if (cell === 'unknown' && isMyTurn && !youWin && !youLose) shoot(x, y);
                    }}
                  >
                    {cell === 'hit' ? <FaBomb className="text-red-300" /> : cell === 'miss' ? <FaWater className="text-blue-300" /> : ''}
                  </motion.div>
                ))
              )}
            </div>
            <p className="mt-4 text-sm text-gray-400 text-center">Twoje strzały</p>
          </div>
        </section>
        {/* Game Overlays */}
        <section className="fixed inset-0 flex items-center justify-center pointer-events-none select-none z-50 p-4">
          {!isMyTurn && !youWin && !youLose && (
            <div className="bg-gradient-to-br from-black/90 to-black/70 backdrop-blur-xl px-8 py-6 rounded-3xl shadow-2xl border border-cyan-400/30 text-center max-w-md animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <FaClock className="text-2xl text-white" />
              </div>
              <div className="text-xl font-bold text-cyan-200 mb-2">Czekaj na ruch przeciwnika...</div>
              <div className="text-sm text-gray-300">Plansza odświeża się automatycznie</div>
            </div>
          )}
          {youWin && (
            <div className="bg-gradient-to-br from-green-600/90 via-green-700/80 to-green-800/90 backdrop-blur-xl px-8 py-10 rounded-3xl shadow-2xl border border-green-400/50 text-center max-w-lg animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-500 flex items-center justify-center shadow-lg">
                <FaTrophy className="text-3xl text-white" />
              </div>
              <div className="text-3xl font-extrabold text-green-100 mb-4 drop-shadow">Wygrałeś!</div>
              <div className="text-lg text-green-100 mb-6">
                {game?.result === "player1" && playerNum === 1 ? "Wszystkie statki przeciwnika zostały zatopione!" : 
                 game?.result === "player2" && playerNum === 2 ? "Wszystkie statki przeciwnika zostały zatopione!" : 
                 "Przeciwnik się poddał!"}
              </div>
              <Link href="/" passHref legacyBehavior>
                <a className="inline-block px-8 py-3 rounded-2xl font-bold text-lg shadow-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all duration-200 pointer-events-auto">
                  <FaHome className="inline mr-2" />Wróć do lobby
                </a>
              </Link>
            </div>
          )}
          {youLose && (
            <div className="bg-gradient-to-br from-red-600/90 via-red-700/80 to-red-800/90 backdrop-blur-xl px-8 py-10 rounded-3xl shadow-2xl border border-red-400/50 text-center max-w-lg animate-fade-in">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-400 to-red-500 flex items-center justify-center shadow-lg">
                <FaSkull className="text-3xl text-white" />
              </div>
              <div className="text-3xl font-extrabold text-red-100 mb-4 drop-shadow">Przegrałeś!</div>
              <div className="text-lg text-red-100 mb-6">
                {game?.result === "player1" && playerNum === 2 ? "Wszystkie twoje statki zostały zatopione!" : 
                 game?.result === "player2" && playerNum === 1 ? "Wszystkie twoje statki zostały zatopione!" : 
                 "Poddano się lub przekroczono czas!"}
              </div>
              <Link href="/" passHref legacyBehavior>
                <a className="inline-block px-8 py-3 rounded-2xl font-bold text-lg shadow-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 pointer-events-auto">
                  <FaHome className="inline mr-2" />Wróć do lobby
                </a>
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
