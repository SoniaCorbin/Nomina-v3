import { useSignUp, useUser } from "@clerk/clerk-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { apiFetch } from "../lib/api";
import { getClerkErrorMessage, getClerkRetryAfterSeconds, isClerkAlreadyVerifiedError } from "../lib/error-utils";

type MissingRequirementsAttempt = {
	missingFields?: unknown;
	unverifiedFields?: unknown;
};

export function RegisterPage() {
	const clerkEnabled = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
	const navigate = useNavigate();
	const { isSignedIn } = useUser();
	const { isLoaded, signUp, setActive } = useSignUp();
	const [accountType, setAccountType] = useState<"client" | "admin" | null>(null);

	const [step, setStep] = useState<"form" | "verify-email">("form");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);
	const [resendCooldown, setResendCooldown] = useState(0);

	const [firstName, setFirstName] = useState("");
	const [lastName, setLastName] = useState("");
	const [username, setUsername] = useState("");
	const [email, setEmail] = useState("");
	const [phone, setPhone] = useState("");
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");
	const [emailCode, setEmailCode] = useState("");

	function normalizeEmailCode(raw: string): string {
		return raw.replace(/[\s-]/g, "").trim();
	}

	function buildUsername(): string {
		const normalizedPreferred = username
			.trim()
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.replace(/[^a-z0-9_-]+/g, "")
			.slice(0, 24);

		if (normalizedPreferred.length >= 3) {
			return normalizedPreferred;
		}

		const rawBase = `${firstName}-${lastName}`.trim() || email.trim().split("@")[0] || "nomina-user";
		const slug = rawBase
			.normalize("NFD")
			.replace(/[\u0300-\u036f]/g, "")
			.toLowerCase()
			.replace(/[^a-z0-9_-]+/g, "")
			.slice(0, 24);

		const safeBase = slug.length >= 3 ? slug : "nomina-user";
		const suffix = Math.random().toString(36).slice(2, 8);
		return `${safeBase}-${suffix}`;
	}

	const canSubmit = useMemo(() => {
		if (pending) return false;
		if (isSignedIn) return false;
		if (step === "verify-email") return normalizeEmailCode(emailCode).length >= 4;
		return (
			accountType !== null &&
			firstName.trim().length > 0 &&
			lastName.trim().length > 0 &&
			email.trim().length > 0 &&
			password.trim().length >= 8 &&
			passwordConfirm.trim().length >= 8
		);
	}, [accountType, email, emailCode, firstName, isSignedIn, lastName, password, passwordConfirm, pending, step]);

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

	function getAttemptRequirements(attempt: MissingRequirementsAttempt): string[] {
		const missingFields = Array.isArray(attempt.missingFields) ? attempt.missingFields : [];
		const unverifiedFields = Array.isArray(attempt.unverifiedFields) ? attempt.unverifiedFields : [];

		return [...missingFields, ...unverifiedFields].filter((value): value is string => typeof value === "string");
	}

	async function completeAlreadyVerifiedFlow() {
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

		if (signUp?.createdSessionId) {
			await setActive?.({ session: signUp.createdSessionId });
			if (accountType === "admin") {
				try {
					await maybeSubmitAdminRequest();
				} catch {
					setInfo("Compte vérifié. La demande Administrateur n’a pas pu être envoyée automatiquement.");
				}
			}
			navigate("/dashboard", { replace: true });
			return;
		}

		setInfo("Adresse déjà vérifiée. Connecte-toi pour terminer l’accès.");
		navigate("/login", { replace: true });
	}

	async function handleSubmit() {
		if (!clerkEnabled) return;
		if (isSignedIn) return;
		if (!isLoaded) return;
		if (!signUp) return;

		setError(null);
		setInfo(null);
		if (step === "form" && !accountType) {
			setError("Choisis d’abord un type d’inscription: Client ou Administrateur.");
			return;
		}
		if (step === "form" && password !== passwordConfirm) {
			setError("Les mots de passe ne correspondent pas.");
			return;
		}

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

		setPending(true);
		try {
			if (step === "form") {
				const username = buildUsername();
				const normalizedPhone = phone.trim();
				await signUp.create({
					emailAddress: email.trim(),
					password: password,
					username,
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					...(normalizedPhone.length > 0 ? { phoneNumber: normalizedPhone } : {}),
				});

				// Selon la config Clerk, une vérification email peut être requise.
				// On tente email_code, sinon on laisse Clerk gérer d'autres stratégies.
				try {
					await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
					setStep("verify-email");
					setInfo(
						accountType === "admin"
							? "Un code de vérification a été envoyé. Après validation, la demande Administrateur sera soumise à Nomina."
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
			const normalizedCode = normalizeEmailCode(emailCode);
			if (!normalizedCode) {
				setError("Le code de vérification est requis.");
				return;
			}

			const attempt = await signUp.attemptEmailAddressVerification({ code: normalizedCode });
			if (attempt.status === "complete") {
				await setActive?.({ session: attempt.createdSessionId });

				if (accountType === "admin") {
					try {
						await maybeSubmitAdminRequest();
					} catch {
						setInfo(
							"Compte vérifié et session ouverte. La demande Administrateur n’a pas pu être envoyée automatiquement; réessaie depuis le formulaire ou contacte l’équipe Nomina."
						);
					}
				}

				navigate("/dashboard", { replace: true });
				return;
			}

			if (attempt.status === "missing_requirements") {
				const details = getAttemptRequirements(attempt).join(", ");
				setError(
					details.length > 0
						? `Vérification incomplète: exigences Clerk manquantes (${details}). Vérifie les champs requis dans Clerk (email, téléphone, etc.), puis renvoie un code.`
						: "Vérification incomplète: exigences Clerk manquantes. Vérifie les champs requis dans Clerk (email, téléphone, etc.), puis renvoie un code."
				);
				return;
			}

			setError(
				`Vérification incomplète (statut: ${attempt.status}). Un nouveau code peut être envoyé via “Renvoyer le code”, puis validé à nouveau.`
			);
		} catch (error) {
			if (step === "verify-email") {
				if (isClerkAlreadyVerifiedError(error)) {
					await completeAlreadyVerifiedFlow();
					return;
				}
				setError(getClerkErrorMessage(error, "Code invalide ou expiré. Demande un nouveau code."));
			} else {
				setError(getClerkErrorMessage(error, "Impossible de créer le compte."));
			}
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
				const username = buildUsername();
				const normalizedPhone = phone.trim();
				await signUp.create({
					emailAddress: email.trim(),
					password,
					username,
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					...(normalizedPhone.length > 0 ? { phoneNumber: normalizedPhone } : {}),
				});
			}

			await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
			setInfo("Nouveau code envoyé. Le plus récent doit être utilisé depuis la boîte courriel.");
			setResendCooldown(30);
		} catch (error) {
			if (isClerkAlreadyVerifiedError(error)) {
				await completeAlreadyVerifiedFlow();
				return;
			}
			const retryAfter = getClerkRetryAfterSeconds(error);
			if (retryAfter) {
				setResendCooldown(retryAfter);
			}
			setError(getClerkErrorMessage(error, "Impossible de renvoyer le code."));
		} finally {
			setPending(false);
		}
	}

	return (
		<main className="relative min-h-screen overflow-hidden p-6 flex items-center justify-center bg-gradient-to-br from-[#f7f1ff] via-[#e7dbf9] to-[#f4d9ea] dark:from-[#100a1d] dark:via-[#1a1230] dark:to-[#23163c]">
			<div className="pointer-events-none absolute inset-0">
				<div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-[#d7b4ff]/45 blur-3xl dark:bg-[#6a3bb7]/30" />
				<div className="absolute top-1/3 -right-24 h-80 w-80 rounded-full bg-[#f7bdd7]/40 blur-3xl dark:bg-[#8b3f75]/25" />
				<div className="absolute -bottom-28 left-1/3 h-80 w-80 rounded-full bg-[#cbb8ff]/35 blur-3xl dark:bg-[#4b2a82]/30" />
				<div className="absolute inset-0 bg-gradient-to-t from-white/35 via-transparent to-transparent dark:from-black/25" />
			</div>

			<div className="relative z-10 w-full max-w-[480px]">
				<h1 className="text-3xl font-semibold mb-4 text-[#2d1b4e] dark:text-white">Créer un compte</h1>
				<p className="text-sm font-medium text-[#2d1b4e] dark:text-[#e7defc] mb-2">Quel type d’inscription voulez-vous ?</p>
				<div className="grid grid-cols-1 gap-2 mb-2">
					<Button
						type="button"
						variant={accountType === "client" ? "default" : "outline"}
						className={`h-auto py-3 px-3 justify-start text-left whitespace-normal transition-all duration-200 cursor-pointer ${
							accountType === "client"
								? "ring-2 ring-[#7b3ff2] shadow-[0_10px_24px_rgba(123,63,242,0.28)]"
								: "hover:-translate-y-0.5 hover:border-[#7b3ff2] hover:bg-[#f3eaff] hover:shadow-[0_10px_24px_rgba(123,63,242,0.16)] dark:hover:bg-[#2a1b47]"
						}`}
						disabled={pending || step === "verify-email"}
						onClick={() => setAccountType("client")}
					>
						<div>
							<div className="font-medium">Inscription Client</div>
							<div className="text-xs opacity-90">Accès aux fonctions utilisateur</div>
						</div>
					</Button>
					<Button
						type="button"
						variant={accountType === "admin" ? "default" : "outline"}
						className={`h-auto py-3 px-3 justify-start text-left whitespace-normal transition-all duration-200 cursor-pointer ${
							accountType === "admin"
								? "ring-2 ring-[#7b3ff2] shadow-[0_10px_24px_rgba(123,63,242,0.28)]"
								: "hover:-translate-y-0.5 hover:border-[#7b3ff2] hover:bg-[#f3eaff] hover:shadow-[0_10px_24px_rgba(123,63,242,0.16)] dark:hover:bg-[#2a1b47]"
						}`}
						disabled={pending || step === "verify-email"}
						onClick={() => setAccountType("admin")}
					>
						<div>
							<div className="font-medium">Inscription Administrateur</div>
							<div className="text-xs opacity-90">Soumettre une demande d’accès administrateur</div>
						</div>
					</Button>
				</div>
				{accountType ? (
					<p className="text-xs text-[#4c3575] dark:text-[#b9a3e3] mb-4">
						Choix actuel: {accountType === "client" ? "Inscription Client" : "Inscription Administrateur"}.
					</p>
				) : null}
				{!accountType ? (
					<p className="text-xs text-[#5b4a7f] dark:text-[#b9a3e3] mb-4">Sélectionne le type d’inscription avant de continuer.</p>
				) : null}
				{clerkEnabled && isSignedIn ? (
					<p className="text-sm text-[#4c3575] dark:text-[#b9a3e3] mb-4">Session déjà active. Redirection…</p>
				) : (
				<p className="text-sm text-[#4c3575] dark:text-[#b9a3e3] mb-4">
					Compte existant ? <Link to="/login" className="text-[#7b3ff2] hover:underline">Se connecter</Link>
				</p>
				)}
				<Card className="bg-white/96 border-[#bfa1ea] p-6 backdrop-blur-sm shadow-[0_14px_32px_rgba(74,36,130,0.18)] dark:bg-[#1a1230] dark:border-[#4c2d79] dark:text-[#e7defc] dark:shadow-[0_10px_30px_rgba(45,27,78,0.45)]">
					{clerkEnabled ? (
						<div className="space-y-4">
							{error ? <p className="text-sm text-red-600">{error}</p> : null}
							{info ? <p className="text-sm text-emerald-700">{info}</p> : null}
							{accountType === "admin" ? (
								<p className="text-xs text-[#4c3575] dark:text-[#b9a3e3]">
									Le compte sera créé normalement, mais l’accès Administrateur restera en attente jusqu’à approbation de l’équipe Nomina.
								</p>
							) : null}

							{step === "form" ? (
								<>
									<div>
										<label className="text-sm text-[#3b275f] dark:text-[#b9a3e3]">Nom d’utilisateur (username)</label>
										<Input
											className="bg-white text-[#2d1b4e] border-[#bfa1ea] placeholder:text-[#7b6a9f] dark:bg-[#f4efff] dark:text-[#2b1748] dark:placeholder:text-[#6f4da5] dark:border-[#bda3ec]"
											value={username}
											onChange={(e) => setUsername(e.target.value)}
											placeholder="Ex: luna.noctis"
										/>
										<p className="text-xs text-[#5b4a7f] dark:text-[#b9a3e3] mt-1">Optionnel: laisse vide pour génération automatique. Tu pourras aussi le modifier plus tard dans ton profil.</p>
									</div>
									<div>
										<label className="text-sm text-[#3b275f] dark:text-[#b9a3e3]">Prénom</label>
										<Input className="bg-white text-[#2d1b4e] border-[#bfa1ea] dark:bg-[#f4efff] dark:text-[#2b1748] dark:placeholder:text-[#6f4da5] dark:border-[#bda3ec]" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
									</div>
									<div>
										<label className="text-sm text-[#3b275f] dark:text-[#b9a3e3]">Nom</label>
										<Input className="bg-white text-[#2d1b4e] border-[#bfa1ea] dark:bg-[#f4efff] dark:text-[#2b1748] dark:placeholder:text-[#6f4da5] dark:border-[#bda3ec]" value={lastName} onChange={(e) => setLastName(e.target.value)} />
									</div>
									<div>
										<label className="text-sm text-[#3b275f] dark:text-[#b9a3e3]">Courriel</label>
										<Input className="bg-white text-[#2d1b4e] border-[#bfa1ea] dark:bg-[#f4efff] dark:text-[#2b1748] dark:placeholder:text-[#6f4da5] dark:border-[#bda3ec]" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
									</div>
									<div>
										<label className="text-sm text-[#3b275f] dark:text-[#b9a3e3]">Téléphone</label>
										<Input
											className="bg-white text-[#2d1b4e] border-[#bfa1ea] placeholder:text-[#7b6a9f] dark:bg-[#f4efff] dark:text-[#2b1748] dark:placeholder:text-[#6f4da5] dark:border-[#bda3ec]"
											value={phone}
											onChange={(e) => setPhone(e.target.value)}
											type="tel"
											placeholder="+1 555 555 5555"
										/>
										<p className="text-xs text-[#5b4a7f] dark:text-[#b9a3e3] mt-1">Optionnel (non requis pour l’inscription actuelle).</p>
									</div>
									<div>
										<label className="text-sm text-[#3b275f] dark:text-[#b9a3e3]">Mot de passe</label>
										<Input className="bg-white text-[#2d1b4e] border-[#bfa1ea] dark:bg-[#f4efff] dark:text-[#2b1748] dark:placeholder:text-[#6f4da5] dark:border-[#bda3ec]" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
										<p className="text-xs text-[#5b4a7f] dark:text-[#b9a3e3] mt-1">Minimum 8 caractères, et évite un mot de passe déjà utilisé ailleurs.</p>
									</div>
									<div>
										<label className="text-sm text-[#3b275f] dark:text-[#b9a3e3]">Confirmation du mot de passe</label>
										<Input
											className="bg-white text-[#2d1b4e] border-[#bfa1ea] dark:bg-[#f4efff] dark:text-[#2b1748] dark:placeholder:text-[#6f4da5] dark:border-[#bda3ec]"
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
									<label className="text-sm text-[#3b275f] dark:text-[#b9a3e3]">Code reçu par courriel</label>
									<Input className="bg-white text-[#2d1b4e] border-[#bfa1ea] dark:bg-[#f4efff] dark:text-[#2b1748] dark:placeholder:text-[#6f4da5] dark:border-[#bda3ec]" value={emailCode} onChange={(e) => setEmailCode(e.target.value)} inputMode="numeric" />
									<p className="text-xs text-[#5b4a7f] dark:text-[#b9a3e3] mt-1">Vérifier la boîte courriel (et le dossier spam).</p>
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

