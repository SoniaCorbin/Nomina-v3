import express from "express";
import cors, { type CorsOptions } from "cors";
import dotenv from "dotenv";

// Important!! en dev (ts-node): assure que l'augmentation Express (req.auth) est chargée.
import "./types/expressType";

import UserRoutes from "./routes/UserRoutes";
import AuthRoutes from "./routes/AuthRoutes";
import CategorieRoutes from "./routes/CategorieRoutes";
import CultureRoutes from "./routes/CultureRoutes";
import NomPersonnageRoutes from "./routes/NomPersonnageRoutes";
import FragmentsHistoireRoutes from "./routes/FragmentsHistoireRoutes";
import TitreRoutes from "./routes/TitreRoutes";
import ConceptRoutes from "./routes/ConceptRoutes";
import CreatureRoutes from "./routes/CreatureRoutes";
import GenerateRoutes from "./routes/GenerateRoutes";
import UniversThematiqueRoutes from "./routes/UniversThematiqueRoutes";
import LieuxRoutes from "./routes/LieuxRoutes";
import NomFamilleRoutes from "./routes/NomFamilleRoutes";
import PersonnageRoutes from "./routes/PersonnageRoutes";
import SocialClassRoutes from "./routes/SocialClassRoutes";
import OccupationRoutes from "./routes/OccupationRoutes";
import OrganizationRoutes from "./routes/OrganizationRoutes";
import RelationTypeRoutes from "./routes/RelationTypeRoutes";
import EventRoutes from "./routes/EventRoutes";
import GeneratePackRoutes from "./routes/GeneratePackRoutes";
import BillingRoutes from "./routes/BillingRoutes";

import { getUploadsRootDir } from "./utils/uploads";
import prisma from "./utils/prisma";
import { logger } from "./utils/logger";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { requestId, securityHeaders } from "./middleware/security.middleware";
import { globalLimiter } from "./middleware/rateLimit.middleware";

dotenv.config();

const app = express();

// 1) Sécurité d'abord — pose les en-têtes avant tout traitement.
app.use(securityHeaders);
app.use(requestId);

// 2) Body parsers avec limites explicites (refuse les bodies géants).
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// 3) Rate limit global (filet de sécurité — ne touche pas l'UX normale).
app.use(globalLimiter);

// 4) Statique uploads avec un CORS permissif (servi par helmet en cross-origin).
app.use("/uploads", express.static(getUploadsRootDir()));

// 5) CORS — liste durcie, plus de wildcard *.vercel.app.
const envCorsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigins = [
  ...envCorsOrigins,
  process.env.FRONTEND_URL,
  "https://nomina-v3.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
].filter((origin): origin is string => Boolean(origin));

// On accepte uniquement les previews Vercel du projet Nomina, pas n'importe
// quelle URL *.vercel.app (qui laissait n'importe quel projet appeler l'API).
const nominaPreviewRegex = /^https:\/\/nomina-v3(-[a-z0-9-]+)?\.vercel\.app$/i;

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Electron / file:// / curl
    if (corsOrigins.includes(origin)) return callback(null, true);
    if (nominaPreviewRegex.test(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin non autorisée: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
  exposedHeaders: ["X-Request-Id"],
};

app.use(cors(corsOptions));

// 6) Endpoints racine
app.get("/", (_req, res) => {
  res.json({ ok: true, service: "Nomina-backend", version: "v4" });
});

/**
 * Healthz "deep" — ping Prisma avec un timeout court. Si la DB est down,
 * renvoie 503 plutôt qu'un faux positif.
 */
app.get("/healthz", async (req, res) => {
  const start = Date.now();
  try {
    await Promise.race([
      prisma.$queryRawUnsafe("SELECT 1"),
      new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error("DB timeout")), 1500),
      ),
    ]);
    res.json({ ok: true, db: "up", latencyMs: Date.now() - start });
  } catch (err) {
    logger.error("healthz: DB unreachable", { err, reqId: (req as any).id });
    res.status(503).json({ ok: false, db: "down", latencyMs: Date.now() - start });
  }
});

app.get("/api", (_req, res) => res.json({ ok: true, scope: "api" }));

// 7) Routes — un seul montage sous /api (canonique). Les anciens chemins
// sans préfixe sont redirigés en 308 pour préserver les anciens clients
// pendant la migration. Supprime ce bloc quand le front aura migré.
const LEGACY_ROUTES = [
  "generate",
  "generate-pack",
  "users",
  "auth",
  "categories",
  "cultures",
  "nomPersonnages",
  "nomFamilles",
  "personnages",
  "fragmentsHistoire",
  "titres",
  "concepts",
  "creatures",
  "lieux",
  "univers",
  "socialClasses",
  "occupations",
  "organizations",
  "relationTypes",
  "events",
] as const;

for (const route of LEGACY_ROUTES) {
  app.use(`/${route}`, (req, res) => {
    res.setHeader("Deprecation", "true");
    res.setHeader("Link", `</api/${route}>; rel="successor-version"`);
    return res.redirect(308, `/api/${route}${req.url === "/" ? "" : req.url}`);
  });
}

app.use("/api/generate", GenerateRoutes);
app.use("/api/generate-pack", GeneratePackRoutes);
app.use("/api/users", UserRoutes);
app.use("/api/auth", AuthRoutes);
app.use("/api/categories", CategorieRoutes);
app.use("/api/cultures", CultureRoutes);
app.use("/api/nomPersonnages", NomPersonnageRoutes);
app.use("/api/nomFamilles", NomFamilleRoutes);
app.use("/api/personnages", PersonnageRoutes);
app.use("/api/fragmentsHistoire", FragmentsHistoireRoutes);
app.use("/api/titres", TitreRoutes);
app.use("/api/concepts", ConceptRoutes);
app.use("/api/creatures", CreatureRoutes);
app.use("/api/lieux", LieuxRoutes);
app.use("/api/univers", UniversThematiqueRoutes);
app.use("/api/socialClasses", SocialClassRoutes);
app.use("/api/occupations", OccupationRoutes);
app.use("/api/organizations", OrganizationRoutes);
app.use("/api/relationTypes", RelationTypeRoutes);
app.use("/api/events", EventRoutes);
app.use("/api/billing", BillingRoutes);

// 8) 404 + gestionnaire d'erreurs — DOIT être en dernier.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
