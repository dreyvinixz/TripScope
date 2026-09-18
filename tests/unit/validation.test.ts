import { describe, expect, it } from 'vitest'
import { parseBrl } from '../../src/utils/validation'

describe('parseBrl', () => {
  it.each([
    ['0', 0],
    ['1000', 1000],
    ['1.000,50', 1000.5],
    ['1000,50', 1000.5],
    ['1000.50', 1000.5],
    ['1.000.000', 1_000_000],
  ])('converte %s para o valor numérico esperado', (input, expected) => {
    expect(parseBrl(input)).toBe(expected)
  })

  it.each(['', '   ', '-1', '1000001', '1.000,999', 'abc', '1,234.56'])('rejeita entrada inválida: %s', (input) => {
    expect(parseBrl(input)).toBeNull()
  })
})
