import { render, screen } from '@testing-library/react';
import { BatteryUsageBar } from './BatteryUsageBar';

describe('BatteryUsageBar', () => {
  it('shows used and total bytes (with unit labels)', () => {
    render(<BatteryUsageBar total={1024*1024} used={512*1024} />);
    // Be tolerant to wrappers by matching via textContent; allow multiple matches
    const matches = screen.getAllByText((_, node) => !!node && node.textContent?.includes('MB') === true);
    expect(matches.length).toBeGreaterThan(0);
  });
  it('renders over indicator when used > total', () => {
    render(<BatteryUsageBar total={10} used={20} />);
    expect(screen.getByText(/OVER/)).toBeInTheDocument();
  });

  it('renders Persian unit labels when dir=rtl (e.g., GB -> گیگ)', () => {
    const root = document.documentElement;
    const prevDir = root.getAttribute('dir');
    root.setAttribute('dir', 'rtl');
    try {
      // used and total both in GB range to surface the گیگ unit clearly
      render(<BatteryUsageBar total={2 * 1024 ** 3} used={1 * 1024 ** 3} />);
      // We only assert the presence of the Persian unit label, not the digits
      expect(screen.getAllByText(/گیگ/).length).toBeGreaterThan(0);
    } finally {
      if (prevDir) root.setAttribute('dir', prevDir); else root.removeAttribute('dir');
    }
  });
});