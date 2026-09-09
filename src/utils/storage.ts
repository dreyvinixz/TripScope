import { z } from 'zod'
import { locationSchema } from '../types/travel'
export function readStored<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  try {
    const result = schema.safeParse(JSON.parse(localStorage.getItem(key) ?? 'null') as unknown)
    return result.success ? result.data : fallback
  } catch { return fallback }
}
export function writeStored(key: string, value: unknown): void {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch { /* Preferências são opcionais; armazenamento pode estar bloqueado. */ }
}
export const historySchema = z.array(z.string().min(2).max(100)).max(8)
export const favoritesSchema = z.array(locationSchema).max(12)
export const themeSchema = z.enum(['light', 'dark'])
