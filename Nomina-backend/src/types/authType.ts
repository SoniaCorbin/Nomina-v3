// Contexte minimal qu'on attache à req.auth après vérification du token Clerk.
export interface ClerkAuthPayload {
  userId: string;
  sessionId?: string;
  email?: string;
}

export interface MeResponse {
  userId: string;
  isAdmin: boolean;
}
