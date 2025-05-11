#!/usr/bin/env node

/**
 * Advanced API Token Testing Script
 * 
 * This script tests various API endpoints including GET, POST, PUT, and DELETE
 * operations using an API token for authentication.
 * 
 * Usage:
 *   node scripts/test-api-token-advanced.js <api-token> [base-url] [test-name]
 * 
 * Examples:
 *   Test all endpoints:
 *   node scripts/test-api-token-advanced.js skt_d16270bb_7a6a8923f84205663183a7144f65cc62
 *   
 *   Test a specific operation:
 *   node scripts/test-api-token-advanced.js skt_d16270bb_7a6a8923f84205663183a7144f65cc62 http://localhost:3000 create-client
 */

// Get command line arguments
const apiToken = process.argv[2];
const baseUrl = process.argv[3] || 'http://localhost:3000';
const targetTest = process.argv[4]; // Optional specific test to run

if (!apiToken) {
  console.error('Error: API token is required');
  console.log('Usage: node scripts/test-api-token-advanced.js <api-token> [base-url] [test-name]');
  process.exit(1);
}

// Store created resources for cleanup
const createdResources = {
  clientId: null,
  vendorId: null,
  incomeCategoryId: null,
  invoiceId: null,
  quoteId: null,
};

// Define test operations
const tests = [
  // ------ GET Requests (Listing Resources) ------
  {
    name: 'list-clients',
    method: 'GET',
    path: '/api/clients',
    description: 'List all clients',
  },
  {
    name: 'list-vendors',
    method: 'GET',
    path: '/api/vendors',
    description: 'List all vendors',
  },
  {
    name: 'list-income-categories',
    method: 'GET',
    path: '/api/income-categories',
    description: 'List all income categories',
  },
  {
    name: 'list-invoices',
    method: 'GET',
    path: '/api/invoices',
    description: 'List all invoices',
  },
  {
    name: 'list-quotes',
    method: 'GET',
    path: '/api/quotes',
    description: 'List all quotes',
  },

  // ------ POST Requests (Creating Resources) ------
  {
    name: 'create-client',
    method: 'POST',
    path: '/api/clients',
    description: 'Create a new client',
    body: {
      name: 'Test Client (API Token)',
      email: `test-client-${Date.now()}@example.com`,
      phone: '123-456-7890',
      paymentTerms: 15,
    },
    postProcess: (result) => {
      if (result.success && result.data) {
        createdResources.clientId = result.data.id;
        console.log(`Created client with ID: ${createdResources.clientId}`);
      }
    },
  },
  {
    name: 'create-vendor',
    method: 'POST',
    path: '/api/vendors',
    description: 'Create a new vendor',
    body: {
      name: 'Test Vendor (API Token)',
      email: `test-vendor-${Date.now()}@example.com`,
      phone: '123-456-7890',
    },
    postProcess: (result) => {
      if (result.success && result.data && result.data.data) {
        createdResources.vendorId = result.data.data.id;
        console.log(`Created vendor with ID: ${createdResources.vendorId}`);
      }
    },
  },
  {
    name: 'create-income-category',
    method: 'POST',
    path: '/api/income-categories',
    description: 'Create a new income category',
    body: {
      name: `Test Category ${Date.now()}`,
    },
    postProcess: (result) => {
      if (result.success && result.data) {
        createdResources.incomeCategoryId = result.data.id;
        console.log(`Created income category with ID: ${createdResources.incomeCategoryId}`);
      }
    },
  },
  {
    name: 'create-invoice',
    method: 'POST',
    path: '/api/invoices',
    description: 'Create a new invoice',
    skipIf: () => !createdResources.clientId,
    body: () => ({
      clientId: createdResources.clientId,
      invoiceNumber: `INV-${Date.now()}`,
      status: 'draft',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      tax: 10,
      notes: 'Test invoice created via API token',
      items: [
        {
          description: 'Test Service 1',
          quantity: 1,
          unitPrice: '100'
        },
        {
          description: 'Test Service 2',
          quantity: 2,
          unitPrice: '50'
        }
      ]
    }),
    postProcess: (result) => {
      if (result.success && result.data) {
        createdResources.invoiceId = result.data.id;
        console.log(`Created invoice with ID: ${createdResources.invoiceId}`);
      }
    },
  },
  {
    name: 'create-quote',
    method: 'POST',
    path: '/api/quotes',
    description: 'Create a new quote',
    skipIf: () => !createdResources.clientId,
    body: () => ({
      clientId: createdResources.clientId,
      quoteNumber: `QT-${Date.now()}`,
      status: 'draft',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      taxRate: 10,
      notes: 'Test quote created via API token',
      items: [
        {
          description: 'Test Product 1',
          quantity: 1,
          unitPrice: '200.00'
        },
        {
          description: 'Test Product 2',
          quantity: 3,
          unitPrice: '75.00'
        }
      ]
    }),
    postProcess: (result) => {
      if (result.success && result.data) {
        createdResources.quoteId = result.data.id;
        console.log(`Created quote with ID: ${createdResources.quoteId}`);
      }
    },
  },

  // ------ GET Detail Requests (Getting Single Resources) ------
  {
    name: 'get-client-detail',
    method: 'GET',
    description: 'Get client details',
    getPath: () => `/api/clients/${createdResources.clientId}`,
    skipIf: () => !createdResources.clientId,
  },
  {
    name: 'get-vendor-detail',
    method: 'GET',
    description: 'Get vendor details',
    getPath: () => `/api/vendors/${createdResources.vendorId}`,
    skipIf: () => !createdResources.vendorId,
  },
  {
    name: 'get-income-category-detail',
    method: 'GET',
    description: 'Get income category details',
    getPath: () => `/api/income-categories/${createdResources.incomeCategoryId}`,
    skipIf: () => !createdResources.incomeCategoryId,
  },
  {
    name: 'get-invoice-detail',
    method: 'GET',
    description: 'Get invoice details',
    getPath: () => `/api/invoices/${createdResources.invoiceId}`,
    skipIf: () => !createdResources.invoiceId,
  },
  {
    name: 'get-quote-detail',
    method: 'GET',
    description: 'Get quote details',
    getPath: () => `/api/quotes/${createdResources.quoteId}`,
    skipIf: () => !createdResources.quoteId,
  },

  // ------ PUT Requests (Updating Resources) ------
  {
    name: 'update-client',
    method: 'PUT',
    description: 'Update client',
    getPath: () => `/api/clients/${createdResources.clientId}`,
    body: {
      name: 'Updated Test Client (API Token)',
      email: `updated-test-client-${Date.now()}@example.com`,
      phone: '987-654-3210',
      paymentTerms: 30,
    },
    skipIf: () => !createdResources.clientId,
  },
  {
    name: 'update-vendor',
    method: 'PUT',
    description: 'Update vendor',
    getPath: () => `/api/vendors/${createdResources.vendorId}`,
    body: {
      name: 'Updated Test Vendor (API Token)',
      email: `updated-test-vendor-${Date.now()}@example.com`,
      phone: '987-654-3210',
    },
    skipIf: () => !createdResources.vendorId,
  },
  {
    name: 'update-income-category',
    method: 'PUT',
    description: 'Update income category',
    getPath: () => `/api/income-categories/${createdResources.incomeCategoryId}`,
    body: {
      name: `Updated Test Category ${Date.now()}`,
    },
    skipIf: () => !createdResources.incomeCategoryId,
  },
  {
    name: 'update-invoice',
    method: 'PUT',
    description: 'Update invoice',
    getPath: () => `/api/invoices/${createdResources.invoiceId}`,
    skipIf: () => !createdResources.invoiceId,
    body: () => ({
      clientId: createdResources.clientId,
      invoiceNumber: `INV-UPD-${Date.now()}`,
      status: 'sent',
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      taxRate: 11,
      notes: 'Updated test invoice via API token',
      items: [
        {
          description: 'Updated Service 1',
          quantity: 2,
          unitPrice: '120.00'
        },
        {
          description: 'Updated Service 2',
          quantity: 1,
          unitPrice: '75.00'
        }
      ]
    }),
  },
  {
    name: 'update-quote',
    method: 'PUT',
    description: 'Update quote',
    getPath: () => `/api/quotes/${createdResources.quoteId}`,
    skipIf: () => !createdResources.quoteId,
    body: () => ({
      clientId: createdResources.clientId,
      quoteNumber: `QT-UPD-${Date.now()}`,
      status: 'sent',
      issueDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      taxRate: 11,
      notes: 'Updated test quote via API token',
      items: [
        {
          description: 'Updated Product 1',
          quantity: 2,
          unitPrice: '225.00'
        },
        {
          description: 'Updated Product 2',
          quantity: 2,
          unitPrice: '85.00'
        }
      ]
    }),
  },

  // ------ DELETE Requests (Removing Resources) ------
  {
    name: 'delete-invoice',
    method: 'DELETE',
    description: 'Delete invoice',
    getPath: () => `/api/invoices/${createdResources.invoiceId}`,
    skipIf: () => !createdResources.invoiceId,
  },
  {
    name: 'delete-quote',
    method: 'DELETE',
    description: 'Delete quote',
    getPath: () => `/api/quotes/${createdResources.quoteId}`,
    skipIf: () => !createdResources.quoteId,
  },
  {
    name: 'delete-client',
    method: 'DELETE',
    description: 'Delete client',
    getPath: () => `/api/clients/${createdResources.clientId}`,
    skipIf: () => !createdResources.clientId,
  },
  {
    name: 'delete-vendor',
    method: 'DELETE',
    description: 'Delete vendor',
    getPath: () => `/api/vendors/${createdResources.vendorId}`,
    skipIf: () => !createdResources.vendorId,
  },
  {
    name: 'delete-income-category',
    method: 'DELETE',
    description: 'Delete income category',
    getPath: () => `/api/income-categories/${createdResources.incomeCategoryId}`,
    skipIf: () => !createdResources.incomeCategoryId,
  },
];

// Headers to include in all requests
const headers = {
  'Authorization': `Bearer ${apiToken}`,
  'Content-Type': 'application/json'
};

/**
 * Make an HTTP request to the given endpoint
 */
async function makeRequest(test) {
  // Determine the path - either static or from a function
  const path = test.getPath ? test.getPath() : test.path;
  const url = `${baseUrl}${path}`;
  
  const method = test.method;
  
  console.log(`Testing ${method} ${url}`);

  try {
    const options = {
      method,
      headers,
    };

    // Add body for POST/PUT requests
    if ((method === 'POST' || method === 'PUT') && test.body) {
      if (typeof test.body === 'function') {
        options.body = JSON.stringify(test.body());
      } else {
        options.body = JSON.stringify(test.body);
      }
    }

    const response = await fetch(url, options);

    const status = response.status;
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    const data = isJson ? await response.json() : await response.text();

    const result = {
      status,
      data,
      success: response.ok,
    };

    // Run post-processing if provided
    if (test.postProcess && typeof test.postProcess === 'function') {
      test.postProcess(result);
    }

    return result;
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

// Track test results
const testResults = [];

/**
 * Run the tests
 */
async function runTests() {
  console.log(`\n=== Testing API Endpoints with Token: ${apiToken.substring(0, 10)}... ===\n`);
  console.log(`Base URL: ${baseUrl}`);
  
  // Filter tests if a specific test was requested
  const testsToRun = targetTest 
    ? tests.filter(test => test.name === targetTest)
    : tests;
  
  if (targetTest && testsToRun.length === 0) {
    console.error(`Error: Test "${targetTest}" not found`);
    console.log('Available tests:');
    tests.forEach(test => console.log(`- ${test.name}: ${test.description}`));
    process.exit(1);
  }

  for (const test of testsToRun) {
    // Skip test if condition is met
    if (test.skipIf && test.skipIf()) {
      console.log(`\n--- Skipping: ${test.description} (${test.name}) ---`);
      testResults.push({
        name: test.name,
        description: test.description,
        status: 'SKIPPED',
        success: null
      });
      continue;
    }
    
    console.log(`\n--- Testing: ${test.description} (${test.name}) ---`);
    const result = await makeRequest(test);
    console.log(formatResponse(result));
    console.log('-----------------------------------');
    
    // Store the test result
    testResults.push({
      name: test.name,
      description: test.description,
      status: result.status,
      success: result.success
    });
  }

  // Display summary table
  displaySummaryTable();

  console.log('\n=== Tests Completed ===');
}

/**
 * Display a summary table of test results
 */
function displaySummaryTable() {
  console.log('\n=== Test Results Summary ===');
  
  // Calculate column widths
  const nameWidth = Math.max(20, ...testResults.map(r => r.name.length));
  const descWidth = Math.max(30, ...testResults.map(r => r.description.length));
  const statusWidth = 10;
  const resultWidth = 10;
  
  // Table header
  console.log('\n' + '='.repeat(nameWidth + descWidth + statusWidth + resultWidth + 10));
  console.log(
    '| ' + 'Test Name'.padEnd(nameWidth) + 
    ' | ' + 'Description'.padEnd(descWidth) + 
    ' | ' + 'Status'.padEnd(statusWidth) + 
    ' | ' + 'Result'.padEnd(resultWidth) + ' |'
  );
  console.log('|' + '-'.repeat(nameWidth + 2) + '|' + '-'.repeat(descWidth + 2) + '|' + '-'.repeat(statusWidth + 2) + '|' + '-'.repeat(resultWidth + 2) + '|');
  
  // Table rows
  testResults.forEach(result => {
    const successText = result.success === null ? 'N/A' : (result.success ? 'SUCCESS' : 'FAILED');
    const successColor = result.success === null ? '\x1b[33m' : (result.success ? '\x1b[32m' : '\x1b[31m');
    const resetColor = '\x1b[0m';
    
    console.log(
      '| ' + result.name.padEnd(nameWidth) + 
      ' | ' + result.description.padEnd(descWidth) + 
      ' | ' + ('' + result.status).padEnd(statusWidth) + 
      ' | ' + successColor + successText.padEnd(resultWidth) + resetColor + ' |'
    );
  });
  
  console.log('='.repeat(nameWidth + descWidth + statusWidth + resultWidth + 10));
  
  // Summary statistics
  const totalTests = testResults.length;
  const skippedTests = testResults.filter(r => r.status === 'SKIPPED').length;
  const successfulTests = testResults.filter(r => r.success === true).length;
  const failedTests = testResults.filter(r => r.success === false).length;
  
  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`Successful: ${successfulTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Skipped: ${skippedTests}`);
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
}); 