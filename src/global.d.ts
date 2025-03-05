// global.d.ts
interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: any
  };
}
