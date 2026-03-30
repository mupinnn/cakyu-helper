import { z } from "zod";

const envSchema = z.object({
  CORS_ORIGIN: z.url({ protocol: /^https?$/ }),
});

export const env = envSchema.parse(Bun.env);
