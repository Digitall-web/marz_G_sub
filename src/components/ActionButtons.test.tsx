/// <reference types="vitest" />
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../App';

vi.mock('../useAccount', () => ({
  useAccount: () => ({ data: { name: 'Test', clientConfig: '[Interface]\nPrivateKey=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\nPublicKey=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', status: 'Active', totalTraffic:0, dataLimit:0 }, loading:false, error:null, reload:()=>{}, token:'t', apiUrl:null, refreshing:false })
}));
vi.mock('qrcode', () => ({ toCanvas: vi.fn() }));

describe('Action buttons tooltips & loading', () => {
  it('shows tooltip titles', () => {
    render(<App />);
    const copyBtn = screen.getAllByTitle(/Copy|کپی/)[0];
    expect(copyBtn).toBeInTheDocument();
  });
  it('copy button click works (no throw)', () => {
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
    render(<App />);
    const copyBtn = screen.getAllByText(/Copy config|کپی کانفیگ/)[0];
    fireEvent.click(copyBtn);
  });
});
