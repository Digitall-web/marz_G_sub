import { render, screen } from '@testing-library/react';
import { QRModal } from './QRModal';

describe('QRModal', () => {
  it('renders when open', () => {
    render(<QRModal open={true} onClose={() => {}} config={'[Interface]\nPrivateKey=XXX'} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});