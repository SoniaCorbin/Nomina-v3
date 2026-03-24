import request from "supertest";
import app from "../app";
import { generatePack } from "../services/OpenAiService";

jest.mock("../services/OpenAiService", () => ({
  generatePack: jest.fn(),
}));

describe("POST /generate-pack", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns 400 for invalid request body", async () => {
    const response = await request(app).post("/generate-pack").send({});

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Corps de requête invalide");
  });

  it("returns 503 when OPENAI_API_KEY is missing", async () => {
    (generatePack as jest.Mock).mockRejectedValue(
      new Error("OPENAI_API_KEY manquante : configurez la variable d'environnement OPENAI_API_KEY.")
    );

    const response = await request(app)
      .post("/generate-pack")
      .send({
        language: "fr",
        enabled: {
          personnages: true,
          lieux: false,
          organizations: false,
          events: false,
          creatures: false,
          fragmentsHistoire: false,
          titres: false,
          concepts: false,
        },
        counts: {
          personnages: 1,
          lieux: 0,
          organizations: 0,
          events: 0,
          creatures: 0,
          fragmentsHistoire: 0,
          titres: 0,
          concepts: 0,
        },
      });

    expect(response.status).toBe(503);
    expect(response.body.error).toContain("OPENAI_API_KEY manquante");
  });

  it("returns 429 when provider responds with 429", async () => {
    (generatePack as jest.Mock).mockRejectedValue({
      status: 429,
      message: "Rate limit reached",
    });

    const response = await request(app)
      .post("/generate-pack")
      .send({
        language: "fr",
        enabled: {
          personnages: true,
          lieux: false,
          organizations: false,
          events: false,
          creatures: false,
          fragmentsHistoire: false,
          titres: false,
          concepts: false,
        },
        counts: {
          personnages: 1,
          lieux: 0,
          organizations: 0,
          events: 0,
          creatures: 0,
          fragmentsHistoire: 0,
          titres: 0,
          concepts: 0,
        },
      });

    expect(response.status).toBe(429);
    expect(response.body.error).toBe("Quota OpenAI dépassé. Réessayez plus tard.");
  });

  it("returns generated pack payload on success", async () => {
    (generatePack as jest.Mock).mockResolvedValue({
      meta: { language: "fr", model: "gpt-4o-mini" },
      result: {
        personnages: [{ prenom: "Aeryn" }],
        lieux: [],
        organizations: [],
        events: [],
        creatures: [],
        fragmentsHistoire: [],
        titres: [],
        concepts: [],
      },
    });

    const response = await request(app)
      .post("/generate-pack")
      .send({
        language: "fr",
        enabled: {
          personnages: true,
          lieux: false,
          organizations: false,
          events: false,
          creatures: false,
          fragmentsHistoire: false,
          titres: false,
          concepts: false,
        },
        counts: {
          personnages: 1,
          lieux: 0,
          organizations: 0,
          events: 0,
          creatures: 0,
          fragmentsHistoire: 0,
          titres: 0,
          concepts: 0,
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.meta.model).toBe("gpt-4o-mini");
    expect(response.body.result.personnages).toHaveLength(1);
  });
});