import { useClerk, useSignIn, useUser } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { apiFetch } from "../lib/api";

export function LoginPage() {
	const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
	const navigate = useNavigate();
	const { isSignedIn } = useUser();
	const clerk = useClerk();
	const { isLoaded, signIn, setActive } = useSignIn();
	const [accountType, setAccountType] = useState<"client" | "admin">("client");
	const [step, setStep] = useState<"choose" | "login">("choose");

	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const canSubmit = useMemo(() => {
		return !pending && !isSignedIn && email.trim().length > 0 && password.trim().length > 0;
	}, [email, isSignedIn, password, pending]);

	function startLoginStep(type: "client" | "admin") {
		setAccountType(type);
		setStep("login");
		setError(null);
	}

	useEffect(() => {
		if (!clerkEnabled) return;
		if (isSignedIn) navigate("/dashboard", { replace: true });
	}, [clerkEnabled, isSignedIn, navigate]);

	async function handleSubmit() {
		if (!clerkEnabled) return;
		if (isSignedIn) return;
		if (!isLoaded) return;
		if (!signIn) return;

		setError(null);
		setPending(true);
		try {
			const ensureAdminAccess = async () => {
				for (let i = 0; i < 15; i++) {
					try {
						const me = await apiFetch<{ userId: string; isAdmin: boolean }>("/auth/me", { cacheTtlMs: 0 });
						return me.isAdmin;
					} catch {
						await new Promise((r) => setTimeout(r, 300));
					}
				}
				return false;
			};

			const res = await signIn.create({ identifier: email.trim(), password });
			if (res.status === "complete") {
				await setActive?.({ session: res.createdSessionId });

				if (accountType === "admin") {
					const isAdmin = await ensureAdminAccess();
					if (!isAdmin) {
						await clerk.signOut().catch(() => undefined);
						setError("Impossible de valider les droits admin (session expirée ou droits insuffisants). Reconnexion requise puis nouvel essai.");
						return;
					}
				}

				navigate(accountType === "admin" ? "/admin" : "/dashboard", { replace: true });
				return;
			}

			const openSignIn = (clerk as unknown as { openSignIn?: (opts?: unknown) => Promise<void> }).openSignIn;
			if (openSignIn) {
				await openSignIn({
					redirectUrl: "/sso-callback",
					afterSignInUrl: accountType === "admin" ? "/admin" : "/dashboard",
				});
				return;
			}

			setError(
				"Une vérification supplémentaire est requise (ex. 2FA). Finaliser la connexion via l’interface Clerk, puis relancer l’essai."
			);
		} catch (e: any) {
			const msg =
				e?.errors?.[0]?.longMessage ||
				e?.errors?.[0]?.message ||
				e?.message ||
				"Impossible de se connecter.";
			setError(String(msg));
		} finally {
			setPending(false);
		}
	}

	async function startOAuth(strategy: "oauth_google" | "oauth_facebook" | "oauth_github") {
		if (!clerkEnabled) return;
		if (!isLoaded) return;
		if (!signIn) return;
		setError(null);
		try {
			await signIn.authenticateWithRedirect({
				strategy,
				redirectUrl: "/sso-callback",
				redirectUrlComplete: accountType === "admin" ? "/admin" : "/dashboard",
			});
		} catch (e: any) {
			const msg =
				e?.errors?.[0]?.longMessage ||
				e?.errors?.[0]?.message ||
				e?.message ||
				"Impossible de démarrer la connexion OAuth.";
			setError(String(msg));
		}
	}

	return (
		<main className="min-h-screen p-6 bg-gradient-to-b from-[#171029] via-[#24193f] to-[#171029] text-[#f3efff]">
			<div className="w-full max-w-6xl mx-auto py-6">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-semibold mb-2 text-white">Accès à l’espace</h1>
					<p className="text-sm text-[#b9a3e3]">Sélection du type de compte pour commencer</p>
				</div>
				{clerkEnabled && isSignedIn ? (
					<p className="text-sm text-[#b9a3e3] mb-4">Session déjà active. Redirection…</p>
				) : (
					<p className="text-sm text-[#b9a3e3] mb-6 text-center">
						Pas encore de compte ?{" "}
						<Link to="/register" className="text-[#7b3ff2] hover:underline">
							S’inscrire
						</Link>
					</p>
				)}

				{step === "choose" ? (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
					<Card
						className={`relative overflow-hidden p-6 border-[#4c2d79] bg-gradient-to-br from-[#1a1230] to-[#120d24] text-[#e7defc] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(45,27,78,0.45)] ${accountType === "client" ? "ring-2 ring-[#7b3ff2] shadow-[0_12px_30px_rgba(123,63,242,0.28)]" : ""}`}
						onClick={() => startLoginStep("client")}
					>
						<div className="pointer-events-none absolute -top-14 -right-10 h-36 w-36 rounded-full bg-[#7b3ff2]/20 blur-2xl" />
						<div className="pointer-events-none absolute -bottom-16 -left-8 h-28 w-28 rounded-full bg-[#5c2bb8]/20 blur-xl" />
						<div className="w-12 h-12 rounded-full bg-[#2f1d55] border border-[#5f34a8] flex items-center justify-center text-[#cdb7ff] text-xl mb-4">👤</div>
						<h2 className="text-2xl font-semibold mb-3 text-white">Compte Client</h2>
						<p className="text-[#b9a3e3] mb-4">Réservation, génération et collaboration sur des univers narratifs.</p>
						<ul className="space-y-2 text-sm mb-5">
							<li>• Génération de noms et concepts</li>
							<li>• Historique des essais</li>
							<li>• Gestion du profil</li>
							<li>• Accès rapide au dashboard</li>
						</ul>
						<Button
							className="w-full"
							variant={accountType === "client" ? "default" : "outline"}
							onClick={() => startLoginStep("client")}
						>
							Accéder au compte
						</Button>
					</Card>

					<Card
						className={`relative overflow-hidden p-6 border-[#4c2d79] bg-gradient-to-br from-[#1a1230] to-[#120d24] text-[#e7defc] cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(45,27,78,0.45)] ${accountType === "admin" ? "ring-2 ring-[#7b3ff2] shadow-[0_12px_30px_rgba(123,63,242,0.28)]" : ""}`}
						onClick={() => startLoginStep("admin")}
					>
						<div className="pointer-events-none absolute -top-14 -right-10 h-36 w-36 rounded-full bg-[#7b3ff2]/20 blur-2xl" />
						<div className="pointer-events-none absolute -bottom-16 -left-8 h-28 w-28 rounded-full bg-[#5c2bb8]/20 blur-xl" />
						<div className="w-12 h-12 rounded-full bg-[#2f1d55] border border-[#5f34a8] flex items-center justify-center text-[#cdb7ff] text-xl mb-4">⚙️</div>
						<h2 className="text-2xl font-semibold mb-3 text-white">Compte Administrateur</h2>
						<p className="text-[#b9a3e3] mb-4">Gérez les données Nomina, les utilisateurs et la cohérence du contenu.</p>
						<ul className="space-y-2 text-sm mb-5">
							<li>• Gestion complète des ressources</li>
							<li>• Administration des utilisateurs</li>
							<li>• Contrôle des contenus générés</li>
							<li>• Vue globale de la plateforme</li>
						</ul>
						<Button
							className="w-full"
							variant={accountType === "admin" ? "default" : "outline"}
							onClick={() => startLoginStep("admin")}
						>
							Espace administrateur
						</Button>
					</Card>
				</div>
				) : null}

				{step === "login" ? (
				<Card
					className={`relative overflow-hidden p-6 max-w-[560px] mx-auto border-[#4c2d79] bg-gradient-to-br from-[#1a1230] to-[#120d24] text-[#e7defc] shadow-[0_10px_30px_rgba(45,27,78,0.45)] ${accountType === "client" ? "ring-2 ring-[#7b3ff2]" : "ring-2 ring-[#5f34a8]"}`}
				>
					<div className="pointer-events-none absolute -top-14 -right-10 h-36 w-36 rounded-full bg-[#7b3ff2]/20 blur-2xl" />
					<div className="pointer-events-none absolute -bottom-16 -left-8 h-28 w-28 rounded-full bg-[#5c2bb8]/20 blur-xl" />
					<div className="mb-3">
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								setStep("choose");
								setError(null);
							}}
						>
							← Retour
						</Button>
					</div>
					<h3 className="text-lg font-semibold mb-4 text-white">
						{accountType === "admin" ? "Connexion Administrateur" : "Connexion Client"}
					</h3>
					{clerkEnabled ? (
						<div className="space-y-4">
							{error ? <p className="text-sm text-red-600">{error}</p> : null}
							<div className="space-y-2">
								<p className="text-sm text-[#b9a3e3]">Se connecter avec</p>
								<div className="flex flex-col gap-2">
									<Button
										variant="outline"
										onClick={() => startOAuth("oauth_google").catch(() => undefined)}
										disabled={pending}
									>
										Google
									</Button>
									<Button
										variant="outline"
										onClick={() => startOAuth("oauth_github").catch(() => undefined)}
										disabled={pending}
									>
										GitHub
									</Button>
									<Button
										variant="outline"
										onClick={() => startOAuth("oauth_facebook").catch(() => undefined)}
										disabled={pending}
									>
										Facebook
									</Button>
								</div>
								<p className="text-xs text-[#b39ddf]">
									Ces options apparaissent seulement si elles sont activées dans Clerk.
								</p>
							</div>
							<div className="h-px bg-[#3d2a63]" />
							<div>
								<label className="text-sm text-[#b9a3e3]">Courriel</label>
								<Input
									className="bg-[#f4efff] text-[#2b1748] placeholder:text-[#6f4da5] border-[#bda3ec]"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									type="email"
								/>
							</div>
							<div>
								<label className="text-sm text-[#b9a3e3]">Mot de passe</label>
								<Input
									className="bg-[#f4efff] text-[#2b1748] placeholder:text-[#6f4da5] border-[#bda3ec]"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									type="password"
								/>
							</div>
							<Button onClick={() => handleSubmit().catch(() => undefined)} disabled={!canSubmit}>
								{pending
									? "Connexion…"
									: accountType === "admin"
										? "Accéder à l’espace administrateur"
										: "Accéder à mon compte"}
							</Button>
						</div>
					) : (
						<div className="text-[#e7defc]">
							<p className="mb-2">L’authentification est désactivée.</p>
							<p className="text-sm text-[#b9a3e3]">
								Ajoute <code>VITE_CLERK_PUBLISHABLE_KEY</code> dans l’environnement pour activer la connexion.
							</p>
						</div>
					)}
				</Card>
				) : null}
			</div>
		</main>
	);
}

