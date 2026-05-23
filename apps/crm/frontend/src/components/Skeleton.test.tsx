import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Skeleton, CardSkeleton, TableRowSkeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders with animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    const el = container.firstChild as HTMLElement
    expect(el).toHaveClass('animate-pulse')
  })
})

describe('CardSkeleton', () => {
  it('renders with two child skeletons', () => {
    const { container } = render(<CardSkeleton />)
    const pulseEls = container.querySelectorAll('.animate-pulse')
    expect(pulseEls).toHaveLength(2)
  })
})

describe('TableRowSkeleton', () => {
  it('with default cols=4 renders a tr with 4 tds', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton />
        </tbody>
      </table>,
    )
    const tds = container.querySelectorAll('td')
    expect(tds).toHaveLength(4)
  })

  it('with cols=3 renders a tr with 3 tds', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton cols={3} />
        </tbody>
      </table>,
    )
    const tds = container.querySelectorAll('td')
    expect(tds).toHaveLength(3)
  })
})
