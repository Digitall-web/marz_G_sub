import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('calls onClick', () => {
    const fn = vi.fn();
    render(<Button onClick={fn}>Tap</Button>);
    fireEvent.click(screen.getByText('Tap'));
    expect(fn).toHaveBeenCalled();
  });
});