import { useEffect, useState } from "react";

export function useDebouncer<T>(
  val: T,
  timer = 500,
  onUpdate = (val: T) => {
    val;
  }
) {
  const [value, setValue] = useState(val);

  useEffect(() => {
    const updater = setTimeout(() => {
      setValue(val);
    }, timer);
    return () => {
      clearTimeout(updater);
    };
  }, [timer, val]);

  useEffect(() => {
    onUpdate?.(value);
  }, [value]);
  return value;
}
