// Mock client schema
export const clientSchema = {
  parse: jest.fn((data) => {
    // Validation logic
    if (!data.name) {
      throw new Error('Name is required');
    }
    return data;
  })
}; 