export const generateSpaceKeyword = (name: string) => {
  name = name.replace(/( |\n)+/g, "").toLowerCase();
  return name;
};
