import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Sparkles, Copy, Check } from "lucide-react";
import { SignedIn, SignedOut, useAuth } from "@clerk/clerk-react";
import { apiFetch, ApiError, flushOutbox, getApiBaseUrl, getOutboxSize, setApiTokenProvider } from "../lib/api";

const mockResponse = {
  character: {
    name: "Éléandra Brumeveil",
    bio: "Née sous les étoiles d'hiver dans les montagnes de Nébulith, Éléandra possède le don rare de tisser les brumes en illusions tangibles. Ancienne gardienne du Temple des Voiles, elle parcourt désormais les terres en quête de fragments d'un miroir légendaire."
  },
  place: {
    name: "Havrebois",
    bio: "Village millénaire niché dans une clairière enchantée, Havrebois est protégé par d'anciennes runes gravées dans les chênes centenaires. On dit que le temps lui-même s'écoule différemment entre ses murs de pierre moussue."
  },
  object: {
    name: "Lampe d'Échos",
    bio: "Lanterne de cuivre poli contenant une flamme qui ne brûle jamais. Elle murmure des secrets oubliés à ceux qui savent l'écouter, révélant des vérités du passé aux voyageurs égarés."
  }
};

export function ApiDemo() {
  const { getToken } = useAuth();
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [outboxSize, setOutboxSize] = useState<number>(getOutboxSize());
  const [selectedType, setSelectedType] = useState<'character' | 'place' | 'object'>('character');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [meStatus, setMeStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle');
  const [meResult, setMeResult] = useState<{ userId: string; isAdmin: boolean } | null>(null);
  const [meError, setMeError] = useState<string | null>(null);

  useEffect(() => {
    setApiTokenProvider(() => getToken());
    const refresh = () => {
      setIsOnline(navigator.onLine);
      setOutboxSize(getOutboxSize());
    };
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    refresh();
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
      setApiTokenProvider(null);
    };
  }, [getToken]);

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 1000);
  };

  const handleTestMe = async () => {
    setMeStatus('loading');
    setMeError(null);
    setMeResult(null);
    try {
      const token = await getToken();
      const data = await apiFetch<{ userId: string; isAdmin: boolean }>(`/auth/me`, {
        token,
      });
      setMeResult(data);
      setMeStatus('ok');
    } catch (err) {
      const msg = err instanceof ApiError ? `${err.message} (HTTP ${err.status})` : 'Erreur inconnue';
      setMeError(msg);
      setMeStatus('error');
    }
  };

  const handleSync = async () => {
    const result = await flushOutbox();
    setOutboxSize(result.remaining);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentResponse = mockResponse[selectedType];

  return (
    <section className="py-20 bg-[#2d1b4e]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl text-white mb-4" style={{ fontFamily: 'Cinzel, serif' }}>
            Essayez l'API
          </h2>
          <p className="text-lg text-[#d4c5f9] max-w-2xl mx-auto">
            Découvrez la puissance de Nomina en action
          </p>
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Request Panel */}
            <Card className="bg-[#1a0f33] border-[#7b3ff2]/30 p-6">
              <div className="mb-4">
                <h3 className="text-lg text-white mb-4">Configuration</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-[#d4c5f9] block mb-2">Type de génération</label>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        className={`cursor-pointer transition-colors ${
                          selectedType === 'character'
                            ? 'bg-[#7b3ff2] text-white'
                            : 'bg-[#7b3ff2]/20 text-[#d4c5f9] hover:bg-[#7b3ff2]/40'
                        }`}
                        onClick={() => setSelectedType('character')}
                      >
                        Personnage
                      </Badge>
                      <Badge
                        className={`cursor-pointer transition-colors ${
                          selectedType === 'place'
                            ? 'bg-[#7b3ff2] text-white'
                            : 'bg-[#7b3ff2]/20 text-[#d4c5f9] hover:bg-[#7b3ff2]/40'
                        }`}
                        onClick={() => setSelectedType('place')}
                      >
                        Lieu
                      </Badge>
                      <Badge
                        className={`cursor-pointer transition-colors ${
                          selectedType === 'object'
                            ? 'bg-[#7b3ff2] text-white'
                            : 'bg-[#7b3ff2]/20 text-[#d4c5f9] hover:bg-[#7b3ff2]/40'
                        }`}
                        onClick={() => setSelectedType('object')}
                      >
                        Objet
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="text-sm text-[#d4c5f9] mb-4">
                API: <span className="text-white">{getApiBaseUrl()}</span>
              </div>

              <div className="flex items-center justify-between text-sm text-[#d4c5f9] mb-4">
                <div>
                  Réseau:{' '}
                  <span className={isOnline ? 'text-green-300' : 'text-yellow-300'}>
                    {isOnline ? 'en ligne' : 'hors-ligne'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span>Outbox: <span className="text-white">{outboxSize}</span></span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#7b3ff2]/60 text-[#d4c5f9] hover:bg-[#7b3ff2]/15"
                    onClick={handleSync}
                    disabled={!isOnline || outboxSize === 0}
                  >
                    Synchroniser
                  </Button>
                </div>
              </div>

              <div className="bg-[#0d0820] rounded-lg p-4 mb-4">
                <pre className="text-sm overflow-x-auto">
                  <code className="text-[#a67be8]" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
{`POST /api/generate
{
  "type": "${selectedType}",
  "genre": "fantasy",
  "withBio": true,
  "language": "fr"
}`}
                  </code>
                </pre>
              </div>

              <Button
                className="w-full bg-[#7b3ff2] hover:bg-[#a67be8] text-white"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Générer
                  </>
                )}
              </Button>

              <div className="mt-3">
                <SignedOut>
                  <div className="text-sm text-[#d4c5f9]">
                    Connexion requise (bouton “Connexion” en haut) pour tester `/auth/me`.
                  </div>
                </SignedOut>
                <SignedIn>
                  <Button
                    variant="outline"
                    className="w-full border-[#7b3ff2]/60 text-[#d4c5f9] hover:bg-[#7b3ff2]/15"
                    onClick={handleTestMe}
                    disabled={meStatus === 'loading'}
                  >
                    Tester l'auth (`GET /auth/me`)
                  </Button>
                </SignedIn>
              </div>
            </Card>

            {/* Response Panel */}
            <Card className="bg-[#f8f6fc] border-[#d4c5f9] p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-[#2d1b4e]">Résultat</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-[#7b3ff2] hover:bg-[#7b3ff2]/10"
                  onClick={handleCopy}
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-[#c5bfd9] block mb-1">Statut auth</label>
                  {meStatus === 'idle' && (
                    <p className="text-[#2d1b4e]">Pas encore testé.</p>
                  )}
                  {meStatus === 'loading' && (
                    <p className="text-[#2d1b4e]">Test en cours…</p>
                  )}
                  {meStatus === 'ok' && meResult && (
                    <p className="text-[#2d1b4e]">
                      OK — userId: <span className="font-mono">{meResult.userId}</span> — admin:{' '}
                      <span className={meResult.isAdmin ? 'text-green-700' : 'text-[#2d1b4e]'}>
                        {String(meResult.isAdmin)}
                      </span>
                    </p>
                  )}
                  {meStatus === 'error' && meError && (
                    <p className="text-red-700">{meError}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm text-[#c5bfd9] block mb-1">Nom généré</label>
                  <p className="text-xl text-[#7b3ff2]" style={{ fontFamily: 'Cinzel, serif' }}>
                    {currentResponse.name}
                  </p>
                </div>

                <div>
                  <label className="text-sm text-[#c5bfd9] block mb-1">Biographie</label>
                  <p className="text-[#2d1b4e] leading-relaxed">
                    {currentResponse.bio}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#d4c5f9]">
                  <div className="flex items-center gap-2 text-sm text-[#c5bfd9]">
                    <div className="w-2 h-2 bg-[#a67be8] rounded-full animate-pulse"></div>
                    Généré en 87ms
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
