/**
 * @description Returns an object of arguments passed to the command
 * @description Matches arg starting with `--<arg-key>=<arg-value>` and appends in the object`
 * @description For example `["--env=development", "--port=3000"]` returns `{ env: "development", port: "3000" }`
 */
export const getProcessArgsObject = <
  T extends Partial<Record<string, string>>,
>() => {
  const argsObj = Object.fromEntries(
    process.argv
      .filter((arg) => arg.match(/^--[A-z]+[=]/))
      .map((s) => s.replace(/^--/, ""))
      .map((arg) => arg.split("=")),
  ) as T & Partial<Record<string, string>>;
  return argsObj;
};
