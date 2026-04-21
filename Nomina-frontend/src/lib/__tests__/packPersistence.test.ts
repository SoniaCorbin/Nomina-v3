import { describe, expect, it, vi } from "vitest";
import { ApiError } from "../api";
import { buildPersistRequests, persistPackResult, type PackResultData } from "../packPersistence";

function makeData(partial: Partial<PackResultData>): PackResultData {
  return {
    personnages: [],
    lieux: [],
    organizations: [],
    events: [],
    creatures: [],
    fragmentsHistoire: [],
    titres: [],
    concepts: [],
    ...partial,
  };
}

describe("pack persistence", () => {
  it("maps AI payloads to existing backend endpoints", () => {
    const requests = buildPersistRequests(
      makeData({
        personnages: [{ prenom: "Aeryn", genre: "F" }],
        lieux: [{ nom: "Valombre", type: "Ville" }],
        organizations: [{ nom: "Guilde du Voile", type: "Guilde", description: "..." }],
        events: [{ nom: "La Nuit des Cendres", description: "..." }],
        creatures: [{ nom: "Loup d'ivoire", type: "Bête", description: "..." }],
        fragmentsHistoire: [{ texte: "Un secret ancien.", theme: "mystère" }],
        titres: [{ valeur: "Archiviste", type: "civil" }],
        concepts: [{ nom: "Rédemption", type: "thème" }],
      })
    );

    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ endpoint: "/nomPersonnages", body: expect.objectContaining({ valeur: "Aeryn" }) }),
        expect.objectContaining({ endpoint: "/lieux", body: expect.objectContaining({ value: "Valombre" }) }),
        expect.objectContaining({ endpoint: "/organizations", body: expect.objectContaining({ name: "Guilde du Voile" }) }),
        expect.objectContaining({ endpoint: "/events", body: expect.objectContaining({ title: "La Nuit des Cendres" }) }),
        expect.objectContaining({ endpoint: "/creatures", body: expect.objectContaining({ valeur: "Loup d'ivoire" }) }),
        expect.objectContaining({ endpoint: "/fragmentsHistoire", body: expect.objectContaining({ texte: "Un secret ancien." }) }),
        expect.objectContaining({ endpoint: "/titres", body: expect.objectContaining({ valeur: "Archiviste" }) }),
        expect.objectContaining({ endpoint: "/concepts", body: expect.objectContaining({ valeur: "Rédemption" }) }),
      ])
    );
  });

  it("returns a summary with success and failures", async () => {
    const apiFetchMock = vi.fn(async (path: string) => {
      if (path === "/events") {
        throw new Error("event failed");
      }
      return { ok: true };
    });

    const summary = await persistPackResult(
      apiFetchMock,
      makeData({
        personnages: [{ prenom: "Aeryn" }],
        events: [{ nom: "Bad event" }],
      })
    );

    expect(summary.attempted).toBe(2);
    expect(summary.created).toBe(1);
    expect(summary.failed).toBe(1);
    expect(summary.perSection.personnages.created).toBe(1);
    expect(summary.perSection.events.failed).toBe(1);
    expect(summary.errors[0]).toContain("events");
  });

  it("throws explicit auth message on 401/403", async () => {
    const apiFetchMock = vi.fn(async () => {
      throw new ApiError("Unauthorized", 401);
    });

    await expect(
      persistPackResult(
        apiFetchMock,
        makeData({
          concepts: [{ nom: "Rédemption" }],
        })
      )
    ).rejects.toThrow("Accès refusé: connecte-toi avec un compte admin pour enregistrer ce pack.");
  });
});
