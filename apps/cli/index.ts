import { parseArgs } from "node:util";
import { select, input, password } from "@inquirer/prompts";
import { choices } from "@cakyu-helper/shared/data";
import { env } from "./env";
import {
  runScraper,
  RunScraperParamsSchema,
  type RunScraperParams,
} from "./scraper";

let answers!: RunScraperParams;

if (env.CI) {
  const { values } = parseArgs({
    args: Bun.argv,
    options: {
      studyProgram: {
        type: "string",
      },
      intakeMonth: {
        type: "string",
      },
      intakeYear: {
        type: "string",
      },
      siakadPassword: {
        type: "string",
      },
      siakadEmail: {
        type: "string",
      },
      classType: {
        type: "string",
      },
      ongoingSemester: {
        type: "string",
      },
    },
    strict: true,
    allowPositionals: true,
  });

  const parsingResult = RunScraperParamsSchema.safeParse(values);
  if (parsingResult.success) {
    answers = parsingResult.data;
  } else {
    console.error(parsingResult.error);
  }
} else {
  const intakeYear = await select({
    message: "Angkatan perkuliahan",
    choices: choices.intakeYear,
  });
  const intakeMonth = await select({
    message: "Bulan intake",
    choices: choices.intakeMonth,
  });
  const ongoingSemester = await select({
    message: "Semester berjalan",
    choices: choices.ongoingSemester,
  });
  const studyProgram = await select({
    message: "Program studi",
    choices: choices.studyProgram,
  });
  const classType = await select({
    message: "Tipe kelas",
    choices: choices.classType,
  });
  const siakadEmail = await input({ message: "E-mail SIAKAD" });
  const siakadPassword = await password({ message: "Password SIAKAD" });

  answers = {
    intakeYear,
    intakeMonth,
    ongoingSemester,
    studyProgram,
    classType,
    siakadEmail,
    siakadPassword,
  };
}

await runScraper(answers);
