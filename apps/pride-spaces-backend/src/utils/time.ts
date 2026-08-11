export const sleep = (secs: number) =>
  new Promise<any>((res) => {
    setTimeout(() => {
      res(true);
    }, secs * 1000);
  });
