// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AdminManagement from './AdminManagement'

describe('AdminManagement', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  it('creates a product with a default category and shows it in inventory', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<AdminManagement section="products" />)

    await user.click(screen.getAllByRole('button', { name: '＋ Add product' })[0])

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getByRole('option', { name: 'Waste Paper' })).toBeTruthy()
    await user.type(within(dialog).getByLabelText('Product name'), 'Sorted paper')
    await user.selectOptions(within(dialog).getByLabelText('Category'), 'Waste Paper')
    await user.type(within(dialog).getByLabelText('Price'), '12.5')
    await user.type(within(dialog).getByLabelText('Available quantity'), '25')
    await user.type(within(dialog).getByLabelText('Minimum stock'), '5')
    await user.click(within(dialog).getByRole('button', { name: 'Create' }))

    expect(await screen.findByText('Sorted paper')).toBeTruthy()
    unmount()

    render(<AdminManagement section="inventory" />)
    expect(screen.getByText('Sorted paper')).toBeTruthy()
    expect(screen.getByText('25 kg')).toBeTruthy()
  })

  it('records stock out, updates availability and adds stock history', async () => {
    const user = userEvent.setup()
    render(<AdminManagement section="products" />)
    await user.click(screen.getAllByRole('button', { name: '＋ Add product' })[0])
    const productDialog = screen.getByRole('dialog')
    await user.type(within(productDialog).getByLabelText('Product name'), 'Copper scrap')
    await user.selectOptions(within(productDialog).getByLabelText('Category'), 'Copper')
    await user.type(within(productDialog).getByLabelText('Price'), '450')
    await user.type(within(productDialog).getByLabelText('Available quantity'), '20')
    await user.type(within(productDialog).getByLabelText('Minimum stock'), '3')
    await user.click(within(productDialog).getByRole('button', { name: 'Create' }))

    cleanup()
    render(<AdminManagement section="inventory" />)
    await user.click(screen.getByRole('button', { name: '＋ Stock in / out' }))
    const stockDialog = screen.getByRole('dialog')
    await user.selectOptions(within(stockDialog).getByLabelText('Product'), within(stockDialog).getByRole('option', { name: /Copper scrap/ }).getAttribute('value'))
    await user.selectOptions(within(stockDialog).getByLabelText('Movement'), 'out')
    await user.type(within(stockDialog).getByLabelText('Quantity'), '4')
    await user.selectOptions(within(stockDialog).getByLabelText('Reason'), 'Sale')
    await user.click(within(stockDialog).getByRole('button', { name: 'Save movement' }))

    expect(screen.getByText('16 kg')).toBeTruthy()
    expect(screen.getAllByText('4 kg')).toHaveLength(2)
    expect(screen.getByText('Sale')).toBeTruthy()
  })
})
