import { render, screen } from '@testing-library/react';
import { StatusPill } from './StatusPill';

describe('StatusPill', () => {
  it('renders Active label', () => {
    render(<StatusPill status="Active" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
  it('renders custom labels', () => {
    render(<StatusPill status="OnHold" labels={{ OnHold: 'Waiting' }} />);
    expect(screen.getByText('Waiting')).toBeInTheDocument();
  });
});