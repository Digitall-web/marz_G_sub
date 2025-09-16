/// <reference types="vitest" />
import { render, screen } from '@testing-library/react';
import App from '../App';

vi.mock('../useAccount', () => ({
  useAccount: () => ({ data: { name: 'Test', clientConfig: '[Interface]\nPrivateKey=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa\nPublicKey=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', status: 'Active', totalTraffic:0, dataLimit:0 }, loading:false, error:null, reload:()=>{}, token:'t', apiUrl:null, refreshing:true })
}));
vi.mock('qrcode', () => ({ toCanvas: vi.fn() }));

vi.mock('../i18n', async () => {
  const actual = await vi.importActual<any>('../i18n');
  return { ...actual };
});

describe('Refreshing overlay', () => {
  it('shows refreshing label', () => {
    render(<App />);
    expect(screen.getByText(/Refreshing|در حال بروزرسانی/)).toBeInTheDocument();
  });
});
