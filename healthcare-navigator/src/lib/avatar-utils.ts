/**
 * Shared avatar and specialty color utilities.
 * Used across doctor, hospital, and specialty pages.
 */

const specialtyColorMap: Record<string, { bg: string; text: string }> = {
  Cardiology: { bg: "#FEE2E2", text: "#B91C1C" },
  Neurology: { bg: "#F3E8FF", text: "#7C3AED" },
  Orthopedics: { bg: "#DCFCE7", text: "#15803D" },
  Oncology: { bg: "#FEF3C7", text: "#B45309" },
  Pediatrics: { bg: "#E8F0FF", text: "#0066FF" },
  Gastroenterology: { bg: "#FFEDD5", text: "#C2410C" },
  ENT: { bg: "#CCFBF1", text: "#0F766E" },
  Dermatology: { bg: "#FCE7F3", text: "#BE185D" },
  Psychiatry: { bg: "#EDE9FE", text: "#6D28D9" },
  "General Surgery": { bg: "#F1F5F9", text: "#475569" },
  Pulmonology: { bg: "#CFFAFE", text: "#0E7490" },
  Ophthalmology: { bg: "#ECFDF5", text: "#047857" },
  Endocrinology: { bg: "#FEF9C3", text: "#A16207" },
  Urology: { bg: "#E0E7FF", text: "#4338CA" },
  Gynecology: { bg: "#FDF2F8", text: "#BE185D" },
};

const defaultSpecialtyColor = { bg: "#E8F0FF", text: "#0066FF" };

export function getInitials(name: string): string {
  const cleaned = name.replace(/^Dr\.?\s*/i, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getSpecialtyColor(specialtyName: string): { bg: string; text: string } {
  return specialtyColorMap[specialtyName] || defaultSpecialtyColor;
}
