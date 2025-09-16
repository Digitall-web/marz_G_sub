/// <reference types="vitest" />
import { render } from '@testing-library/react';
import { ProgressRing } from './ProgressRing';

// Basic smoke test to ensure rtl prop applies transform (mirror)

describe('ProgressRing RTL', () => {
  it('applies scaleX(-1) when rtl=true', () => {
    const { container } = render(<ProgressRing progress={0.3} rtl />);
    const svg = container.querySelector('svg');
    expect(svg?.style.transform).toContain('scaleX(-1)');
  });
});
