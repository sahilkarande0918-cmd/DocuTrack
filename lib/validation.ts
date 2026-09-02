import { z } from "zod";

export const DEPARTMENTS = [
  "Computer Engineering",
  "Information Technology",
  "Electronics & Telecommunication",
  "Mechanical Engineering",
  "Civil Engineering",
  "Electrical Engineering",
  "First Year Engineering",
] as const;

export const YEARS = ["First Year", "Second Year", "Third Year", "Final Year"] as const;

export const ACADEMIC_YEARS = ["2024-25", "2025-26", "2026-27"] as const;

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  studentId: z.string().trim().min(3, "Enter your student ID").max(20),
  department: z.enum(DEPARTMENTS),
  year: z.enum(YEARS),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

export const newRequestSchema = z.object({
  documentTypeId: z.string().min(1, "Choose a document"),
  purpose: z.string().trim().min(5, "Describe the purpose").max(300),
  academicYear: z.enum(ACADEMIC_YEARS),
});

// File constraints for supporting documents.
export const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
export const ACCEPTED_HINT = "PDF, JPG or PNG · up to 5 MB";

export type SignupInput = z.infer<typeof signupSchema>;
export type NewRequestInput = z.infer<typeof newRequestSchema>;
