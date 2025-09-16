import { render, screen, fireEvent } from '@testing-library/react';
import { AnimatedWGIcon } from './AnimatedWGIcon';

describe('AnimatedWGIcon', () => {
  it('renders with accessible role', () => {
    render(<AnimatedWGIcon title="WireGuard" />);
    expect(screen.getByRole('img', { name: /wireguard/i })).toBeInTheDocument();
  });

  it('falls back to local asset on error', () => {
    render(<AnimatedWGIcon title="WireGuard" />);
    const img = screen.getByRole('img', { name: /wireguard/i }) as HTMLImageElement;
    const original = img.getAttribute('src');
    // simulate error
    fireEvent.error(img);
    const after = img.getAttribute('src');
    expect(after).not.toBeNull();
    expect(after).not.toEqual(original);
  });
});
