import { config, configDotenv, DotenvConfigOptions } from "dotenv";
import PATH from "path";
import { getProcessArgsObject } from "./args.js";

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
  const argsObj = getProcessArgsObject<{ env?: string }>();
  process.env = loadEnv({ path: `./.env.${argsObj.env}` }).parsed!;
  process.env.ENV = argsObj.env || process.env.ENV;
};
updateEnvFromArgs();
export const ENV = process.env;
