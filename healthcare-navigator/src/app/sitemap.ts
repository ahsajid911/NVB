import { MetadataRoute } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://healthnav-bd.vercel.app";

const specialties = [
  "cardiologist", "neurologist", "dermatologist", "orthopedic-surgeon",
  "gastroenterologist", "psychiatrist", "ent-specialist", "gynecologist",
  "pediatrician", "oncologist", "pulmonologist", "urologist",
  "ophthalmologist", "endocrinologist", "general-surgeon",
];

const doctorIds = Array.from({ length: 50 }, (_, i) => String(i + 1));
const hospitalIds = Array.from({ length: 20 }, (_, i) => String(i + 1));

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1 },
    { url: `${baseUrl}/doctors`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/specialties`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/hospitals`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${baseUrl}/ai-symptom-checker`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.8 },
  ];

  const specialtyPages = specialties.map((s) => ({
    url: `${baseUrl}/specialties/${s}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const doctorPages = doctorIds.map((id) => ({
    url: `${baseUrl}/doctors/${id}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const hospitalPages = hospitalIds.map((id) => ({
    url: `${baseUrl}/hospitals/${id}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...specialtyPages, ...doctorPages, ...hospitalPages];
}
