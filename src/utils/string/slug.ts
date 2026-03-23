export const generateSlug = (name: string, count = 0) => {
  const firstWord = name
    .trim()
    .split(" ")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();

  const padded = String(count).padStart(4, "0");

  return `${firstWord}-${padded}`;
};
