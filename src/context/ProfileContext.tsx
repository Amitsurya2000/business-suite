"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import { BusinessProfile, emptyProfile } from "@/lib/profile";
import { useAuth } from "@/context/AuthContext";
import { insforge } from "@/lib/insforge";

interface ProfileContextValue {
  profile: BusinessProfile;
  isLoaded: boolean;
  update: (patch: Partial<BusinessProfile>) => void;
  updateNested: <K extends keyof BusinessProfile>(
    key: K,
    patch: Partial<BusinessProfile[K]>
  ) => void;
  reset: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const TABLE = "business_profiles";

// Per-user localStorage cache so reloads render instantly and offline edits
// aren't lost. Namespaced by user id so two accounts on one browser don't mix.
const cacheKey = (userId: string) => `business-suite-profile:${userId}`;

function readCache(userId: string): BusinessProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(userId));
    return raw ? { ...emptyProfile(), ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

function writeCache(userId: string, profile: BusinessProfile) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(userId), JSON.stringify(profile));
  } catch {
    /* quota / serialization errors are non-fatal */
  }
}

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [profile, setProfile] = useState<BusinessProfile>(emptyProfile);
  const [isLoaded, setIsLoaded] = useState(false);
  const hydratedRef = useRef(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load this user's profile from InsForge whenever the signed-in user changes.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    hydratedRef.current = false;
    setIsLoaded(false);

    // Optimistic: paint cached data immediately while the network call runs.
    const cached = readCache(userId);
    setProfile(cached ?? emptyProfile());

    (async () => {
      const { data, error } = await insforge.database
        .from(TABLE)
        .select("data")
        .eq("user_id", userId)
        .maybeSingle();

      if (cancelled) return;

      if (!error && data?.data) {
        const merged = {
          ...emptyProfile(),
          ...(data.data as Partial<BusinessProfile>),
        };
        setProfile(merged);
        writeCache(userId, merged);
      } else if (!error && !data) {
        // First time for this user — seed a row (migrating any cached profile).
        const initial = cached ?? emptyProfile();
        await insforge.database
          .from(TABLE)
          .insert([{ user_id: userId, data: initial }]);
        setProfile(initial);
        writeCache(userId, initial);
      }
      // On a network/RLS error we keep the cached/empty profile already in state.

      hydratedRef.current = true;
      setIsLoaded(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Persist changes (debounced) to InsForge + cache. Skipped until hydration
  // completes so the load itself doesn't trigger a redundant write.
  useEffect(() => {
    if (!userId || !hydratedRef.current) return;
    writeCache(userId, profile);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void insforge.database
        .from(TABLE)
        .update({ data: profile, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
    }, 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [profile, userId]);

  const update = useCallback((patch: Partial<BusinessProfile>) => {
    setProfile((prev) => ({ ...prev, ...patch }));
  }, []);

  const updateNested = useCallback(
    <K extends keyof BusinessProfile>(
      key: K,
      patch: Partial<BusinessProfile[K]>
    ) => {
      setProfile((prev) => ({
        ...prev,
        [key]: { ...prev[key], ...patch },
      }));
    },
    []
  );

  const reset = useCallback(async () => {
    const empty = emptyProfile();
    setProfile(empty);
    if (!userId) return;
    writeCache(userId, empty);
    // Await so a caller that reloads the page sees the cleared row persisted.
    await insforge.database
      .from(TABLE)
      .update({ data: empty, updated_at: new Date().toISOString() })
      .eq("user_id", userId);
  }, [userId]);

  return (
    <ProfileContext.Provider
      value={{ profile, isLoaded, update, updateNested, reset }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
