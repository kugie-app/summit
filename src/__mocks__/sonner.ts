// Mock for sonner toast library
export const toast = {
  success: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warning: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn(),
  custom: jest.fn(),
  promise: jest.fn()
}; 