import { useEffect, useState } from "react";
import type { ScheduleItem } from "@cakyu-helper/shared/types";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import {
  FieldGroup,
  FieldLegend,
  FieldSet,
  FieldDescription,
  Field,
  FieldLabel,
  FieldError,
} from "./ui/field";
import { Input } from "./ui/input";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "./ui/select";
import { choices } from "@/lib/utils";

interface FeedbackDialogProps {
  trigger: React.ReactNode;
  schedule: ScheduleItem;
}

const STORAGE_KEY = "prefill-form";
const ratingOptions = [1, 2, 3, 4, 5];
const formSchema = z
  .object({
    name: z.string().min(1, "Nama Mahasiswa wajib diisi."),
    nim: z.string().min(1, "NIM wajib diisi."),
    email: z.email("E-mail kampus wajib disii."),
    classProgram: z.string().min(1, "Program Perkuliahan wajib diisi."),
    intakeYear: z.string().min(1, "Angkatan Perkuliahan wajib diisi."),
    ongoingSemester: z.string().min(1, "Semester Berjalan wajib diisi."),
    faculty: z.string().min(1, "Fakultas wajib diisi."),
    studyProgram: z.string().min(1, "Program Studi wajib diisi."),
    overallRating: z.coerce
      .number<number>()
      .min(1, "Rating keseluruhan tidak boleh kurang dari 1.")
      .max(5, "Rating keseluruhan tidak boleh lebih dari 5."),
    levelOfUnderstanding: z.coerce
      .number<number>()
      .min(1, "Level pemahaman tidak boleh kurang dari 1.")
      .max(5, "Level pemahaman tidak boleh lebih dari 5."),
    feedbackUnderstanding: z.string(),
    classInteractivity: z.coerce
      .number<number>()
      .min(1, "Interaktivitas kelas tidak boleh kurang dari 1.")
      .max(5, "Interaktivitas kelas tidak boleh lebih dari 5."),
    lecturerPerformance: z.coerce
      .number<number>()
      .min(1, "Performa dosen tidak boleh kurang dari 1.")
      .max(5, "Performa dosen tidak boleh lebih dari 5."),
    feedbackLecturer: z.string(),
    customizeFeedbackLecturer: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.levelOfUnderstanding <= 4) {
      const feedback = data.feedbackUnderstanding.trim();

      if (!feedback || feedback === "-") {
        ctx.addIssue({
          code: "custom",
          path: ["feedbackUnderstanding"],
          message:
            "Feedback pemahaman wajib diisi jika rating pemahaman 4 atau kurang.",
        });
      }
    }

    if (data.customizeFeedbackLecturer) {
      const feedback = data.feedbackLecturer.trim();

      if (!feedback || feedback === "-") {
        ctx.addIssue({
          code: "custom",
          path: ["feedbackLecturer"],
          message: "Feedback dosen wajib diisi saat kustomisasi aktif.",
        });
      }
    }
  });

export function FeedbackDialog({ trigger, schedule }: FeedbackDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const savedPrefillForm = localStorage.getItem(STORAGE_KEY);
  const parsedPrefillForm = savedPrefillForm
    ? (JSON.parse(savedPrefillForm) as z.infer<typeof formSchema>)
    : {
        name: "",
        nim: "",
        email: "",
        classProgram: "",
        intakeYear: "",
        ongoingSemester: "",
        faculty: "",
        studyProgram: "Sains Data",
        overallRating: 5,
        levelOfUnderstanding: 5,
        feedbackUnderstanding: "-",
        classInteractivity: 5,
        lecturerPerformance: 5,
        feedbackLecturer: "-",
        customizeFeedbackLecturer: false,
      };
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: parsedPrefillForm,
  });

  const overallRating = form.watch("overallRating");
  const levelOfUnderstanding = form.watch("levelOfUnderstanding");
  const customizeFeedbackLecturer = form.watch("customizeFeedbackLecturer");

  useEffect(() => {
    form.setValue("levelOfUnderstanding", overallRating, {
      shouldValidate: true,
    });
    form.setValue("classInteractivity", overallRating, {
      shouldValidate: true,
    });
    form.setValue("lecturerPerformance", overallRating, {
      shouldValidate: true,
    });
  }, [form, overallRating]);

  useEffect(() => {
    const currentValue = form.getValues("feedbackUnderstanding");

    if (levelOfUnderstanding <= 4) {
      if (currentValue === "-") {
        form.setValue("feedbackUnderstanding", "", { shouldValidate: false });
      }
      return;
    }

    if (currentValue !== "-") {
      form.setValue("feedbackUnderstanding", "-", { shouldValidate: true });
    }
  }, [form, levelOfUnderstanding]);

  useEffect(() => {
    const currentValue = form.getValues("feedbackLecturer");

    if (customizeFeedbackLecturer) {
      if (currentValue === "-") {
        form.setValue("feedbackLecturer", "", { shouldValidate: false });
      }
      return;
    }

    if (currentValue !== "-") {
      form.setValue("feedbackLecturer", "-", { shouldValidate: true });
    }
  }, [customizeFeedbackLecturer, form]);

  function onSubmit(data: z.infer<typeof formSchema>) {
    const formURL =
      "https://docs.google.com/forms/d/e/1FAIpQLSeWAQC5mb-yqO1Kjpey7XtXrjMv9Sahuir8K9cFA3msMFFw0Q/viewform";
    const entry = {
      email: "emailAddress",
      name: "entry.1272053221",
      nim: "entry.216570409",
      classProgram: "entry.166982821",
      intakeYear: "entry.827367601",
      ongoingSemester: "entry.131194943",
      faculty: "entry.1377667860",
      studyProgram: "entry.446404379",
      subject: "entry.1323838530",
      classCode: "entry.693828724",
      lecturer: "entry.223457999",
      session: "entry.1168354167",
      levelOfUnderstanding: "entry.1181533285",
      feedbackUnderstanding: "entry.211965641",
      classInteractivity: "entry.368028973",
      lecturerPerformance: "entry.527914135",
      feedbackLecturer: "entry.1735927064",
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

    const prefilledURL = new URL(formURL);
    prefilledURL.searchParams.set(entry.email, data.email);
    prefilledURL.searchParams.set(entry.name, data.name);
    prefilledURL.searchParams.set(entry.nim, data.nim);
    prefilledURL.searchParams.set(entry.classProgram, data.classProgram);
    prefilledURL.searchParams.set(entry.intakeYear, data.intakeYear);
    prefilledURL.searchParams.set(entry.faculty, data.faculty);
    prefilledURL.searchParams.set(entry.ongoingSemester, data.ongoingSemester);
    prefilledURL.searchParams.set(entry.studyProgram, data.studyProgram);
    prefilledURL.searchParams.set(
      entry.subject,
      choices.subject.find((s) => s.includes(schedule.subject)) ?? "",
    );
    prefilledURL.searchParams.set(entry.classCode, schedule.subjectCode);
    prefilledURL.searchParams.set(entry.lecturer, schedule.lecturer);
    prefilledURL.searchParams.set(
      entry.session,
      choices.session[schedule.sessionNo - 1],
    );
    prefilledURL.searchParams.set(
      entry.levelOfUnderstanding,
      choices.levelOfUnderstanding[data.levelOfUnderstanding - 1],
    );
    prefilledURL.searchParams.set(
      entry.feedbackUnderstanding,
      data.feedbackUnderstanding,
    );
    prefilledURL.searchParams.set(
      entry.classInteractivity,
      choices.classInteractivity[data.classInteractivity - 1],
    );
    prefilledURL.searchParams.set(
      entry.lecturerPerformance,
      choices.lecturerPerformance[data.lecturerPerformance - 1],
    );
    prefilledURL.searchParams.set(
      entry.feedbackLecturer,
      data.feedbackLecturer,
    );

    window.open(prefilledURL.toString(), "_blank");
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Isi Feedback</DialogTitle>
          <DialogDescription>
            Bertujuan untuk membuat <span className="italic">prefill</span> pada
            isian yang repetitif.
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4 overflow-y-auto max-h-[50vh] px-1.5 -mx-1.5 pb-1.5 -mb-1.5"
          id="form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            <FieldSet>
              <FieldLegend>Data Mahasiswa</FieldLegend>
              <FieldDescription>
                Data Mahasiswa akan disimpan di browser Anda agar tidak perlu
                melakukan pengisian lagi di kelas berikutnya.
              </FieldDescription>

              <FieldGroup>
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="name">Nama Mahasiswa</FieldLabel>
                      <Input
                        {...field}
                        id="name"
                        placeholder="Khaerul Rafael"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="nim"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="nim">NIM</FieldLabel>
                      <Input {...field} id="nim" placeholder="251205xxxxx" />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">E-mail Cakyu</FieldLabel>
                      <Input
                        {...field}
                        id="email"
                        placeholder="zokoui@cakrawala.ac.id"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="classProgram"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="classProgram">
                        Program Perkuliahan
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="classProgram"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Pilih program perkuliahan" />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          {choices.classProgram.map((program) => (
                            <SelectItem key={program} value={program}>
                              {program}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="intakeYear"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="intakeYear">
                        Angkatan Perkuliahan
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="intakeYear"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Pilih angkatan perkuliahan" />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          {choices.intakeYear.map((program) => (
                            <SelectItem key={program} value={program}>
                              {program}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="ongoingSemester"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="ongoingSemester">
                        Semester Berjalan
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="ongoingSemester"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Pilih semester berjalan" />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          {choices.ongoingSemester.map((program) => (
                            <SelectItem key={program} value={program}>
                              {program}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="faculty"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="faculty">Fakultas</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="faculty"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Pilih fakultas" />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          {choices.faculty.map((program) => (
                            <SelectItem key={program} value={program}>
                              {program}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="studyProgram"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="studyProgram">
                        Program Studi
                      </FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled
                      >
                        <SelectTrigger
                          id="studyProgram"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Pilih program studi" />
                        </SelectTrigger>
                        <SelectContent position="item-aligned">
                          {choices.studyProgram.map((program) => (
                            <SelectItem key={program} value={program}>
                              {program}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSet>
              <FieldLegend>Penilaian Kelas</FieldLegend>
              <FieldDescription>
                Rating keseluruhan akan mengisi otomatis penilaian detail.
                Kalian juga tetap bisa mengkustomisasi masing-masing penilaian.
                <br />
                <br />
                Secara <span className="italic">default</span>, kolom feedback
                tingkat pemahaman dan performa dosen akan diisi{" "}
                <strong>"-"</strong>. Jika ingin mengisi dengan yang lain,
                silakan centang{" "}
                <strong>"Kustomisasi Feedback Performa Dosen"</strong> dan isi
                tingkat pemahaman dengan <strong>4</strong>.
              </FieldDescription>

              <FieldGroup>
                <Controller
                  name="overallRating"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Rating Keseluruhan</FieldLabel>
                      <RadioGroup
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                        className="grid grid-cols-5 gap-2"
                      >
                        {ratingOptions.map((value) => (
                          <label
                            key={`overallRating-${value}`}
                            className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"
                          >
                            <RadioGroupItem value={String(value)} />
                            <span>{value}</span>
                          </label>
                        ))}
                      </RadioGroup>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  name="levelOfUnderstanding"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Rating Tingkat Pemahaman</FieldLabel>
                      <RadioGroup
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                        className="grid grid-cols-1 gap-2"
                      >
                        {choices.levelOfUnderstanding.map((value, index) => (
                          <label
                            key={`levelOfUnderstanding-${index}`}
                            className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"
                          >
                            <RadioGroupItem value={String(index + 1)} />
                            <span>{value}</span>
                          </label>
                        ))}
                      </RadioGroup>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  name="feedbackUnderstanding"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="feedbackUnderstanding">
                        Topik apa yang masih belum kamu pahami dan adakah
                        hal-hal yang masih ingin kamu ketahui dari kelas hari
                        ini?
                      </FieldLabel>
                      <textarea
                        {...field}
                        id="feedbackUnderstanding"
                        rows={4}
                        placeholder="Tuliskan feedback pemahaman materi"
                        className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40"
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  name="classInteractivity"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Rating Interaktivitas Kelas</FieldLabel>
                      <RadioGroup
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                        className="grid grid-cols-1 gap-2"
                      >
                        {choices.classInteractivity.map((value, index) => (
                          <label
                            key={`classInteractivity-${index}`}
                            className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"
                          >
                            <RadioGroupItem value={String(index + 1)} />
                            <span>{value}</span>
                          </label>
                        ))}
                      </RadioGroup>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  name="lecturerPerformance"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel>Rating Performa Dosen</FieldLabel>
                      <RadioGroup
                        value={String(field.value)}
                        onValueChange={(value) => field.onChange(Number(value))}
                        className="grid grid-cols-1 gap-2"
                      >
                        {choices.lecturerPerformance.map((value, index) => (
                          <label
                            key={`lecturerPerformance-${index}`}
                            className="flex items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"
                          >
                            <RadioGroupItem value={String(index + 1)} />
                            <span>{value}</span>
                          </label>
                        ))}
                      </RadioGroup>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                <Controller
                  name="customizeFeedbackLecturer"
                  control={form.control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <input
                        id="customizeFeedbackLecturer"
                        type="checkbox"
                        checked={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.checked)
                        }
                        className="mt-0.5 size-4 rounded border border-input"
                      />
                      <FieldLabel htmlFor="customizeFeedbackLecturer">
                        Kustomisasi Feedback Performa Dosen
                      </FieldLabel>
                    </Field>
                  )}
                />

                {customizeFeedbackLecturer && (
                  <Controller
                    name="feedbackLecturer"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="feedbackLecturer">
                          Apakah ada feedback untuk DOSEN hari ini? Jika iya,
                          boleh diceritakan sejelas-jelasnya dan
                          sejujur-jujurnya.
                        </FieldLabel>
                        <textarea
                          {...field}
                          id="feedbackLecturer"
                          rows={4}
                          placeholder="Tuliskan feedback untuk dosen"
                          className="min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40"
                        />
                        <FieldError errors={[fieldState.error]} />
                      </Field>
                    )}
                  />
                )}
              </FieldGroup>
            </FieldSet>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="form">
            Prefill feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
