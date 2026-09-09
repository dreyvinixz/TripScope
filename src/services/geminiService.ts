import { answerSchema, planSchema, type AIRequest } from '../types/travel'
import { parseResponse, requestJson } from './httpClient'
export const GEMINI_PROXY_URL = '/api/gemini'
export async function generatePlan(request: Extract<AIRequest, { action: 'plan' }>, signal?: AbortSignal) {
  return parseResponse(planSchema, await requestJson(GEMINI_PROXY_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal,
  }, 50_000))
}
export async function askDestination(request: Extract<AIRequest, { action: 'question' }>, signal?: AbortSignal) {
  return parseResponse(answerSchema, await requestJson(GEMINI_PROXY_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request), signal,
  }, 50_000))
}
