import { z } from "zod";

const envSchema = z.object({
  SIAKAD_URL: z.url({ protocol: /^https?$/ }),
  PUPPETEER_EXECUTABLE_PATH: z.string(),
});

export const env = envSchema.parse(Bun.env);
