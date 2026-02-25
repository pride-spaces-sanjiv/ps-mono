import { config, configDotenv, DotenvConfigOptions } from "dotenv";
import PATH from "path";

export const loadEnv = (
  options: DotenvConfigOptions = {},
  loadOptions: Partial<{ useProcessPath: boolean }> = {},
) => {
  const { path = "./.env" } = options;
  const { useProcessPath = true } = loadOptions;
  // console.log(path);

  return configDotenv({
    ...options,
    path: useProcessPath
      ? Array.isArray(path)
        ? path.map((p) => PATH.join(process.cwd(), p))
        : typeof path === "string"
          ? PATH.join(process.cwd(), path)
          : path
      : path,
  });
};

const updateEnvFromArgs = () => {
  const argsObj = Object.fromEntries(
    process.argv
      .filter((arg) => arg.match(/^--[A-z]+[=]/))
      .map((s) => s.replace(/^--/, ""))
      .map((arg) => arg.split("=")),
  );
  process.env = loadEnv({ path: `./.env.${argsObj?.env}` }).parsed!;
};
updateEnvFromArgs();
export const ENV = process.env;
