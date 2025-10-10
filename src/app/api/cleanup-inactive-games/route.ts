// import { NextRequest, NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabase';

// export async function GET() {
//   try {
//     const now = new Date();
//     const timeoutMinutes = 2; // 2 minutes timeout
//     const timeoutDate = new Date(now.getTime() - timeoutMinutes * 60 * 1000);

//     console.log(`Cleaning up games inactive since: ${timeoutDate.toISOString()}`);

//     // Cleanup ships games
//     const { data: inactiveShips } = await supabase
//       .from('ships')
//       .select('*')
//       .is('result', null)
//       .or(`player1_last_active.lt.${timeoutDate.toISOString()},player2_last_active.lt.${timeoutDate.toISOString()}`);

//     let shipsCleaned = 0;
//     for (const game of inactiveShips || []) {
//       const player1Inactive = game.player1_last_active && new Date(game.player1_last_active) < timeoutDate;
//       const player2Inactive = game.player2_last_active && new Date(game.player2_last_active) < timeoutDate;
      
//       if (player1Inactive && player2Inactive) {
//         // Both players inactive - set as draw
//         await supabase.from('ships').update({ result: 'draw' }).eq('id', game.id);
//         console.log(`Ships game ${game.id}: Both players inactive - set as draw`);
//         shipsCleaned++;
//       } else if (player1Inactive) {
//         // Player 1 inactive - player 2 wins
//         await supabase.from('ships').update({ result: 'player2' }).eq('id', game.id);
//         console.log(`Ships game ${game.id}: Player 1 inactive - player 2 wins`);
//         shipsCleaned++;
//       } else if (player2Inactive) {
//         // Player 2 inactive - player 1 wins
//         await supabase.from('ships').update({ result: 'player1' }).eq('id', game.id);
//         console.log(`Ships game ${game.id}: Player 2 inactive - player 1 wins`);
//         shipsCleaned++;
//       }
//     }

//     // Cleanup connect4 games
//     const { data: inactiveConnect4 } = await supabase
//       .from('connect4')
//       .select('*')
//       .is('result', null)
//       .or(`player1_last_active.lt.${timeoutDate.toISOString()},player2_last_active.lt.${timeoutDate.toISOString()}`);

//     let connect4Cleaned = 0;
//     for (const game of inactiveConnect4 || []) {
//       const player1Inactive = game.player1_last_active && new Date(game.player1_last_active) < timeoutDate;
//       const player2Inactive = game.player2_last_active && new Date(game.player2_last_active) < timeoutDate;
      
//       if (player1Inactive && player2Inactive) {
//         // Both players inactive - set as draw
//         await supabase.from('connect4').update({ result: 'draw' }).eq('id', game.id);
//         console.log(`Connect4 game ${game.id}: Both players inactive - set as draw`);
//         connect4Cleaned++;
//       } else if (player1Inactive) {
//         // Player 1 inactive - player 2 wins
//         await supabase.from('connect4').update({ result: 'player2' }).eq('id', game.id);
//         console.log(`Connect4 game ${game.id}: Player 1 inactive - player 2 wins`);
//         connect4Cleaned++;
//       } else if (player2Inactive) {
//         // Player 2 inactive - player 1 wins
//         await supabase.from('connect4').update({ result: 'player1' }).eq('id', game.id);
//         console.log(`Connect4 game ${game.id}: Player 2 inactive - player 1 wins`);
//         connect4Cleaned++;
//       }
//     }

//     const response = {
//       success: true,
//       timestamp: now.toISOString(),
//       timeoutMinutes,
//       shipsCleaned,
//       connect4Cleaned,
//       totalCleaned: shipsCleaned + connect4Cleaned
//     };

//     console.log('Cleanup completed:', response);
//     return NextResponse.json(response);
//   } catch (error) {
//     console.error('Cleanup error:', error);
//     return NextResponse.json({ 
//       error: 'Cleanup failed', 
//       details: error instanceof Error ? error.message : 'Unknown error',
//       timestamp: new Date().toISOString()
//     }, { status: 500 });
//   }
// }

// // Also support POST requests for manual cleanup
// export async function POST() {
//   return GET();
// }
