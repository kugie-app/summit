// Mock implementation for next-auth

// Mock the getServerSession function
export const getServerSession = jest.fn().mockResolvedValue(null);

// Export other next-auth functions that might be needed
export const signIn = jest.fn();
export const signOut = jest.fn();
export const useSession = jest.fn().mockReturnValue({
  data: null,
  status: 'unauthenticated',
  update: jest.fn()
}); 