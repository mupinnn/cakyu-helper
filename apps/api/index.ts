import fs from "node:fs";
import path from "node:path";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import type { Schedule } from "@cakyu-helper/shared/types";
import { choices } from "@cakyu-helper/shared/data";
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

const scheduleQuerySchema = z.object({
  studyProgram: z.enum(choices.studyProgram),
  classType: z.enum(choices.classType),
  ongoingSemester: z.enum(choices.ongoingSemester),
  intakeYear: z.enum(choices.intakeYear),
  intakeMonth: z.enum(choices.intakeMonth),
});

const routes = app.get(
  "/api/schedules",
  zValidator("query", scheduleQuerySchema),
  async (c) => {
    const {
      studyProgram,
      classType,
      ongoingSemester,
      intakeYear,
      intakeMonth,
    } = c.req.valid("query");
    const filesInData = fs.readdirSync("./data");
    const scheduleFiles = filesInData.filter((file) => {
      return path.extname(file).toLowerCase() === ".json";
    });

    const selectedSchedulesFile = scheduleFiles.find((file) =>
      file.includes(
        `${studyProgram}-${classType}-${ongoingSemester}-${intakeMonth}-${intakeYear}-schedule`,
      ),
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

export default {
  port: 3001,
  fetch: app.fetch,
};
