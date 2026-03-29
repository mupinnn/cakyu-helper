import { Hono } from "hono";
import { cors } from "hono/cors";
import { env } from "hono/adapter";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth, calendar } from "@googleapis/calendar";
import { getSchedules, getSemesters, type Env } from "./services";
import credentials from "./credentials.json";

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
  )
  .post(
    "/api/calendar",
    zValidator(
      "json",
      z.object({
        events: z.array(
          z.object({
            summary: z.string(),
            start: z.object({
              dateTime: z.iso.datetime(),
              timeZone: z.string(),
            }),
            end: z.object({
              dateTime: z.iso.datetime(),
              timeZone: z.string(),
            }),
          }),
        ),
      }),
    ),
    async (c) => {
      const { GOOGLE_CALENDAR_ID } = env<Env>(c);
      const { events } = c.req.valid("json");

      const authClient = new auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });
      const calendarClient = calendar({ version: "v3", auth: authClient });

      const insertEventPromises = events.map((event) =>
        calendarClient.events.insert({
          auth: authClient,
          calendarId: GOOGLE_CALENDAR_ID,
          requestBody: event,
        }),
      );

      const results = await Promise.allSettled(insertEventPromises);

      results.forEach((result, idx) => {
        if (result.status === "fulfilled") {
          console.log(`Event ${idx + 1} created:`, result.value.data.id);
        } else {
          console.error(`Error inserting event ${idx + 1}:`, result.reason);
        }
      });

      return c.json({
        message: "Schedules has been added to Google Calendar",
      });
    },
  );

export type AppType = typeof routes;

export default app;
