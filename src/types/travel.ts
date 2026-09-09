import { z } from 'zod'
export const interests = ['Tecnologia', 'Cultura', 'Gastronomia', 'Natureza', 'Compras', 'História', 'Museus', 'Vida noturna', 'Arquitetura', 'Relaxamento'] as const
export const locationSchema = z.object({
  id: z.number().int(), city: z.string().min(1).max(100), region: z.string().max(150),
  country: z.string().min(1).max(100), countryCode: z.string().regex(/^[A-Z]{2}$/),
  latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
  timezone: z.string().min(1).max(100),
})
export const forecastSchema = z.object({
  date: z.iso.date(), minimumTemperatureCelsius: z.number().min(-100).max(70),
  maximumTemperatureCelsius: z.number().min(-100).max(70),
  precipitationProbabilityPercent: z.number().min(0).max(100).nullable(), weatherCode: z.number().int(),
})
export const contextSchema = z.object({
  location: locationSchema,
  forecast: z.array(forecastSchema).max(5),
  currencyQuote: z.object({ baseCurrency: z.literal('BRL'), targetCurrency: z.string().regex(/^[A-Z]{3}$/),
    rate: z.number().positive().max(1_000_000), quotedAt: z.iso.date() }).nullable(),
  country: z.object({ officialName: z.string().max(200), capital: z.string().max(200).nullable(),
    languages: z.string().max(300).nullable(), currencies: z.array(z.string().regex(/^[A-Z]{3}$/)).max(10) }).nullable(),
})
const preferences = {
  days: z.number().int().min(1).max(14), budgetBrl: z.number().positive().max(1_000_000),
  interests: z.array(z.enum(interests)).min(1).max(10),
}
export const aiRequestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('plan'), context: contextSchema, ...preferences }),
  z.object({ action: z.literal('question'), context: contextSchema, question: z.string().trim().min(3).max(1000),
    preferences: z.object(preferences).nullable() }),
])
const paragraph = z.string().min(1).max(2500)
export const planSchema = z.object({
  summary: paragraph,
  days: z.array(z.object({ day: z.number().int().min(1).max(14), morning: paragraph, afternoon: paragraph, evening: paragraph })).min(1).max(14),
  notes: z.array(z.string().min(1).max(700)).max(8),
})
export const answerSchema = z.object({ answer: z.string().min(1).max(8000) })
export type TravelPlan = z.infer<typeof planSchema>
export type AIRequest = z.infer<typeof aiRequestSchema>
export type TravelContext = z.infer<typeof contextSchema>
export type TravelPreferences = Extract<AIRequest, { action: 'question' }>['preferences']
