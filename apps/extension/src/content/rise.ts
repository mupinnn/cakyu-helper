import { injectDeadlineButtons } from "./tasks";
import { openFeedbackDialog } from "./dialog";
import {
  findPresensiRow,
  parseCourseHeader,
  parseSessionCard,
  parseStudentChrome,
  sessionCards,
} from "./rise-parse";

const BUTTON_ATTR = "data-cakyu-feedback";

function injectButtons(): void {
  const header = parseCourseHeader();
  const student = parseStudentChrome();

  for (const card of sessionCards()) {
    if (card.querySelector(`[${BUTTON_ATTR}]`)) continue;
    const row = findPresensiRow(card);
    if (!row) continue;

    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute(BUTTON_ATTR, "1");
    button.textContent = "Isi Feedback";
    button.setAttribute(
      "style",
      [
        "display:inline-flex",
        "height:40px",
        "padding:8px 16px",
        "align-items:center",
        "justify-content:center",
        "gap:8px",
        "border-radius:6px",
        "border:1px solid #0f766e",
        "background:#fff",
        "color:#0f766e",
        "font-size:16px",
        "font-weight:500",
        "line-height:150%",
        "cursor:pointer",
      ].join(";"),
    );
    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const session = parseSessionCard(card, header, student);
      if (!session) return;
      void openFeedbackDialog(session);
    });
    row.append(button);
  }
}

function inject(): void {
  injectButtons();
  injectDeadlineButtons();
}

let timer = 0;
const observer = new MutationObserver(() => {
  window.clearTimeout(timer);
  timer = window.setTimeout(inject, 250);
});

inject();
observer.observe(document.body, { childList: true, subtree: true });
window.addEventListener("popstate", inject);
