import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../lib/api";
import type { PersistPackSummary } from "../lib/packPersistence";
import { PackIAPage } from "./PackIAPage";

const mocks = vi.hoisted(() => ({
  apiFetch: vi.fn(),
  persistPackResult: vi.fn(),
}));

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual<typeof import("../lib/api")>("../lib/api");
  return {
    ...actual,
    apiFetch: mocks.apiFetch,
  };
});

vi.mock("../lib/packPersistence", async () => {
  const actual = await vi.importActual<typeof import("../lib/packPersistence")>("../lib/packPersistence");
  return {
    ...actual,
    persistPackResult: mocks.persistPackResult,
  };
});

function makeEmptySections() {
  return {
    personnages: [],
    lieux: [],
    organizations: [],
    events: [],
    creatures: [],
    fragmentsHistoire: [],
    titres: [],
    concepts: [],
  };
}

function makeSummary(partial?: Partial<PersistPackSummary>): PersistPackSummary {
  return {
    attempted: 1,
    created: 1,
    failed: 0,
    perSection: {
      personnages: { attempted: 1, created: 1, failed: 0 },
      lieux: { attempted: 0, created: 0, failed: 0 },
      organizations: { attempted: 0, created: 0, failed: 0 },
      events: { attempted: 0, created: 0, failed: 0 },
      creatures: { attempted: 0, created: 0, failed: 0 },
      fragmentsHistoire: { attempted: 0, created: 0, failed: 0 },
      titres: { attempted: 0, created: 0, failed: 0 },
      concepts: { attempted: 0, created: 0, failed: 0 },
    },
    errors: [],
    ...partial,
  };
}

describe("PackIAPage", () => {
  beforeEach(() => {
    mocks.apiFetch.mockReset();
    mocks.persistPackResult.mockReset();
  });

  it("affiche les résultats puis le résumé de sauvegarde", async () => {
    const generatedResult = {
      meta: { language: "fr", model: "gpt-5.4" },
      result: {
        ...makeEmptySections(),
        personnages: [{ prenom: "Aeryn", genre: "F" }],
      },
    };

    mocks.apiFetch.mockResolvedValueOnce(generatedResult);
    mocks.persistPackResult.mockResolvedValueOnce(makeSummary());

    render(<PackIAPage />);

    fireEvent.click(screen.getByRole("button", { name: /générer/i }));

    expect(await screen.findByText("Résultats")).toBeInTheDocument();
    expect(screen.getByText("Aeryn")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /enregistrer en base/i }));

    expect(await screen.findByText(/Enregistrement terminé: 1\/1 créés, 0 en échec\./i)).toBeInTheDocument();
    expect(mocks.persistPackResult).toHaveBeenCalledWith(mocks.apiFetch, generatedResult.result);
  });

  it("affiche le message d’erreur de génération renvoyé par l’API", async () => {
    mocks.apiFetch.mockRejectedValueOnce(new ApiError("Génération refusée", 500));

    render(<PackIAPage />);

    fireEvent.click(screen.getByRole("button", { name: /générer/i }));

    expect(await screen.findByText("Génération refusée")).toBeInTheDocument();
  });

  it("affiche l’erreur de sauvegarde sans perdre les résultats", async () => {
    mocks.apiFetch.mockResolvedValueOnce({
      meta: { language: "fr", model: "gpt-5.4" },
      result: {
        ...makeEmptySections(),
        concepts: [{ nom: "Rédemption", type: "thème" }],
      },
    });
    mocks.persistPackResult.mockRejectedValueOnce(new Error("Accès refusé"));

    render(<PackIAPage />);

    fireEvent.click(screen.getByRole("button", { name: /générer/i }));
    expect(await screen.findByText("Rédemption")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /enregistrer en base/i }));

    expect(await screen.findByText("Accès refusé")).toBeInTheDocument();
    expect(screen.getByText("Rédemption")).toBeInTheDocument();
  });
});