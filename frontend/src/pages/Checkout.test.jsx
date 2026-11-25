// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { CheckoutPage, OrderConfirmationPage } from './Checkout'
import { createCustomerOrder, getCustomerProfile } from '../services/orderService'

vi.mock('../services/orderService', () => ({
  createCustomerOrder: vi.fn(),
  getCustomerOrder: vi.fn(),
  getCustomerOrders: vi.fn(),
  getCustomerProfile: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('checkout', () => {
  it('creates an order from the selected cart items and clears the cart after success', async () => {
    const user = userEvent.setup()
    const onOrderPlaced = vi.fn()
    const order = {
      orderNumber: 'SW-TEST-ORDER',
      status: 'PENDING',
      paymentStatus: 'PENDING',
      estimatedAmount: 150,
      items: [{
        id: 1,
        productName: 'Copper Scrap',
        imageUrl: 'https://example.com/copper.jpg',
        pricePerKg: 50,
        quantityKg: 3,
        estimatedTotal: 150,
      }],
    }
    getCustomerProfile.mockResolvedValue({
      fullName: 'Alex Morgan',
      email: 'alex@example.com',
      phone: '9876543210',
    })
    createCustomerOrder.mockResolvedValue(order)
    const cart = [{
      material: {
        id: 'copper',
        name: 'Copper Scrap',
        price: 50,
        images: ['https://example.com/copper.jpg'],
      },
      weight: 3,
    }]

    render(
      <MemoryRouter initialEntries={['/checkout']}>
        <Routes>
          <Route path="/checkout" element={<CheckoutPage cart={cart} user={{ fullName: 'Alex Morgan', email: 'alex@example.com' }} onOrderPlaced={onOrderPlaced} />} />
          <Route path="/order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
        </Routes>
      </MemoryRouter>,
    )

    await screen.findByDisplayValue('9876543210')
    await user.type(screen.getByLabelText('Address'), '12 Green Street')
    await user.type(screen.getByLabelText('City'), 'Pune')
    await user.type(screen.getByLabelText('State'), 'Maharashtra')
    await user.type(screen.getByLabelText('Pincode'), '411001')
    await user.type(screen.getByLabelText('Preferred date'), '2030-01-15')
    await user.selectOptions(screen.getByLabelText('Preferred time'), '9:00 AM - 12:00 PM')
    await user.click(screen.getByRole('button', { name: 'Place Order' }))

    expect(await screen.findByRole('heading', { name: 'Order Successfully Placed' })).toBeTruthy()
    expect(createCustomerOrder).toHaveBeenCalledWith(expect.objectContaining({
      paymentMethod: 'CASH_ON_PICKUP',
      fulfillmentType: 'PICKUP',
      items: [{
        productKey: 'copper',
        productName: 'Copper Scrap',
        imageUrl: 'https://example.com/copper.jpg',
        pricePerKg: 50,
        quantityKg: 3,
      }],
    }))
    expect(onOrderPlaced).toHaveBeenCalledOnce()
    expect(screen.getByText('SW-TEST-ORDER')).toBeTruthy()
  })
})
