import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SearchBar } from '../../src/components/SearchBar/SearchBar'

describe('SearchBar', () => {
  it('normaliza e envia uma cidade válida', async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(<SearchBar onSearch={onSearch} />)

    await user.type(screen.getByRole('searchbox'), '  Tokyo  ')
    await user.click(screen.getByRole('button', { name: 'Pesquisar' }))

    expect(onSearch).toHaveBeenCalledWith('Tokyo')
  })
})

