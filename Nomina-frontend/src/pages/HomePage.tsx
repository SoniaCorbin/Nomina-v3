import logoUrl from "../../assets/logo5.png";

import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { UseCases } from "../components/UseCases";
import { ApiDemo } from "../components/ApiDemo";
import { Pricing } from "../components/Pricing";
import { Documentation } from "../components/Documentation";
import { Link } from "react-router-dom";

export function HomePage() {
	return (
		<div>
			{/* Hero existant */}
			<Hero />

			{/* Description générale */}
			<section className="relative py-16">
				<div className="container mx-auto px-4">
					<div className="grid lg:grid-cols-12 gap-10 items-start">
						<div className="lg:col-span-7 rounded-2xl border border-[#7b3ff2]/25 bg-[#2d1b4e]/45 p-6 backdrop-blur-sm">
							<h2 className="text-3xl md:text-4xl text-white" style={{ fontFamily: "Cinzel, serif" }}>
								Qu’est-ce que Nomina?
							</h2>
							<p className="mt-4 text-[#f3efff] leading-relaxed">
								Nomina est une plateforme de génération narrative qui aide à créer des éléments cohérents pour des univers de fiction:
								noms de personnages, concepts, lieux, cultures, titres, fragments d’histoire et univers thématiques. L’objectif est simple:
								accélérer l’idéation sans perdre le ton, la logique et le style.
							</p>
							<p className="mt-4 text-white leading-relaxed">
								Qu’il s’agisse d’un roman, d’une campagne de jeu de rôle, d’un worldbuilding ou d’un prototype créatif,
								Nomina fournit des propositions variées et “prêtes à utiliser”, tout en gardant une direction artistique forte.
							</p>

							<div className="mt-8 flex flex-wrap gap-3">
								<Link
									to="/docs"
									className="inline-flex items-center justify-center rounded-xl border border-[#d4c5f9]/70 bg-[#2d1b4e]/60 px-5 py-3 text-[#f3efff] hover:bg-[#2d1b4e]/80 hover:text-white transition-colors"
								>
									Lire la documentation
								</Link>
								<Link
									to="/generate"
									className="inline-flex items-center justify-center rounded-xl bg-[#7b3ff2] px-5 py-3 text-white hover:bg-[#a67be8] transition-colors"
								>
									Lancer une génération
								</Link>
							</div>
						</div>

						<div className="lg:col-span-5">
							<div className="relative rounded-2xl border border-[#7b3ff2]/25 bg-[#2d1b4e]/35 p-6 backdrop-blur-sm">
								<div className="flex items-center gap-3">
									<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#7b3ff2] to-[#a67be8] flex items-center justify-center">
										<img src={logoUrl} alt="Nomina" className="w-8 h-8 object-contain" draggable={false} />
									</div>
									<div>
										<div className="text-white font-semibold">Nomina, en une phrase</div>
										<div className="text-sm text-white">Créer, nommer et raconter — plus vite, mieux.</div>
									</div>
								</div>

								<div className="mt-6 grid gap-4">
									<div className="rounded-xl bg-[#1a0f33]/40 border border-[#7b3ff2]/15 p-4">
										<div className="text-white font-medium">Cohérence</div>
										<div className="text-sm text-[#f3efff] mt-1">
											Des sorties structurées (noms, genres, descriptions) pour garder un univers crédible.
										</div>
									</div>
									<div className="rounded-xl bg-[#1a0f33]/40 border border-[#7b3ff2]/15 p-4">
										<div className="text-white font-medium">Variété</div>
										<div className="text-sm text-[#f3efff] mt-1">
											Plusieurs propositions par requête pour explorer rapidement des directions créatives.
										</div>
									</div>
									<div className="rounded-xl bg-[#1a0f33]/40 border border-[#7b3ff2]/15 p-4">
										<div className="text-white font-medium">Mode hors‑ligne</div>
										<div className="text-sm text-[#f3efff] mt-1">
											En cas de coupure réseau, certaines actions peuvent être mises en attente (outbox).
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="mt-12 grid md:grid-cols-3 gap-6">
						{[ 
							{
								title: "Créer des univers",
								desc: "Définition de l’ambiance, des thèmes et des repères du monde. Nomina aide à poser des fondations solides.",
							},
							{
								title: "Nommer avec style",
								desc: "Génération de noms adaptés (culture, sonorités, genre) et réduction des incohérences d’un chapitre à l’autre.",
							},
							{
								title: "Raconter en fragments",
								desc: "Obtention de micro‑histoires, motivations et conflits pour alimenter intrigues et personnages.",
							},
						].map((card) => (
							<div
								key={card.title}
								className="rounded-2xl border border-[#7b3ff2]/30 bg-[#2d1b4e]/45 p-6 backdrop-blur-sm hover:bg-[#2d1b4e]/55 transition-colors"
							>
								<div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-[#7b3ff2] to-[#e8b4f0]" />
								<div className="mt-4 text-white text-lg font-semibold">{card.title}</div>
								<p className="mt-2 text-sm text-[#efe8ff] leading-relaxed">{card.desc}</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Sections existantes */}
			<Features />
			<UseCases />
			<ApiDemo />
			<Pricing />
			<Documentation />
		</div>
	);
}

