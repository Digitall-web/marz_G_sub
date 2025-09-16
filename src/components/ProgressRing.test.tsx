/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import { ProgressRing } from './ProgressRing';

describe('ProgressRing', () => {
  it('renders percentage text', () => {
    render(<ProgressRing progress={0.42} label="Usage" />);
    expect(screen.getByText('42%')).toBeInTheDocument();
    expect(screen.getByText('Usage')).toBeInTheDocument();
  });
  it('clamps values >1 to 100%', () => {
    render(<ProgressRing progress={5} label="Overflow" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});
