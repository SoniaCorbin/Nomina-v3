import express from "express";
import cors, { type CorsOptions } from "cors";
import dotenv from "dotenv";
import path from "path";

// Important!! en dev (ts-node): assure que l'augmentation Express (req.auth) est chargée.
import "./types/expressType";

import userRoutes from "./routes/userRoutes";
import authRoutes from "./routes/authRoutes";
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

dotenv.config();

const app = express();

app.use(express.json());
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

const envCorsOrigins = (process.env.CORS_ORIGINS ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigins = [
  ...envCorsOrigins,
  process.env.FRONTEND_URL,
  "https://nomina-v3.vercel.app",
  "http://localhost:5173", // dev Vite
  "http://localhost:3000", // tests locaux
].filter((origin): origin is string => Boolean(origin));

const vercelPreviewRegex = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i;

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Certains contextes (Electron/file://) n'envoient pas d'en-tête Origin.
    if (!origin) return callback(null, true);

    if (corsOrigins.includes(origin)) return callback(null, true);

    if (vercelPreviewRegex.test(origin)) return callback(null, true);

    return callback(new Error(`CORS: origin non autorisée: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

// CORS pour toutes les requêtes
app.use(cors(corsOptions));

app.get("/", (_req, res) => res.send("Nomina-backend running"));
app.get("/healthz", (_req, res) => res.json({ ok: true }));
app.get("/api", (_req, res) => res.json({ ok: true, scope: "api" }));
app.get("/api/index", (_req, res) => res.json({ ok: true, scope: "api-index" }));

function mountRoutes(prefix = "") {
  const withPrefix = (route: string) => (prefix ? `${prefix}${route}` : route);

  app.use(withPrefix("/generate"), GenerateRoutes);
  app.use(withPrefix("/users"), userRoutes);
  app.use(withPrefix("/auth"), authRoutes);
  app.use(withPrefix("/categories"), CategorieRoutes);
  app.use(withPrefix("/cultures"), CultureRoutes);
  app.use(withPrefix("/nomPersonnages"), NomPersonnageRoutes);
  app.use(withPrefix("/prenoms"), NomPersonnageRoutes);
  app.use(withPrefix("/nomFamilles"), NomFamilleRoutes);
  app.use(withPrefix("/personnages"), PersonnageRoutes);
  app.use(withPrefix("/fragmentsHistoire"), FragmentsHistoireRoutes);
  app.use(withPrefix("/titres"), TitreRoutes);
  app.use(withPrefix("/concepts"), ConceptRoutes);
  app.use(withPrefix("/creatures"), CreatureRoutes);
  app.use(withPrefix("/lieux"), LieuxRoutes);
  app.use(withPrefix("/univers"), UniversThematiqueRoutes);
  app.use(withPrefix("/socialClasses"), SocialClassRoutes);
  app.use(withPrefix("/socialclasses"), SocialClassRoutes);
  app.use(withPrefix("/social-classes"), SocialClassRoutes);
  app.use(withPrefix("/socialClass"), SocialClassRoutes);
  app.use(withPrefix("/occupations"), OccupationRoutes);
  app.use(withPrefix("/occupation"), OccupationRoutes);
  app.use(withPrefix("/organizations"), OrganizationRoutes);
  app.use(withPrefix("/organization"), OrganizationRoutes);
  app.use(withPrefix("/relationTypes"), RelationTypeRoutes);
  app.use(withPrefix("/relationtypes"), RelationTypeRoutes);
  app.use(withPrefix("/relation-types"), RelationTypeRoutes);
  app.use(withPrefix("/relationType"), RelationTypeRoutes);
  app.use(withPrefix("/events"), EventRoutes);
  app.use(withPrefix("/event"), EventRoutes);
}

mountRoutes();
mountRoutes("/api");
mountRoutes("/api/index");

export default app;
