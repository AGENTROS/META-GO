let memoryToken: string | null = null;

export function setJWTToken(token: string | null): void {
  memoryToken = token;
}

export function getJWTToken(): string | null {
  return memoryToken;
}
