// Mock implementation for next/navigation
export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn()
}));

export const usePathname = jest.fn(() => '/mock-path');

export const useSearchParams = jest.fn(() => new URLSearchParams()); 