import { render } from '@testing-library/react'
import { Skeleton, TableRowSkeleton } from './Skeleton'

describe('Skeleton', () => {
  it('renders a div', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('div')).toBeInTheDocument()
  })

  it('applies pulse animation style', () => {
    const { container } = render(<Skeleton />)
    const div = container.querySelector('div')
    expect(div).toHaveStyle({ animation: 'pulse 1.5s ease-in-out infinite' })
  })
})

describe('TableRowSkeleton', () => {
  it('renders a tr with 4 tds by default', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton />
        </tbody>
      </table>,
    )
    expect(container.querySelector('tr')).toBeInTheDocument()
    expect(container.querySelectorAll('td')).toHaveLength(4)
  })

  it('renders a tr with 3 tds when cols=3', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton cols={3} />
        </tbody>
      </table>,
    )
    expect(container.querySelector('tr')).toBeInTheDocument()
    expect(container.querySelectorAll('td')).toHaveLength(3)
  })
})
