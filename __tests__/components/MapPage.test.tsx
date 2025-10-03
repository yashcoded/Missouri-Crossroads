import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import MapPage from '../../app/map/page'

// Mock the MissouriMap component
jest.mock('../../app/components/MissouriMap', () => {
  return function MockMissouriMap({ fileName }: { fileName: string }) {
    return <div data-testid="missouri-map">Mock Missouri Map - {fileName}</div>
  }
})

describe('MapPage Component', () => {
  test('renders map page with title', () => {
    render(<MapPage />)
    
    expect(screen.getByText('Missouri Crossroads Interactive Map')).toBeInTheDocument()
    expect(screen.getByText(/Explore.*Missouri Historical Locations/)).toBeInTheDocument()
  })

  test('renders MissouriMap component', () => {
    render(<MapPage />)
    
    expect(screen.getByTestId('missouri-map')).toBeInTheDocument()
    expect(screen.getByText('Mock Missouri Map - metadata-1759267238657.csv')).toBeInTheDocument()
  })

  test('has proper styling classes', () => {
    const { container } = render(<MapPage />)
    
    // Check for gradient background
    expect(container.querySelector('.bg-gradient-to-br')).toBeInTheDocument()
    
    // Check for title styling
    expect(screen.getByText('Missouri Crossroads Interactive Map')).toHaveClass('text-5xl', 'font-bold')
  })
})
