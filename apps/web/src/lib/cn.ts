import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Join class names and let later Tailwind utilities override earlier ones. */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
