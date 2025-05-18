#!/usr/bin/env node

/**
 * API Token Testing Script
 * 
 * This script tests various API endpoints using an API token for authentication.
 * 
 * Usage:
 *   node scripts/test-api-token.js <api-token> [base-url] [endpoint]
 * 
 * Examples:
 *   Test all endpoints:
 *   node scripts/test-api-token.js skt_d16270bb_7a6a8923f84205663183a7144f65cc62 http://localhost:3000
 *   
 *   Test specific endpoint:
 *   node scripts/test-api-token.js skt_d16270bb_7a6a8923f84205663183a7144f65cc62 http://localhost:3000 invoices
 */

// Get command line arguments
const apiToken = process.argv[2];
const baseUrl = process.argv[3] || 'http://localhost:3000';
const specificEndpoint = process.argv[4];

if (!apiToken) {
  console.error('Error: API token is required');
  console.log('Usage: node scripts/test-api-token.js <api-token> [base-url] [endpoint]');
  process.exit(1);
}

// Define the endpoints to test
const endpoints = [
  { method: 'GET', path: '/api/clients', name: 'List Clients' },
  { method: 'GET', path: '/api/vendors', name: 'List Vendors' },
  { method: 'GET', path: '/api/income-categories', name: 'List Income Categories' },
  { method: 'GET', path: '/api/expense-categories', name: 'List Expense Categories' },
  { method: 'GET', path: '/api/invoices', name: 'List Invoices' },
  { method: 'GET', path: '/api/quotes', name: 'List Quotes' },
  { method: 'GET', path: '/api/expenses', name: 'List Expenses' },
  { method: 'GET', path: '/api/income', name: 'List Income' },
];

// Filter endpoints if a specific one was requested
if (specificEndpoint) {
  const filteredEndpoints = endpoints.filter(
    endpoint => endpoint.path.includes(`/api/${specificEndpoint}`)
  );
  
  if (filteredEndpoints.length === 0) {
    console.error(`Error: No endpoint matched "${specificEndpoint}"`);
    console.log('Available endpoints:');
    endpoints.forEach(e => console.log(`- ${e.path.split('/').pop()}`));
    process.exit(1);
  }
  
  console.log(`Testing only ${specificEndpoint} endpoints`);
  endpoints.splice(0, endpoints.length, ...filteredEndpoints);
}

// Headers to include in all requests
const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json'
};

/**
 * Make an HTTP request to the given endpoint
 */
async function makeRequest(method, path) {
  const url = `${baseUrl}${path}`;
  console.log(`Testing ${method} ${url}`);

  try {
    const response = await fetch(url, {
      method,
      headers,
    });

    const status = response.status;
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    const data = isJson ? await response.json() : await response.text();

    return {
      status,
      data,
      success: response.ok,
    };
  } catch (error) {
    return {
      status: 'ERROR',
      data: error.message,
      success: false,
    };
  }
}

/**
 * Format the response for display
 */
function formatResponse(result) {
  const statusColor = result.success ? '\x1b[32m' : '\x1b[31m'; // Green for success, red for failure
  const resetColor = '\x1b[0m';
  
  let output = `${statusColor}Status: ${result.status}${resetColor}\n`;
  
  if (typeof result.data === 'object') {
    // Pretty print objects with limited depth
    output += `Data: ${JSON.stringify(result.data, null, 2).substring(0, 500)}`;
    
    // If data is truncated, indicate that
    if (JSON.stringify(result.data, null, 2).length > 500) {
      output += '...(truncated)';
    }
  } else {
    output += `Data: ${result.data.substring(0, 500)}`;
    if (result.data.length > 500) {
      output += '...(truncated)';
    }
  }
  
  return output;
}

/**
 * Test creating a sample resource
 */
async function testCreateResource() {
  console.log('\n--- Testing: Create Resources ---');
  
  // Create a client as a test
  const clientData = {
    name: `Test Client ${Date.now()}`,
    email: `test-${Date.now()}@example.com`,
    phone: '123-456-7890',
    paymentTerms: 15
  };
  
  const createResult = await fetch(`${baseUrl}/api/clients`, {
    method: 'POST',
    headers,
    body: JSON.stringify(clientData)
  });
  
  if (!createResult.ok) {
    console.log('\x1b[31mFailed to create test client\x1b[0m');
    console.log(formatResponse({
      status: createResult.status,
      data: await createResult.json(),
      success: false
    }));
    return null;
  }
  
  const createdClient = await createResult.json();
  console.log(`\x1b[32mCreated test client with ID: ${createdClient.id}\x1b[0m`);
  
  return createdClient;
}

/**
 * Test creating and getting an invoice
 */
async function testInvoiceOperations(clientId) {
  if (!clientId) return;
  
  console.log('\n--- Testing: Invoice Operations ---');
  
  // Create invoice data
  const invoiceData = {
    clientId,
    invoiceNumber: `INV-TEST-${Date.now()}`,
    status: 'draft',
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 10,
    notes: 'Test invoice created via API',
    items: [
      {
        description: 'Test Service',
        quantity: 1,
        unitPrice: '100.00'
      }
    ]
  };
  
  // Create invoice
  const createResult = await fetch(`${baseUrl}/api/invoices`, {
    method: 'POST',
    headers,
    body: JSON.stringify(invoiceData)
  });
  
  if (!createResult.ok) {
    console.log('\x1b[31mFailed to create test invoice\x1b[0m');
    console.log(formatResponse({
      status: createResult.status,
      data: await createResult.text(),
      success: false
    }));
    return;
  }
  
  const createdInvoice = await createResult.json();
  console.log(`\x1b[32mCreated test invoice with ID: ${createdInvoice.id}\x1b[0m`);
  
  // Get invoice details
  const getResult = await fetch(`${baseUrl}/api/invoices/${createdInvoice.id}`, {
    method: 'GET',
    headers
  });
  
  console.log('\nGet Invoice Details:');
  console.log(formatResponse({
    status: getResult.status,
    data: await getResult.json(),
    success: getResult.ok
  }));
  
  // Clean up - delete invoice
  const deleteResult = await fetch(`${baseUrl}/api/invoices/${createdInvoice.id}`, {
    method: 'DELETE',
    headers
  });
  
  console.log('\nDelete Invoice:');
  console.log(formatResponse({
    status: deleteResult.status,
    data: await deleteResult.json(),
    success: deleteResult.ok
  }));
}

/**
 * Test creating and getting a quote
 */
async function testQuoteOperations(clientId) {
  if (!clientId) return;
  
  console.log('\n--- Testing: Quote Operations ---');
  
  // Create quote data
  const quoteData = {
    clientId,
    quoteNumber: `QT-TEST-${Date.now()}`,
    status: 'draft',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 10,
    notes: 'Test quote created via API',
    items: [
      {
        description: 'Test Product',
        quantity: 2,
        unitPrice: '75.00'
      }
    ]
  };
  
  // Create quote
  const createResult = await fetch(`${baseUrl}/api/quotes`, {
    method: 'POST',
    headers,
    body: JSON.stringify(quoteData)
  });
  
  if (!createResult.ok) {
    console.log('\x1b[31mFailed to create test quote\x1b[0m');
    console.log(formatResponse({
      status: createResult.status,
      data: await createResult.text(),
      success: false
    }));
    return;
  }
  
  const createdQuote = await createResult.json();
  console.log(`\x1b[32mCreated test quote with ID: ${createdQuote.id}\x1b[0m`);
  
  // Get quote details
  const getResult = await fetch(`${baseUrl}/api/quotes/${createdQuote.id}`, {
    method: 'GET',
    headers
  });
  
  console.log('\nGet Quote Details:');
  console.log(formatResponse({
    status: getResult.status,
    data: await getResult.json(),
    success: getResult.ok
  }));
  
  // Clean up - delete quote
  const deleteResult = await fetch(`${baseUrl}/api/quotes/${createdQuote.id}`, {
    method: 'DELETE',
    headers
  });
  
  console.log('\nDelete Quote:');
  console.log(formatResponse({
    status: deleteResult.status,
    data: await deleteResult.json(),
    success: deleteResult.ok
  }));
}

/**
 * Clean up created test client
 */
async function cleanupTestClient(clientId) {
  if (!clientId) return;
  
  console.log('\n--- Cleaning Up Test Resources ---');
  
  const deleteResult = await fetch(`${baseUrl}/api/clients/${clientId}`, {
    method: 'DELETE',
    headers
  });
  
  console.log('Delete Test Client:');
  console.log(formatResponse({
    status: deleteResult.status,
    data: await deleteResult.json(),
    success: deleteResult.ok
  }));
}

/**
 * Run the tests
 */
async function runTests() {
  console.log(`\n=== Testing API Endpoints with Token: ${apiToken.substring(0, 10)}... ===\n`);

  // Test basic GET endpoints
  const endpointsToTest = specificEndpoint 
    ? endpoints.filter(e => e.path.includes(`/api/${specificEndpoint}`))
    : endpoints;
    
  for (const endpoint of endpointsToTest) {
    console.log(`\n--- Testing: ${endpoint.name} ---`);
    const result = await makeRequest(endpoint.method, endpoint.path);
    console.log(formatResponse(result));
    console.log('-----------------------------------');
  }
  
  // If no specific endpoint filter or if testing invoices/quotes endpoints
  if (!specificEndpoint || 
      specificEndpoint === 'invoices' || 
      specificEndpoint === 'quotes') {
    // Test creating resources
    const client = await testCreateResource();
    
    if (client) {
      // Test invoice operations if client was created successfully
      if (!specificEndpoint || specificEndpoint === 'invoices') {
        await testInvoiceOperations(client.id);
      }
      
      // Test quote operations if client was created successfully
      if (!specificEndpoint || specificEndpoint === 'quotes') {
        await testQuoteOperations(client.id);
      }
      
      // Clean up
      await cleanupTestClient(client.id);
    }
  }

  console.log('\n=== Tests Completed ===');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
}); 