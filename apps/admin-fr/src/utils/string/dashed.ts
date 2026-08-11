export const dashToUpperCased = (val: string, join = "") => {
  val = val
    .split(/[-]+/)
    .filter((s) => s.trim())
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(join);
  return val;
};

export const upperCasedToDash = (val: string) => {
  val = val
    .replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)
    .replace(/(^[-]+|[-]+$)/, "")
    .trim();
  return val;
};

export const removeDashes = (val: string, join = "") => {
  val = val
    .split(/[-]+/)
    .map((s) => s.trim())
    .join(join);
  return val;
};
