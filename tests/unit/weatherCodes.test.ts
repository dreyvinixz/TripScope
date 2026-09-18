import { describe, expect, it } from 'vitest'
import { getWeatherCondition } from '../../src/utils/weatherCodes'

describe('códigos meteorológicos', () => {
  it('mapeia código conhecido para descrição e ícone acessível', () => {
    expect(getWeatherCondition(61)).toEqual({
      description: 'Chuva', icon: '🌧', iconLabel: 'Ícone de chuva',
    })
  })

  it('usa fallback acessível para código desconhecido', () => {
    expect(getWeatherCondition(999)).toEqual({
      description: 'Condição não identificada', icon: '◇', iconLabel: 'Condição meteorológica não identificada',
    })
  })
})
