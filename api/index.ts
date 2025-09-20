import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "hono/adapter";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getSchedules, getSemesters } from "./services";

const app = new Hono();

app.use("/api/*", cors());

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const routes = app
  .get("/api/semesters", async (c) => {
    const semeserOptions = await getSemesters(c);

    return c.json({
      semesters: semeserOptions,
    });
  })
  .get(
    "/api/schedule",
    zValidator(
      "query",
      z.object({
        semester: z.string(),
      }),
    ),
    async (c) => {
      const { semester } = c.req.valid("query");
      const schedules = await getSchedules(c, semester);

      return c.json({
        schedules,
      });
    },
  );

export type AppType = typeof routes;

export default app;
