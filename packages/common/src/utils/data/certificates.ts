// --- Individual Arrays ---

export const leedCertificates = [
  "LEED – Certified",
  "LEED – Silver",
  "LEED – Gold",
  "LEED – Platinum",
] as const;

export const igbcCertificates = [
  "IGBC – Certified",
  "IGBC – Silver",
  "IGBC – Gold",
  "IGBC – Platinum",
] as const;

export const isoCertificates = [
  "ISO 14001 – Environmental Management System",
  "ISO 50001 – Energy Management System",
] as const;

export const pollutionCertificates = [
  "Pollution Control Board – Consent to Establish (CTE)",
  "Pollution Control Board – Consent to Operate (CTO)",
  "Environmental Clearance (EC)",
  "EPR Compliance",
] as const;

export const otherCertificates = [
  "GRIHA Certified",
  "BREEAM Certified",
  "EDGE Certified",
  "Green Star Certified",
  "Fitwel Certified",
  "Carbon Neutral Certified",
  "Net Zero Certified",
  "ESG Certified",
] as const;

// --- Derived Types ---

export type LEEDCertificate = (typeof leedCertificates)[number];
export type IGBCCertificate = (typeof igbcCertificates)[number];
export type ISOCertificate = (typeof isoCertificates)[number];
export type PollutionCertificate = (typeof pollutionCertificates)[number];
export type OtherCertificate = (typeof otherCertificates)[number];

// --- Combined Array & Type ---

export const certificates = [
  ...leedCertificates,
  ...igbcCertificates,
  ...isoCertificates,
  ...pollutionCertificates,
  ...otherCertificates,
] as const;

export type Certificate = (typeof certificates)[number];
