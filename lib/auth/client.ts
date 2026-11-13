"use client";

// Browser auth client. Takes no arguments: it talks to our same-origin /api/auth proxy.
import { createAuthClient } from "@neon/auth/next";

export const authClient = createAuthClient();
