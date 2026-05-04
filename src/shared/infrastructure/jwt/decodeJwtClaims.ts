/**
 * Decodes the payload of a JWT without validating the signature.
 * Signature validation is the backend's responsibility.
 * This is only for reading claims client-side (UX/authorization hints).
 */

export interface JwtClaims {
  sub: string;
  tid: string;
  email: string;
  iat: number;
  nbf: number;
  exp: number;
  iss: string;
  aud: string | string[];
  /**
   * Roles assigned to the user — requires backend to embed them in the token.
   * Format: string[] e.g. ["admin", "invoicing"]
   * Not present in the current token; infrastructure ready for future use.
   */
  roles?: string[];
}

export const decodeJwtClaims = (token: string): JwtClaims => {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  const payload = parts[1];
  // Pad base64url to standard base64
  const padded = payload.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(padded);
  return JSON.parse(decoded) as JwtClaims;
};
