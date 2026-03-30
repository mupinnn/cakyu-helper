import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Schedule } from "@cakyu-helper/shared/types";
import { env } from "./env";

const app = new Hono();

app.use(
  "/api/*",
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);

const routes = app.get(
  "/api/schedules",
  zValidator(
    "query",
    z.object({
      studyProgram: z.string(),
    }),
  ),
  async (c) => {
    const { studyProgram } = c.req.valid("query");
    const filesInData = fs.readdirSync("./data");
    const scheduleFiles = filesInData.filter((file) => {
      return path.extname(file).toLowerCase() === ".json";
    });

    const selectedSchedulesFile = scheduleFiles.find((file) =>
      file.includes(studyProgram),
    );
    if (!selectedSchedulesFile)
      return c.json({ message: "Jadwal tidak ditemukan." }, 404);

    const unparsedSchedules = fs.readFileSync(
      `./data/${selectedSchedulesFile}`,
      "utf-8",
    );
    const schedules: Schedule = JSON.parse(unparsedSchedules);

    return c.json(schedules);
  },
);

export type AppType = typeof routes;

export default app;
