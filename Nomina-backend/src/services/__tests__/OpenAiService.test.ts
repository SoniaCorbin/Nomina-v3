import OpenAI from "openai";
import { generatePack } from "../OpenAiService";

jest.mock("openai");

describe("OpenAiService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("throws when OPENAI_API_KEY is missing", async () => {
    delete process.env.OPENAI_API_KEY;

    await expect(
      generatePack({
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
      })
    ).rejects.toThrow("OPENAI_API_KEY manquante");
  });

  it("normalizes generated JSON and returns expected meta", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.OPENAI_MODEL = "gpt-test-model";

    const create = jest.fn().mockResolvedValue({
      choices: [
        {
          message: {
            content: JSON.stringify({
              personnages: [{ prenom: "Aeryn", nomFamille: "Solcrest" }],
              lieux: "not-an-array",
              concepts: [{ nom: "Lueur" }],
            }),
          },
        },
      ],
    });

    (OpenAI as unknown as jest.Mock).mockImplementation(() => ({
      chat: { completions: { create } },
    }));

    const response = await generatePack({
      language: "fr",
      enabled: {
        personnages: true,
        lieux: false,
        organizations: false,
        events: false,
        creatures: false,
        fragmentsHistoire: false,
        titres: false,
        concepts: true,
      },
      counts: {
        personnages: 1,
        lieux: 0,
        organizations: 0,
        events: 0,
        creatures: 0,
        fragmentsHistoire: 0,
        titres: 0,
        concepts: 1,
      },
    });

    expect(create).toHaveBeenCalledTimes(1);
    expect(response.meta).toEqual({ language: "fr", model: "gpt-test-model" });
    expect(response.result.personnages).toHaveLength(1);
    expect(response.result.lieux).toEqual([]);
    expect(response.result.organizations).toEqual([]);
    expect(response.result.events).toEqual([]);
    expect(response.result.creatures).toEqual([]);
    expect(response.result.fragmentsHistoire).toEqual([]);
    expect(response.result.titres).toEqual([]);
    expect(response.result.concepts).toHaveLength(1);
  });
});