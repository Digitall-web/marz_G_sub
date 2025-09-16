import { render, screen } from '@testing-library/react';
import { DateChip } from './DateChip';

// We only test the EN branch to avoid locale path differences in CI environments.
describe('DateChip', () => {
  it('renders ISO date for EN', () => {
    render(<DateChip date={new Date('2024-05-15T00:00:00Z')} lang="en" />);
    expect(screen.getByText('2024-05-15')).toBeInTheDocument();
  });
  it('returns null if no date', () => {
    const { container } = render(<DateChip date={null} lang="en" />);
    expect(container).toBeEmptyDOMElement();
  });
  it('shows Invalid for bad date', () => {
    // Pass clearly invalid date string
    render(<DateChip date={"not-a-date"} lang="en" />);
    expect(screen.getByText('Invalid')).toBeInTheDocument();
  });
});