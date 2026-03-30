export function formatDateToYYYYMMDD(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getCurrentWeekDates() {
  const dates = [];
  const today = new Date();
  const currentDayOfWeek = today.getDay();
  const currentDayOfMonth = today.getDate();
  const firstDay = new Date(today);

  firstDay.setDate(currentDayOfMonth - currentDayOfWeek);
  firstDay.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + i);
    dates.push(formatDateToYYYYMMDD(date));
  }

  return dates;
}
