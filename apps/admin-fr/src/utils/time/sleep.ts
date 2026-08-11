export const sleep = (secs = 0) =>
  new Promise<boolean>((res) => {
    setTimeout(() => {
      res(true);
    }, secs * 1000);
  });
