"use client";

import type { SessionUser } from "@/lib/types";
import { createContext, useContext } from "react";

const AuthContext = createContext<SessionUser | null>(null);

export function Providers({
  user,
  children,
}: {
  user: SessionUser | null;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={user}>{children}</AuthContext.Provider>;
}

export function useCurrentUser() {
  return useContext(AuthContext);
}
