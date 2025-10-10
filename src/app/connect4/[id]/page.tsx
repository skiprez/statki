"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { 
  FaArrowLeft, 
  FaTrophy, 
  FaSkull, 
  FaRedo, 
  FaCircle, 
  FaCrosshairs, 
  FaClock, 
  FaFlag, 
  FaHome, 
  FaArrowDown
} from "react-icons/fa";

// Types and constants
type Cell = null | "player1" | "player2";
const BOARD_COLS = 7;
const BOARD_ROWS = 6;

type Game = {
  id: string;
  board: Cell[][];
  turn: "player1" | "player2";
  ready1: boolean | null;
  ready2: boolean | null;
  player1?: string;
  player2?: string;
  result?: string;
  [key: string]: unknown;
};

export default function Connect4GamePage() {
  const { id } = useParams();
  const { user } = useUser();
  
  // State
  const [game, setGame] = useState<Game | null>(null);
  const [playerNum, setPlayerNum] = useState<number | null>(null);
  const [youWin, setYouWin] = useState(false);
  const [youLose, setYouLose] = useState(false);
  const [isDropping, setIsDropping] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState<number | null>(null);
  const [surrenderTimer, setSurrenderTimer] = useState(60); // 1 minute timer
  const [lastMoveTime, setLastMoveTime] = useState<Date | null>(null);

  // Initialize empty board
  const initializeBoard = (): Cell[][] => {
    return Array(BOARD_ROWS).fill(null).map(() => Array(BOARD_COLS).fill(null));
  };

  // Check for win condition
  const checkWin = (board: Cell[][], player: "player1" | "player2"): boolean => {
    // Check horizontal
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS - 3; col++) {
        if (
          board[row][col] === player &&
          board[row][col + 1] === player &&
          board[row][col + 2] === player &&
          board[row][col + 3] === player
        ) {
          return true;
        }
      }
    }

    // Check vertical
    for (let row = 0; row < BOARD_ROWS - 3; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        if (
          board[row][col] === player &&
          board[row + 1][col] === player &&
          board[row + 2][col] === player &&
          board[row + 3][col] === player
        ) {
          return true;
        }
      }
    }

    // Check diagonal (top-left to bottom-right)
    for (let row = 0; row < BOARD_ROWS - 3; row++) {
      for (let col = 0; col < BOARD_COLS - 3; col++) {
        if (
          board[row][col] === player &&
          board[row + 1][col + 1] === player &&
          board[row + 2][col + 2] === player &&
          board[row + 3][col + 3] === player
        ) {
          return true;
        }
      }
    }

    // Check diagonal (top-right to bottom-left)
    for (let row = 0; row < BOARD_ROWS - 3; row++) {
      for (let col = 3; col < BOARD_COLS; col++) {
        if (
          board[row][col] === player &&
          board[row + 1][col - 1] === player &&
          board[row + 2][col - 2] === player &&
          board[row + 3][col - 3] === player
        ) {
          return true;
        }
      }
    }

    return false;
  };

  // Check if board is full (draw)
  const isBoardFull = (board: Cell[][]): boolean => {
    return board[0].every(cell => cell !== null);
  };

  // Check win/lose state
  const checkWinLose = useCallback(async (g: Game) => {
    if (!playerNum) return;
    
    // If result is set, show win/lose overlays immediately
    if (g.result) {
      if (g.result === "draw") {
        setYouWin(false);
        setYouLose(false);
      } else if ((playerNum === 1 && g.result === "player1") || (playerNum === 2 && g.result === "player2")) {
        setYouWin(true);
        setYouLose(false);
      } else {
        setYouWin(false);
        setYouLose(true);
      }
      return;
    }

    // Check for wins
    const currentBoard = g.board || initializeBoard();
    const player1Wins = checkWin(currentBoard, "player1");
    const player2Wins = checkWin(currentBoard, "player2");
    
    console.log("Win check:", { player1Wins, player2Wins, playerNum, currentBoard });
    
    if (player1Wins) {
      console.log("Player 1 wins!");
      if (playerNum === 1) {
        setYouWin(true);
        setYouLose(false);
      } else {
        setYouWin(false);
        setYouLose(true);
      }
      if (!g.result) {
        await supabase.from("connect4").update({ result: "player1" }).eq("id", id);
      }
    } else if (player2Wins) {
      console.log("Player 2 wins!");
      if (playerNum === 2) {
        setYouWin(true);
        setYouLose(false);
      } else {
        setYouWin(false);
        setYouLose(true);
      }
      if (!g.result) {
        await supabase.from("connect4").update({ result: "player2" }).eq("id", id);
      }
    } else if (isBoardFull(currentBoard)) {
      // Draw
      setYouWin(false);
      setYouLose(false);
      if (!g.result) {
        await supabase.from("connect4").update({ result: "draw" }).eq("id", id);
      }
    } else {
      setYouWin(false);
      setYouLose(false);
    }
  }, [playerNum, id]);

  // Assign player number
  useEffect(() => {
    if (!id || !user) return;
    const assignPlayer = async () => {
      const { data } = await supabase.from("connect4").select("*").eq("id", id).single();
      if (!data) return;
      if (data.player1 === user.id) { setPlayerNum(1); return; }
      if (data.player2 === user.id) { setPlayerNum(2); return; }
      if (!data.player1) { 
        await supabase.from("connect4").update({ player1: user.id }).eq("id", id); 
        setPlayerNum(1); 
        return; 
      }
      if (!data.player2) { 
        await supabase.from("connect4").update({ player2: user.id }).eq("id", id); 
        setPlayerNum(2); 
        return; 
      }
      setPlayerNum(null);
    };
    assignPlayer();
  }, [id, user]);

  // Fetch game and set up real-time updates
  useEffect(() => {
    if (!id || !playerNum) return;
    
    const fetchGame = async () => {
      const { data } = await supabase.from("connect4").select("*").eq("id", id).single();
      if (data) {
        setGame(data);
        await checkWinLose(data);
      }
    };
    
    fetchGame();

    // Real-time updates
    const channel = supabase
      .channel(`connect4-game-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "connect4", filter: `id=eq.${id}` },
        async (payload) => {
          const g = payload.new as Game;
          setGame(g);
          await checkWinLose(g);
        }
      )
      .subscribe();

    // Polling for board updates (fallback for real-time)
    const pollInterval = setInterval(async () => {
      const { data } = await supabase.from("connect4").select("*").eq("id", id).single();
      if (data) {
        setGame(data);
        await checkWinLose(data);
      }
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [id, playerNum, checkWinLose]);

  // Drop piece
  const dropPiece = async (column: number) => {
    if (!game || !playerNum || isDropping) return;
    if ((playerNum === 1 && game.turn !== "player1") || (playerNum === 2 && game.turn !== "player2")) return;
    if (game.result) return;

    setIsDropping(true);

    // Initialize board if null
    const currentBoard = game.board || initializeBoard();
    
    // Find the lowest empty row in the column
    let row = BOARD_ROWS - 1;
    while (row >= 0 && currentBoard[row][column] !== null) {
      row--;
    }

    if (row < 0) {
      setIsDropping(false);
      return; // Column is full
    }

    // Create new board with the piece dropped
    const newBoard = currentBoard.map(row => [...row]);
    newBoard[row][column] = playerNum === 1 ? "player1" : "player2";

    // Check for win
    const currentPlayer = playerNum === 1 ? "player1" : "player2";
    const hasWon = checkWin(newBoard, currentPlayer);
    const isDraw = isBoardFull(newBoard);

    // Update game state
    const updateData: any = {
      board: newBoard,
      turn: hasWon || isDraw ? null : (playerNum === 1 ? "player2" : "player1")
    };

    if (hasWon) {
      updateData.result = currentPlayer; // This is already "player1" or "player2"
    } else if (isDraw) {
      updateData.result = "draw";
    }

    await supabase.from("connect4").update(updateData).eq("id", id);
    
    // Force refresh after move
    const { data: updatedGame } = await supabase.from("connect4").select("*").eq("id", id).single();
    if (updatedGame) {
      setGame(updatedGame);
      await checkWinLose(updatedGame);
    }
    
    setIsDropping(false);
  };

  // Get piece color
  const getPieceColor = (cell: Cell) => {
    if (cell === "player1") return "bg-red-500";
    if (cell === "player2") return "bg-yellow-400";
    return "bg-gray-700";
  };

  // Get current player color
  const getCurrentPlayerColor = () => {
    if (!game) return "bg-gray-500";
    if (game.turn === "player1") return "bg-red-500";
    if (game.turn === "player2") return "bg-yellow-400";
    return "bg-gray-500";
  };

  // Surrender function
  const handleSurrender = async () => {
    if (!game || !playerNum || game.result) return;
    
    const opponent = playerNum === 1 ? "player2" : "player1";
    await supabase.from("connect4").update({ 
      result: opponent,
      turn: null 
    }).eq("id", id);
  };

  // Update last active time in database
  const updateLastActive = async () => {
    if (!game || !playerNum) return;
    const playerKey = playerNum === 1 ? "player1_last_active" : "player2_last_active";
    await supabase.from("connect4").update({ 
      [playerKey]: new Date().toISOString() 
    }).eq("id", id);
  };

  // Timer effect for automatic surrender
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

  // Reset timer when a move is made
  useEffect(() => {
    if (game && game.turn) {
      setSurrenderTimer(60);
    }
  }, [game?.turn]);

  if (!game || !playerNum) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-100 bg-none p-2 sm:p-0">
        <div className="animate-pulse text-2xl sm:text-3xl font-extrabold tracking-tight bg-black/30 backdrop-blur-lg p-4 sm:p-8 rounded-2xl shadow-2xl border border-white/10 w-full max-w-xs sm:max-w-md text-center">
          Ładowanie gry...
        </div>
      </main>
    );
  }

  const isMyTurn = game.turn === `player${playerNum}`;

  return (
    <main className="min-h-screen text-gray-100 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Modern Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
                <FaCircle className="text-2xl text-red-500" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent">
                  Connect4
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

        {/* Game Board */}
        <section className="flex justify-center mb-8">
          <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/10 hover:border-cyan-400/30 transition-all duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <FaCrosshairs className="text-sm text-white" />
              </div>
              <h2 className="text-xl font-bold text-cyan-200">Plansza gry</h2>
            </div>
            
            {/* Column buttons for dropping pieces */}
            <div className="grid grid-cols-7 gap-2 mb-4 bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-3 rounded-2xl shadow-inner">
              {Array.from({ length: BOARD_COLS }, (_, col) => (
                <button
                  key={col}
                  onClick={() => dropPiece(col)}
                  disabled={!game || !!game.result || isDropping || (playerNum === 1 && game.turn !== "player1") || (playerNum === 2 && game.turn !== "player2")}
                  onMouseEnter={() => setHoveredColumn(col)}
                  onMouseLeave={() => setHoveredColumn(null)}
                  className={`w-12 h-12 border-2 rounded-full cursor-pointer text-lg flex items-center justify-center font-bold transition-all duration-200 shadow-sm
                    ${isMyTurn && !game.result && !isDropping ? 'bg-gradient-to-br from-cyan-600 to-cyan-700 border-cyan-400 hover:from-cyan-500 hover:to-cyan-600 hover:scale-110 hover:shadow-xl hover:shadow-cyan-400/25' : 'bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600 opacity-50 cursor-not-allowed'}
                  `}
                >
                  {hoveredColumn === col && isMyTurn && !game.result && !isDropping ? <FaArrowDown className="text-white" /> : ''}
                </button>
              ))}
            </div>

            {/* Game board */}
            <div className="grid grid-rows-6 gap-2 bg-gradient-to-br from-gray-800/90 to-gray-900/90 p-4 rounded-2xl shadow-inner">
              {(game.board || initializeBoard()).map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-7 gap-2">
                  {row.map((cell, colIndex) => (
                    <motion.div
                      key={`${rowIndex}-${colIndex}`}
                      initial={{ scale: 0, y: -100 }}
                      animate={{ scale: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className={`w-12 h-12 border-2 rounded-full flex items-center justify-center font-bold transition-all duration-200 shadow-sm
                        ${cell === null ? "bg-gradient-to-br from-gray-700 to-gray-800 border-gray-600" : ""}
                        ${cell === "player1" ? "bg-gradient-to-br from-red-500 to-red-600 border-red-300 shadow-red-400/25" : ""}
                        ${cell === "player2" ? "bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-300 shadow-yellow-400/25" : ""}
                      `}
                    >
                      {cell === 'player1' ? <FaCircle className="text-red-500" /> : cell === 'player2' ? <FaCircle className="text-yellow-400" /> : ''}
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-gray-400 text-center">Kliknij kolumnę, aby upuścić pionek</p>
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
                {game?.result === "player1" && playerNum === 1 ? "Udało Ci się połączyć 4 pionki!" : 
                 game?.result === "player2" && playerNum === 2 ? "Udało Ci się połączyć 4 pionki!" : 
                 "Przeciwnik się poddał!"}
              </div>
              <Link href="/queue-connect4" passHref legacyBehavior>
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
                {game?.result === "player1" && playerNum === 2 ? "Przeciwnik połączył 4 pionki!" : 
                 game?.result === "player2" && playerNum === 1 ? "Przeciwnik połączył 4 pionki!" : 
                 "Poddano się lub przekroczono czas!"}
              </div>
              <Link href="/queue-connect4" passHref legacyBehavior>
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
