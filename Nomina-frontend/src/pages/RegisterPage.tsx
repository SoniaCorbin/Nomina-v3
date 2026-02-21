import { useSignUp, useUser } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { apiFetch } from "../lib/api";

export function RegisterPage() {
	const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
	const navigate = useNavigate();
	const { isSignedIn } = useUser();
	const { isLoaded, signUp, setActive } = useSignUp();
	const [accountType, setAccountType] = useState<"client" | "admin">("client");

	const [step, setStep] = useState<"form" | "verify-email">("form");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);
	const [resendCooldown, setResendCooldown] = useState(0);

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [emailCode, setEmailCode] = useState("");

	const canSubmit = useMemo(() => {
		if (pending) return false;
		if (isSignedIn) return false;
		if (step === "verify-email") return emailCode.trim().length > 0;
		return (
			firstName.trim().length > 0 &&
			lastName.trim().length > 0 &&
			email.trim().length > 0 &&
			password.trim().length >= 8 &&
			passwordConfirm.trim().length >= 8
		);
	}, [email, emailCode, firstName, isSignedIn, lastName, password, passwordConfirm, pending, step]);

	useEffect(() => {
		if (!clerkEnabled) return;
		if (isSignedIn) navigate("/dashboard", { replace: true });
	}, [clerkEnabled, isSignedIn, navigate]);

	useEffect(() => {
		if (resendCooldown <= 0) return;
		const timer = setInterval(() => {
			setResendCooldown((s) => (s > 0 ? s - 1 : 0));
		}, 1000);
		return () => clearInterval(timer);
	}, [resendCooldown]);

	function getClerkErrorMessage(e: any, fallback: string): string {
		const details = e?.errors?.[0];
		const base = details?.longMessage || details?.message || e?.message || fallback;
		const retryAfter = details?.meta?.retryAfterSeconds ?? details?.meta?.retry_after_seconds;
		if (typeof retryAfter === "number" && retryAfter > 0) {
			return `${base} Réessaie dans ${retryAfter}s.`;
		}
		return String(base);
	}

	async function handleSubmit() {
		if (!clerkEnabled) return;
		if (isSignedIn) return;
		if (!isLoaded) return;
		if (!signUp) return;

		setError(null);
		setInfo(null);
		if (step === "form" && password !== passwordConfirm) {
			setError("Les mots de passe ne correspondent pas.");
			return;
		}
		setPending(true);
		try {
			const maybeSubmitAdminRequest = async () => {
				if (accountType !== "admin") return;
				const displayName = `${firstName} ${lastName}`.trim();
				await apiFetch<{ status: string; message: string }>("/auth/admin-request", {
					method: "POST",
					body: {
						email: email.trim(),
						username: displayName || email.trim().split("@")[0],
					},
				});
			};

			if (step === "form") {
				await signUp.create({
					emailAddress: email.trim(),
					password: password,
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					...(phone.trim()
						? {
							phoneNumber: phone.trim(),
						}
						: {}),
				});

				// Selon la config Clerk, une vérification email peut être requise.
				// On tente email_code, sinon on laisse Clerk gérer d'autres stratégies.
				try {
					await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
					setStep("verify-email");
					setInfo(
						accountType === "admin"
							? "Un code de vérification a été envoyé. Après validation, la demande Admin sera soumise à Nomina."
							: "Un code de vérification a été envoyé par courriel."
					);
					return;
				} catch {
					// Si aucune vérification n'est requise, Clerk peut être déjà "complete".
					if (signUp.status === "complete") {
						await maybeSubmitAdminRequest();
						await setActive?.({ session: signUp.createdSessionId });
						navigate("/dashboard", { replace: true });
						return;
					}
					setError(
						"Inscription créée, mais une vérification additionnelle est requise selon la configuration Clerk."
					);
					return;
				}
			}

			// Step verify email
			const attempt = await signUp.attemptEmailAddressVerification({ code: emailCode.trim() });
			if (attempt.status === "complete") {
				await maybeSubmitAdminRequest();
				await setActive?.({ session: attempt.createdSessionId });
				navigate("/dashboard", { replace: true });
				return;
			}

			setError(
				`Vérification incomplète (statut: ${attempt.status}). Un nouveau code peut être envoyé via “Renvoyer le code”, puis validé à nouveau.`
			);
		} catch (e: any) {
			const msg =
				e?.errors?.[0]?.longMessage ||
				e?.errors?.[0]?.message ||
				e?.message ||
				"Impossible de créer le compte.";
			setError(String(msg));
		} finally {
			setPending(false);
		}
	}

	async function resendEmailCode() {
		if (!clerkEnabled) return;
		if (!isLoaded) return;
		if (!signUp) return;
		if (resendCooldown > 0) return;

		setError(null);
		setInfo(null);
		setPending(true);
		try {
			if (!signUp.emailAddress) {
				await signUp.create({
					emailAddress: email.trim(),
					password,
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					...(phone.trim()
						? {
							phoneNumber: phone.trim(),
						}
						: {}),
				});
			}

			await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
			setInfo("Nouveau code envoyé. Le plus récent doit être utilisé depuis la boîte courriel.");
			setResendCooldown(30);
		} catch (e: any) {
			const retryAfter = e?.errors?.[0]?.meta?.retryAfterSeconds ?? e?.errors?.[0]?.meta?.retry_after_seconds;
			if (typeof retryAfter === "number" && retryAfter > 0) {
				setResendCooldown(retryAfter);
			}
			setError(getClerkErrorMessage(e, "Impossible de renvoyer le code."));
		} finally {
			setPending(false);
		}
	}

	return (
		<main className="min-h-screen p-6 flex items-center justify-center bg-gradient-to-b from-[#d6c9ec] via-[#e3d7f1] to-[#ead5e2]">
			<div className="w-full max-w-[480px]">
				<h1 className="text-3xl font-semibold mb-4 text-[#2d1b4e]">Créer un compte</h1>
				<div className="flex gap-2 mb-4">
					<Button
						type="button"
						variant={accountType === "client" ? "default" : "outline"}
						className="flex-1"
						onClick={() => setAccountType("client")}
					>
						Compte Client
					</Button>
					<Button
						type="button"
						variant={accountType === "admin" ? "default" : "outline"}
						className="flex-1"
						onClick={() => setAccountType("admin")}
					>
						Demande Admin
					</Button>
				</div>
				{clerkEnabled && isSignedIn ? (
					<p className="text-sm text-[#4c3575] mb-4">Session déjà active. Redirection…</p>
				) : (
				<p className="text-sm text-[#4c3575] mb-4">
					Compte existant ? <Link to="/login" className="text-[#7b3ff2] hover:underline">Se connecter</Link>
				</p>
				)}
				<Card className="bg-white/96 border-[#bfa1ea] p-6 backdrop-blur-sm shadow-[0_14px_32px_rgba(74,36,130,0.18)]">
					{clerkEnabled ? (
						<div className="space-y-4">
							{error ? <p className="text-sm text-red-600">{error}</p> : null}
							{info ? <p className="text-sm text-emerald-700">{info}</p> : null}
							{accountType === "admin" ? (
								<p className="text-xs text-[#4c3575]">
									Le compte sera créé normalement, mais l’accès administrateur restera en attente jusqu’à approbation de l’équipe Nomina.
								</p>
							) : null}

							{step === "form" ? (
								<>
									<div>
										<label className="text-sm text-[#3b275f]">Prénom</label>
										<Input className="bg-white text-[#2d1b4e] border-[#bfa1ea]" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
									</div>
									<div>
										<label className="text-sm text-[#3b275f]">Nom</label>
										<Input className="bg-white text-[#2d1b4e] border-[#bfa1ea]" value={lastName} onChange={(e) => setLastName(e.target.value)} />
									</div>
									<div>
										<label className="text-sm text-[#3b275f]">Courriel</label>
										<Input className="bg-white text-[#2d1b4e] border-[#bfa1ea]" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
									</div>
									<div>
										<label className="text-sm text-[#3b275f]">Téléphone</label>
										<Input
											className="bg-white text-[#2d1b4e] border-[#bfa1ea] placeholder:text-[#7b6a9f]"
											value={phone}
											onChange={(e) => setPhone(e.target.value)}
											type="tel"
											placeholder="+1 555 555 5555"
										/>
										<p className="text-xs text-[#5b4a7f] mt-1">Optionnel (selon config Clerk).</p>
									</div>
									<div>
										<label className="text-sm text-[#3b275f]">Mot de passe</label>
										<Input className="bg-white text-[#2d1b4e] border-[#bfa1ea]" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
										<p className="text-xs text-[#5b4a7f] mt-1">Minimum 8 caractères.</p>
									</div>
									<div>
										<label className="text-sm text-[#3b275f]">Confirmation du mot de passe</label>
										<Input
											className="bg-white text-[#2d1b4e] border-[#bfa1ea]"
											value={passwordConfirm}
											onChange={(e) => setPasswordConfirm(e.target.value)}
											type="password"
										/>
										{passwordConfirm.length > 0 && password !== passwordConfirm ? (
											<p className="text-xs text-red-600 mt-1">Les mots de passe ne correspondent pas.</p>
										) : null}
									</div>
								</>
							) : (
								<div>
									<label className="text-sm text-[#3b275f]">Code reçu par courriel</label>
									<Input className="bg-white text-[#2d1b4e] border-[#bfa1ea]" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} inputMode="numeric" />
									<p className="text-xs text-[#5b4a7f] mt-1">Vérifier la boîte courriel (et le dossier spam).</p>
									<Button
										variant="outline"
										className="mt-3"
										onClick={() => resendEmailCode().catch(() => undefined)}
										disabled={pending || resendCooldown > 0}
									>
										{resendCooldown > 0 ? `Renvoyer le code (${resendCooldown}s)` : "Renvoyer le code"}
									</Button>
								</div>
							)}

							<Button onClick={() => handleSubmit().catch(() => undefined)} disabled={!canSubmit}>
								{pending ? "En cours…" : step === "form" ? "Créer le compte" : "Valider le code"}
							</Button>
						</div>
					) : (
						<div className="text-[#2d1b4e]">
							<p className="mb-2">L’authentification est désactivée.</p>
							<p className="text-sm opacity-80">
								Ajoute <code>VITE_CLERK_PUBLISHABLE_KEY</code> dans l’environnement pour activer l’inscription.
							</p>
						</div>
					)}
				</Card>
			</div>
		</main>
	);
}

