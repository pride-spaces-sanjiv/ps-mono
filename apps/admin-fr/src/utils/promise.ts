export const delayPromise = <T extends any>(
  promise: Promise<T> | T,
  delay = 0
) =>
  new Promise<T>((res) => {
    setTimeout(() => {
      res(promise);
    }, delay * 1000);
  });
