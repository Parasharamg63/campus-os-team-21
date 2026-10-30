import { describe, expect, it } from 'vitest'
import { renderRoute, screen } from '@/test/render'
import track from '../index'

describe('maintenance-tickets track', () => {
  it('renders its home screen', async () => {
    renderRoute({ route: '/tracks/maintenance-tickets', user: true, tracks: [track] })
    expect(await screen.findByRole('heading', { name: 'Maintenance Tickets' })).toBeInTheDocument()
  })
})
