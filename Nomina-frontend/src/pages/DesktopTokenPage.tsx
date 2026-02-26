import { useAuth, SignedIn, SignedOut } from "@clerk/clerk-react";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

export function DesktopTokenPage() {
  const { getToken } = useAuth();
  const [token, setToken] = useState("");
  const [status, setStatus] = useState<string>("");
  const [pending, setPending] = useState(false);

  async function handleGenerate() {
    setPending(true);
    setStatus("");
    try {
      const jwt = await getToken();
      if (!jwt) {
        setStatus("Impossible de récupérer le token. Reconnecte-toi puis réessaie.");
        return;
      }
      setToken(jwt);
      setStatus("Token généré avec succès.");
    } catch (e: any) {
      setStatus(String(e?.message ?? "Erreur pendant la récupération du token."));
    } finally {
      setPending(false);
    }
  }

  async function handleCopy() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setStatus("Token copié dans le presse-papiers.");
  }

  return (
    <>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>

      <SignedIn>
        <main className="min-h-screen p-6 bg-gradient-to-b from-[#171029] via-[#24193f] to-[#171029] text-[#f3efff]">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-semibold mb-2 text-white">Token Desktop</h1>
            <p className="text-sm text-[#b9a3e3] mb-6">
              Récupère ton JWT Clerk via l'application (sans F12) pour Nomina Desktop.
            </p>

            <Card className="p-6 border-[#4c2d79] bg-gradient-to-br from-[#1a1230] to-[#120d24] text-[#e7defc]">
              <div className="flex flex-wrap gap-3 mb-4">
                <Button onClick={() => handleGenerate().catch(() => undefined)} disabled={pending}>
                  {pending ? "Génération..." : "Générer le token"}
                </Button>
                <Button variant="outline" onClick={() => handleCopy().catch(() => undefined)} disabled={!token}>
                  Copier le token
                </Button>
              </div>

              {status ? <p className="text-sm text-[#cdb7ff] mb-4">{status}</p> : null}

              <textarea
                className="w-full min-h-[240px] rounded-md border border-[#5f34a8] bg-[#f4efff] p-3 text-xs text-[#2b1748]"
                value={token}
                readOnly
                placeholder="Le token apparaîtra ici..."
              />

              <p className="text-xs text-[#b9a3e3] mt-3">
                Dans Nomina Desktop, colle uniquement le token brut (sans le préfixe "Bearer ").
              </p>
            </Card>
          </div>
        </main>
      </SignedIn>
    </>
  );
}
