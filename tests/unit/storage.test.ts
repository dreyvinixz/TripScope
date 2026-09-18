import { beforeEach, describe, expect, it, vi } from 'vitest'
import { historySchema, readStored, themeSchema, writeStored } from '../../src/utils/storage'

beforeEach(() => localStorage.clear())

describe('storage opcional', () => {
  it('lê valores válidos e usa fallback para JSON corrompido ou schema inválido', () => {
    localStorage.setItem('history', JSON.stringify(['Tokyo']))
    expect(readStored('history', historySchema, [])).toEqual(['Tokyo'])

    localStorage.setItem('history', '{')
    expect(readStored('history', historySchema, ['Fallback'])).toEqual(['Fallback'])

    localStorage.setItem('theme', JSON.stringify('sepia'))
    expect(readStored('theme', themeSchema, 'light')).toBe('light')
  })

  it('não propaga falhas de leitura ou escrita do armazenamento', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
    expect(readStored('history', historySchema, [])).toEqual([])
    getItem.mockRestore()

    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked') })
    expect(() => writeStored('history', ['Tokyo'])).not.toThrow()
    setItem.mockRestore()
  })
})
