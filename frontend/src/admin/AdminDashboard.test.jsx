// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import AdminDashboard from './AdminDashboard'
import { getAdminDashboard } from '../services/adminService'

vi.mock('../services/adminService', () => ({
  getAdminDashboard: vi.fn(),
}))

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows database-backed metrics and monthly sales analytics', async () => {
    getAdminDashboard.mockResolvedValue({
      customerCount: 27,
      productCount: 4,
      orderCount: 12,
      revenue: 1250,
      monthlyMetrics: [
        { month: '2026-06', orderCount: 0, revenue: 0 },
        { month: '2026-07', orderCount: 0, revenue: 0 },
        { month: '2026-08', orderCount: 0, revenue: 0 },
        { month: '2026-09', orderCount: 0, revenue: 0 },
        { month: '2026-10', orderCount: 0, revenue: 0 },
        { month: '2026-11', orderCount: 12, revenue: 1250 },
      ],
    })

    render(<AdminDashboard />)

    expect(await screen.findByText('27')).toBeTruthy()
    expect(screen.getByText('4')).toBeTruthy()
    expect(screen.getByText('12')).toBeTruthy()
    expect(screen.getAllByText('₹1,250.00')).toHaveLength(2)
    expect(screen.getByText('Sales analytics')).toBeTruthy()
    expect(screen.getByText('12 orders')).toBeTruthy()
    expect(screen.getByText('Enquiries and selling requests')).toBeTruthy()
  })

  it('shows an honest empty state when there are no products, orders, or payments', async () => {
    getAdminDashboard.mockResolvedValue({
      customerCount: 0,
      productCount: 0,
      orderCount: 0,
      revenue: 0,
      monthlyMetrics: Array.from({ length: 6 }, (_, index) => ({
        month: `2026-${String(index + 6).padStart(2, '0')}`,
        orderCount: 0,
        revenue: 0,
      })),
    })

    render(<AdminDashboard />)

    expect(await screen.findByText('No sales recorded yet')).toBeTruthy()
    expect(screen.getByText('₹0.00', { selector: '.admin-metric-value' })).toBeTruthy()
  })
})
