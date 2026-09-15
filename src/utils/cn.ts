import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Hàm trợ giúp hợp nhất class CSS và xử lý xung đột class Tailwind CSS an toàn
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
