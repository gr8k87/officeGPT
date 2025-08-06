// client/src/lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// This 'export' is the critical part
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}