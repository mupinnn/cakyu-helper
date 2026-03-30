import { hc } from "hono/client";
import type { AppType } from "@cakyu-helper/api";

export const apiClient = hc<AppType>(import.meta.env.VITE_API_URL);
