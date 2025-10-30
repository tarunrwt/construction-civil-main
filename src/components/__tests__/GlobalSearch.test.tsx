import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import GlobalSearch from '@/components/GlobalSearch'

// Mock the navigate function
const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

// Mock Supabase
const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ 
      data: { user: { id: 'test-user-id' } }, 
      error: null 
    }),
  },
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
  }),
}

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('GlobalSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input', () => {
    renderWithRouter(<GlobalSearch />)
    
    expect(screen.getByPlaceholderText('Search projects, reports, materials...')).toBeInTheDocument()
  })

  it('shows search results when typing', async () => {
    // Mock search results
    mockSupabase.from().mockResolvedValue({
      data: [
        {
          id: '1',
          name: 'Test Project',
          description: 'A test project',
          created_at: '2023-12-01'
        }
      ],
      error: null
    })

    renderWithRouter(<GlobalSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search projects, reports, materials...')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })
  })

  it('clears search when clear button is clicked', () => {
    renderWithRouter(<GlobalSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search projects, reports, materials...')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    const clearButton = screen.getByRole('button')
    fireEvent.click(clearButton)
    
    expect(searchInput).toHaveValue('')
  })

  it('navigates to result when clicked', async () => {
    // Mock search results
    mockSupabase.from().mockResolvedValue({
      data: [
        {
          id: '1',
          name: 'Test Project',
          description: 'A test project',
          created_at: '2023-12-01'
        }
      ],
      error: null
    })

    renderWithRouter(<GlobalSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search projects, reports, materials...')
    fireEvent.change(searchInput, { target: { value: 'test' } })
    
    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument()
    })
    
    const resultItem = screen.getByText('Test Project')
    fireEvent.click(resultItem)
    
    expect(mockNavigate).toHaveBeenCalled()
  })

  it('shows no results message when no results found', async () => {
    // Mock empty search results
    mockSupabase.from().mockResolvedValue({
      data: [],
      error: null
    })

    renderWithRouter(<GlobalSearch />)
    
    const searchInput = screen.getByPlaceholderText('Search projects, reports, materials...')
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } })
    
    await waitFor(() => {
      expect(screen.getByText('No results found for "nonexistent"')).toBeInTheDocument()
    })
  })
})
