"use client";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { FaUserCircle, FaEnvelope, FaLock, FaChartBar, FaTrophy, FaTimesCircle, FaPercent, FaUserEdit, FaArrowLeft } from "react-icons/fa";

export default function ProfilePage() {
	// --- User and stats state ---
	const { user } = useUser();
	const [stats, setStats] = useState({ gamesPlayed: 0, gamesWon: 0, gamesLost: 0, winRate: "0%" });

	// --- Supabase client ---
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
	const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

	// --- Fetch stats from games table ---
	useEffect(() => {
		if (!user?.id) return;
		const fetchStats = async () => {
			const { data: games, error } = await supabase
				.from("games")
				.select("player1, player2, result")
				.or(`player1.eq.${user.id},player2.eq.${user.id}`);
			if (error || !games) return;
			let gamesPlayed = 0, gamesWon = 0, gamesLost = 0;
			for (const g of games) {
				if (!g.result) continue;
				gamesPlayed++;
				if (g.result === user.id) gamesWon++;
				else if (g.player1 === user.id || g.player2 === user.id) gamesLost++;
			}
			const winRate = gamesPlayed > 0 ? `${Math.round((gamesWon / gamesPlayed) * 100)}%` : "0%";
			setStats({ gamesPlayed, gamesWon, gamesLost, winRate });
		};
		fetchStats();
	}, [user?.id]);

	// --- Render ---
	return (
		<main className="min-h-screen text-gray-100 flex flex-col items-center justify-center bg-transparent px-4 py-8">
			<div className="w-full max-w-4xl bg-black/30 border border-white/20 rounded-2xl shadow-xl backdrop-blur p-0 flex flex-col md:flex-row gap-0 md:gap-0 overflow-hidden relative">
				{/* --- Return button --- */}
				<a
					href="/"
					className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 hover:bg-cyan-500/80 hover:text-white transition font-semibold text-cyan-200 shadow z-20"
				>
					<FaArrowLeft /> Powrót
				</a>

				{/* --- Left: User info/avatar and stats --- */}
				<div className="md:w-1/3 w-full flex flex-col items-center justify-center bg-gradient-to-b from-cyan-900/40 via-blue-900/30 to-black/40 p-8 gap-6 border-b md:border-b-0 md:border-r border-white/10">
					<div className="flex flex-col items-center gap-2">
						<FaUserCircle className="text-cyan-300" size={80} />
						<div className="text-2xl font-bold text-cyan-200 mt-2">{user?.username || "Użytkownik"}</div>
						<div className="text-gray-300 text-sm flex items-center gap-2"><FaEnvelope className="text-cyan-400" />{user?.emailAddresses?.[0]?.emailAddress}</div>
					</div>
					<div className="w-full mt-6">
						<div className="bg-white/5 rounded-xl p-5 flex flex-col gap-3 border border-white/10 shadow-lg">
							<h2 className="text-xl font-bold text-cyan-300 mb-2 flex items-center gap-2"><FaChartBar className="text-cyan-300" />Statystyki</h2>
							<div className="flex flex-col gap-2 text-white/90 text-base">
								<div className="flex items-center gap-2"><FaChartBar className="text-cyan-400" /> Rozegrane gry: <span className="font-bold text-cyan-400">{stats.gamesPlayed}</span></div>
								<div className="flex items-center gap-2"><FaTrophy className="text-yellow-300" /> Wygrane gry: <span className="font-bold text-cyan-400">{stats.gamesWon}</span></div>
								<div className="flex items-center gap-2"><FaTimesCircle className="text-red-400" /> Przegrane gry: <span className="font-bold text-cyan-400">{stats.gamesLost}</span></div>
								<div className="flex items-center gap-2"><FaPercent className="text-cyan-400" /> Procent zwycięstw: <span className="font-bold text-cyan-400">{stats.winRate}</span></div>
							</div>
						</div>
					</div>
				</div>

				{/* --- Right: Editable profile form --- */}
				<div className="md:w-2/3 w-full flex flex-col justify-center p-8">
					<h1 className="text-3xl md:text-4xl font-extrabold mb-8 bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-lg flex items-center gap-3">
						<FaUserEdit className="inline-block text-cyan-300 mb-1" size={32} /> Edytuj profil
					</h1>
					<form
						className="flex flex-col gap-6"
						onSubmit={async (e) => {
							e.preventDefault();
							if (!user) return;
							let changed = false;
							const form = e.target as HTMLFormElement;
							const newUsername = (form.elements.namedItem("username") as HTMLInputElement)?.value;
							const newEmail = (form.elements.namedItem("email") as HTMLInputElement)?.value;
							const newPassword = (form.elements.namedItem("password") as HTMLInputElement)?.value;
							// Username
							if (newUsername && newUsername !== user.username) {
								await user.update({ username: newUsername });
								changed = true;
							}
							// Email
							if (newEmail && newEmail !== user.emailAddresses?.[0]?.emailAddress) {
								try {
									const emailObj = await user.createEmailAddress({ email: newEmail });
									await emailObj.prepareVerification({ strategy: "email_code" });
									changed = true;
									alert("Na nowy email wysłano kod weryfikacyjny. Zweryfikuj email w panelu Clerk.");
								} catch (err) {
									alert("Błąd przy zmianie emaila: " + (err as any)?.errors?.[0]?.message || err);
								}
							}
							// Password
							if (newPassword) {
								try {
									await user.updatePassword({ newPassword });
									changed = true;
								} catch (err) {
									alert("Błąd przy zmianie hasła: " + (err as any)?.errors?.[0]?.message || err);
								}
							}
							if (changed) alert("Zaktualizowano profil!");
						}}
					>
						<div>
							<label className="text-white/80 mb-1 font-semibold flex items-center gap-2">
								<FaUserCircle className="text-cyan-300" /> Nazwa użytkownika
							</label>
							<div className="relative">
								<input
									className="w-full rounded-xl px-4 py-3 pl-11 bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium text-lg shadow"
									name="username"
									defaultValue={user?.username || ""}
									placeholder="Nazwa użytkownika"
									autoComplete="username"
								/>
								<FaUserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300 opacity-70 pointer-events-none" size={22} />
							</div>
						</div>
						<div>
							<label className="text-white/80 mb-1 font-semibold flex items-center gap-2">
								<FaEnvelope className="text-cyan-300" /> Email
							</label>
							<div className="relative">
								<input
									className="w-full rounded-xl px-4 py-3 pl-11 bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium text-lg shadow"
									name="email"
									type="email"
									defaultValue={user?.emailAddresses?.[0]?.emailAddress || ""}
									placeholder="Email"
									autoComplete="email"
								/>
								<FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300 opacity-70 pointer-events-none" size={20} />
							</div>
						</div>
						<div>
							<label className="text-white/80 mb-1 font-semibold flex items-center gap-2">
								<FaLock className="text-cyan-300" /> Nowe hasło
							</label>
							<div className="relative">
								<input
									className="w-full rounded-xl px-4 py-3 pl-11 bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-medium text-lg shadow"
									name="password"
									type="password"
									placeholder="Nowe hasło"
									autoComplete="new-password"
								/>
								<FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300 opacity-70 pointer-events-none" size={20} />
							</div>
						</div>
						<button
							type="submit"
							className="w-full py-3 rounded-2xl bg-cyan-500/95 hover:bg-cyan-400 transition font-bold text-lg shadow-xl mt-2"
						>
							Zapisz zmiany
						</button>
					</form>
				</div>
			</div>
		</main>
	);
}
