import { type Context } from "hono";
import { env } from "hono/adapter";
import puppeteer from "puppeteer-core";

type Env = {
  readonly VITE_API_URL: string;
  readonly SIAKAD_EMAIL: string;
  readonly SIAKAD_PASS: string;
  readonly SIAKAD_URL: string;
};

async function auth(c: Context) {
  const { SIAKAD_URL, SIAKAD_EMAIL, SIAKAD_PASS } = env<Env>(c);
  const browser = await puppeteer.launch({
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  });
  const page = await browser.newPage();

  await page.goto(`${SIAKAD_URL}/gate/login`);
  await page.setViewport({ width: 1080, height: 1024 });

  await page.locator("#email").fill(SIAKAD_EMAIL);
  await page.locator("#password").fill(SIAKAD_PASS);
  await page.locator("[data-type=login]").click();
  await page.waitForNavigation();

  await page.goto(`${SIAKAD_URL}/siakad/list_jadwalkuliahsmt`);

  return page;
}

export async function getSemesters(c: Context) {
  const page = await auth(c);

  const semesterOptions = await page.$eval("#periode", (select) => {
    return Array.from(
      select.children as HTMLCollectionOf<HTMLOptionElement>,
    ).map((option) => ({
      value: option.value,
      label: option.innerText,
    }));
  });

  return semesterOptions;
}

export async function getSchedules(c: Context, semester: string) {
  const page = await auth(c);

  await page.select("#periode", semester);
  await page.select("#limit", "100");
  await page.waitForNavigation();

  const schedules = await page.$$eval("td", (td) => {
    return Array.from(td).map((col) => col.textContent);
  });

  return schedules;
}
