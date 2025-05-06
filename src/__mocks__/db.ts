// Mock implementation for the database
export const db = {
  select: jest.fn().mockReturnThis(),
  from: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  offset: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([{ id: 1 }]),
  execute: jest.fn().mockResolvedValue([]),
  values: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  transaction: jest.fn().mockImplementation(async (callback) => {
    // Provide a mock transaction object if needed by the callback
    const mockTx = { ...db }; // Simplified mock tx
    return await callback(mockTx);
  }),
}; 