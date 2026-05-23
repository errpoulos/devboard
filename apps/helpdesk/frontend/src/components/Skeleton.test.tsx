import { render } from '@testing-library/react'
import { Skeleton, TableRowSkeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders a div with animate-pulse class', () => {
    const { container } = render(<Skeleton />)
    const div = container.firstChild as HTMLElement
    expect(div.tagName).toBe('DIV')
    expect(div).toHaveClass('animate-pulse')
  })
})

describe('TableRowSkeleton', () => {
  it('renders a tr with 5 td cells by default', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton />
        </tbody>
      </table>,
    )
    const tds = container.querySelectorAll('td')
    expect(tds).toHaveLength(5)
  })

  it('renders the specified number of td cells', () => {
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
