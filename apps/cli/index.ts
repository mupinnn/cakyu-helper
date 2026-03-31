import { writeFile } from "node:fs/promises";
import { select, input, password } from "@inquirer/prompts";
import puppeteer from "puppeteer-core";
import type { SchedulePart } from "@cakyu-helper/shared/types";
import { env } from "./env";
import { getCurrentWeekDates } from "./utils";

console.log("-- Selamat datang di sistem pengambil jadwal Cakyu --");

const studyProgram = await select({
  message: "Pilih program studi",
  choices: [
    {
      value: "Sains Data",
    },
  ],
});

const siakadEmail = await input({ message: "E-mail SIAKAD" });

const siakadPassword = await password({ message: "Password SIAKAD" });

console.log(`Mengambil jadwal untuk ${studyProgram}`);

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

await page.goto(
  `${env.SIAKAD_URL}/siakad/home?show=jadwal&tglawal=${weekDates[0]}&tglakhir=${weekDates[weekDates.length - 1]}`,
  { waitUntil: "domcontentloaded" },
);

const schedules = await page.$$eval(".jadwal-content > *", (nodes) => {
  const result = [];
  let current: SchedulePart | null = null;

  for (const node of nodes) {
    if (node.classList.contains("title-hari")) {
      const title = node.querySelector("p")?.textContent.trim() ?? "";
      current = { title, items: [] };
      result.push(current);
      continue;
    }

    if (node.classList.contains("item-jadwal")) {
      if (!current) {
        current = { title: null, items: [] };
        result.push(current);
      }

      const subject =
        node.querySelector(".item-title")?.textContent.trim() ?? "";
      const splittedSubject = subject.split(/\(([^()]+)\)/);
      const cleanSubject = splittedSubject[0] ?? "";
      const subjectCode = splittedSubject[1] ?? "";
      const hour = node.querySelector(".jam")?.textContent.trim() ?? "";
      const lecturer = node.querySelector(".dosen")?.textContent.trim() ?? "";
      const room = node.querySelector(".ruang")?.textContent.trim() ?? "";
      const session =
        node.querySelector(".pertemuan")?.textContent.trim() ?? "";
      const sessionNo =
        session[session.length - 1] === undefined
          ? 1
          : Number(session[session.length - 1]);

      current.items.push({
        subject: cleanSubject.trim(),
        subjectCode: subjectCode.trim(),
        hour,
        lecturer,
        room,
        session,
        sessionNo,
      });
    }
  }

  return result;
});

const fileName = `${studyProgram}`;
const fileContent = JSON.stringify(
  {
    schedules,
    studyProgram,
    dateFrom: weekDates[0],
    dateTo: weekDates[weekDates.length - 1],
    updatedAt: new Date().toISOString(),
  },
  null,
  2,
);
await writeFile(`../api/data/${fileName}.json`, fileContent, "utf-8");

console.log(`Total jadwal: ${schedules.length}`);
console.log(`Selesai mengambil jadwal untuk ${studyProgram}.`);

await browser.close();
