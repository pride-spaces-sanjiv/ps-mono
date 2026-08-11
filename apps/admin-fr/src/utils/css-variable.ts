/**
 * @param variable - The variable name that will be checked.
 * @param variable - Example : `--color-1`
 * @param element - The element from which to retrieve the CSS variable.
 * @param element - Example : document.querySelector(":root")
 * @param element - Default `:root`
 */
export function getCssVariableValue(
  variable: string,
  element = document.querySelector(":root") as Element
) {
  return getComputedStyle(element).getPropertyValue(variable).trim();
}
