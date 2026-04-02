import { writeFile } from "node:fs/promises";
import puppeteer from "puppeteer-core";
import { z } from "zod";
import { env } from "./env";
import { getCurrentWeekDates, scheduleParser } from "./utils";

export const RunScraperParamsSchema = z.object({
  intakeYear: z.string(),
  intakeMonth: z.string(),
  ongoingSemester: z.string(),
  studyProgram: z.string(),
  classType: z.string(),
  siakadEmail: z.string(),
  siakadPassword: z.string(),
});

export type RunScraperParams = z.infer<typeof RunScraperParamsSchema>;

export async function runScraper({
  studyProgram,
  intakeMonth,
  intakeYear,
  siakadPassword,
  siakadEmail,
  classType,
  ongoingSemester,
}: RunScraperParams) {
  console.log("-- Selamat datang di sistem pengambil jadwal Cakyu --");

  console.log(
    `Mengambil jadwal untuk ${studyProgram} ${classType} semester ${ongoingSemester} intake ${intakeMonth} ${intakeYear}.`,
  );

  const browser = await puppeteer.launch({
    executablePath: env.PUPPETEER_EXECUTABLE_PATH,
  });

  const page = await browser.newPage();

  page.setDefaultTimeout(0);
  page.setDefaultNavigationTimeout(0);

  await page.goto(`${env.SIAKAD_URL}/gate/login`);
  await page.setViewport({ width: 1440, height: 1024 });
  await page.locator("#email").fill(siakadEmail);
  await page.locator("#password").fill(siakadPassword);
  await page.locator("[data-type=login]").click();
  await page.waitForNavigation();
  await page.goto(`${env.SIAKAD_URL}/siakad/home`);

  const weekDates = getCurrentWeekDates();
  const startDate = weekDates[0];
  const endDate = weekDates[weekDates.length - 1];

  await page.goto(
    `${env.SIAKAD_URL}/siakad/home?show=jadwal&tglawal=${startDate}&tglakhir=${endDate}`,
    { waitUntil: "domcontentloaded" },
  );

  const courseSchedules = await page.$$eval(
    ".jadwal-content > *",
    scheduleParser,
  );

  await page.goto(`${env.SIAKAD_URL}/siakad/home?show=ujian`, {
    waitUntil: "domcontentloaded",
  });
  const examSchedules = await page.$$eval(
    ".jadwal-content > .tab-slider--body > *",
    scheduleParser,
  );

  for (const exam of examSchedules) {
    if (!exam.title || !startDate || !endDate) break;

    const matchedCourseScheduleIndex = courseSchedules.findIndex(
      (course) => course.title === exam.title,
    );

    if (matchedCourseScheduleIndex > 0) {
      courseSchedules[matchedCourseScheduleIndex]?.items.push(...exam.items);
      continue;
    }

    const examDate = new Date(exam.title);
    if (examDate >= new Date(startDate) && examDate <= new Date(endDate)) {
      courseSchedules.push(exam);
    }
  }

  const fileNameTemplate = `${studyProgram}-${classType}-${ongoingSemester}-${intakeMonth}-${intakeYear}`;
  const courseSchedulesFileName = `${fileNameTemplate}-schedule.json`;

  await writeFile(
    `../api/data/${courseSchedulesFileName}`,
    JSON.stringify(
      {
        studyProgram,
        classType,
        ongoingSemester,
        intakeYear,
        dateFrom: weekDates[0],
        dateTo: weekDates[weekDates.length - 1],
        updatedAt: new Date().toISOString(),
        schedules: courseSchedules,
      },
      null,
      2,
    ),
    "utf-8",
  );

  console.log(
    `Selesai mengambil jadwal untuk ${studyProgram} ${classType} semester ${ongoingSemester} intake ${intakeMonth} ${intakeYear}.`,
  );

  await browser.close();
}
