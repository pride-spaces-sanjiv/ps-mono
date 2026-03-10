export const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const shortDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const formatOpenDays = (openDays?: number[]) => {
  if (!openDays || openDays.length === 0) return "-";

  // sort days
  const sorted = [...openDays].sort((a, b) => a - b);

  // convert to short day names
  const labels = sorted.map((d) => shortDays[d - 1]);

  // detect continuous range (ex: Mon–Fri)
  const isContinuous =
    sorted.length > 1 &&
    sorted.every((day, i) => i === 0 || day === sorted[i - 1] + 1);

  if (isContinuous) {
    return `${shortDays[sorted[0] - 1]}–${shortDays[sorted[sorted.length - 1] - 1]}`;
  }

  return labels.join(", ");
};