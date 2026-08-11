const charset = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  number: "0123456789",
  symbol: "!@#$%^&*()_+~`|}{[]:;?><,./-=",
};

/**
 * Generates a random password of length n
 * Guaranteed to have: 1 uppercase, 1 number, 1 symbol (no spaces)
 */
export function generatePassword(n = 8) {
  if (n < 4) return "Length too short";

  const allChars = Object.values(charset).join("");
  let pwd = [] as string[];

  // 1. Helper for secure random selection
  const getRandomChar = (str: string) => {
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return str[array[0] % str.length];
  };

  // 2. Guarantee the requirements
  pwd.push(getRandomChar(charset.upper));
  pwd.push(getRandomChar(charset.number));
  pwd.push(getRandomChar(charset.symbol));
  pwd.push(getRandomChar(charset.lower));

  // 3. Fill the rest
  for (let i = pwd.length; i < n; i++) {
    pwd.push(getRandomChar(allChars));
  }

  // 4. Secure Shuffle (Fisher-Yates)
  for (let i = pwd.length - 1; i > 0; i--) {
    const randomArray = new Uint32Array(1);
    window.crypto.getRandomValues(randomArray);
    const j = randomArray[0] % (i + 1);
    [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
  }

  return pwd.join("");
}
