export const getFileIntoBase64 = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export type FileSizeNotation = "M" | "G" | "T" | "K" | "B";
/**
 * @param {FileSizeNotation} notation - Defaults to `"B"`
 */
const notationMults = {
  B: 1,
  K: 1024,
  M: 1024 * 1024,
  G: 1024 * 1024 * 1024,
  T: 1024 * 1024 * 1024 * 1024,
};
export const resolveFileSize = (
  val: number,
  notation: FileSizeNotation = "B",
) => {
  if (val === 0) return 0;
  const k = notationMults[notation];
  const bytes = val * k;
  return Number(parseFloat(bytes.toFixed(2)));
};
