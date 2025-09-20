import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";

const app = new Hono();

app.use("/api/*", cors());

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app.get(
  "/api/hello",
  zValidator(
    "query",
    z.object({
      name: z.string(),
    }),
  ),
  (c) => {
    const { name } = c.req.valid("query");

    return c.json({
      message: `Hello! ${name}`,
    });
  },
);

export type AppType = typeof routes;

export default app;
