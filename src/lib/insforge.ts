import { createClient } from "@insforge/sdk";

// Browser SDK client for the ஞானி suite. The anon key is public and safe to
// expose — all data access is gated by row-level security on the backend.
// Auth session lives in an httpOnly refresh cookie + in-memory access token.
export const insforge = createClient({
  baseUrl: process.env.NEXT_PUBLIC_INSFORGE_URL!,
  anonKey: process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY!,
});
