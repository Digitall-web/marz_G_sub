import { render } from '@testing-library/react';
import { StatusSkeleton } from './StatusSkeleton';

describe('StatusSkeleton', () => {
  it('renders skeleton container', () => {
    const { container } = render(<StatusSkeleton />);
    expect(container.querySelector('.space-y-6')).toBeTruthy();
  });
});