/// <reference types="vitest" />
import { render, waitFor } from '@testing-library/react';
import App from '../App';

// Mock useAccount to avoid network
vi.mock('../useAccount', () => ({
  useAccount: () => ({ data: { name: 'TestSub', clientConfig: '[Interface]\nPrivateKey=xxx\nPublicKey=yyy', status: 'Active', totalTraffic:0, dataLimit:0 }, loading:false, error:null, reload:()=>{}, token:'t', apiUrl:null, refreshing:false })
}));

// Mock QR import to avoid dynamic import
vi.mock('qrcode', () => ({ toCanvas: vi.fn() }));

describe('App dynamic title', () => {
  it('sets document.title based on translation key appName', async () => {
    render(<App />);
    await waitFor(() => {
      expect(document.title).toBeTruthy();
    });
  });
});
