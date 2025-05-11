#!/bin/bash

# ---------------------------------------------------------
# API Testing Script with cURL
# ---------------------------------------------------------
# This script tests API endpoints using an API token for authentication
# 
# Usage:
#   ./scripts/curl-api-tests.sh <api-token> [base-url]
#
# Example:
#   ./scripts/curl-api-tests.sh skt_d16270bb_7a6a8923f84205663183a7144f65cc62 http://localhost:3000
# ---------------------------------------------------------

# Check if an API token was provided
if [ -z "$1" ]; then
  echo "Error: API token is required"
  echo "Usage: ./scripts/curl-api-tests.sh <api-token> [base-url]"
  exit 1
fi

API_TOKEN="$1"
BASE_URL="${2:-http://localhost:3000}"

# Text formatting
GREEN='\033[0;32m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Store created resource IDs
CLIENT_ID=""
INVOICE_ID=""
QUOTE_ID=""

# Function to test an endpoint
test_endpoint() {
  local method="$1"
  local endpoint="$2"
  local description="$3"
  local data="$4"

  echo -e "\n${CYAN}Testing: ${description}${NC}"
  echo "Endpoint: ${method} ${endpoint}"
  
  # Build the curl command
  CURL_CMD="curl -s -X ${method} \"${BASE_URL}${endpoint}\""
  CURL_CMD="${CURL_CMD} -H \"Authorization: Bearer ${API_TOKEN}\""
  CURL_CMD="${CURL_CMD} -H \"Content-Type: application/json\""
  
  # Add data for POST/PUT requests
  if [ -n "$data" ] && ([ "$method" = "POST" ] || [ "$method" = "PUT" ]); then
    CURL_CMD="${CURL_CMD} -d '${data}'"
  fi
  
  # Run the command and capture output
  echo "Command: ${CURL_CMD}"
  
  # Execute the command
  RESPONSE=$(eval ${CURL_CMD})
  
  # Check if the response is valid JSON
  if echo "$RESPONSE" | jq . >/dev/null 2>&1; then
    # Format and display JSON response
    echo -e "${GREEN}Response (JSON):${NC}"
    echo "$RESPONSE" | jq .
    
    # Extract resource ID if this is a creation operation
    if [ "$method" = "POST" ]; then
      if [[ $endpoint == *"/clients" ]]; then
        CLIENT_ID=$(echo "$RESPONSE" | jq -r '.id')
        echo -e "${GREEN}Created client with ID: ${CLIENT_ID}${NC}"
      elif [[ $endpoint == *"/invoices" ]]; then
        INVOICE_ID=$(echo "$RESPONSE" | jq -r '.id')
        echo -e "${GREEN}Created invoice with ID: ${INVOICE_ID}${NC}"
      elif [[ $endpoint == *"/quotes" ]]; then
        QUOTE_ID=$(echo "$RESPONSE" | jq -r '.id')
        echo -e "${GREEN}Created quote with ID: ${QUOTE_ID}${NC}"
      fi
    fi
  else
    # Display plain text response
    echo -e "${RED}Response (not JSON):${NC}"
    echo "$RESPONSE"
  fi
  
  echo "---------------------------------------------------------"
}

# Main test execution
echo -e "${CYAN}===== Testing API Endpoints with Token: ${API_TOKEN:0:10}... =====${NC}"
echo "Base URL: ${BASE_URL}"

# Test GET endpoints (listing resources)
test_endpoint "GET" "/api/clients" "List all clients"
test_endpoint "GET" "/api/vendors" "List all vendors"
test_endpoint "GET" "/api/income-categories" "List all income categories"
test_endpoint "GET" "/api/invoices" "List all invoices"
test_endpoint "GET" "/api/quotes" "List all quotes"

# Create a client
CLIENT_DATA='{
  "name": "Test Client (cURL)",
  "email": "curl-test-client-'$(date +%s)'@example.com",
  "phone": "123-456-7890",
  "paymentTerms": 15
}'
test_endpoint "POST" "/api/clients" "Create a new client" "$CLIENT_DATA"

# Create an invoice if we have a client ID
if [ -n "$CLIENT_ID" ]; then
  TIMESTAMP=$(date +%s)
  INVOICE_DATA='{
    "clientId": '${CLIENT_ID}',
    "invoiceNumber": "INV-CURL-'${TIMESTAMP}'",
    "status": "draft",
    "issueDate": "'$(date +%Y-%m-%d)'",
    "dueDate": "'$(date -v+15d +%Y-%m-%d 2>/dev/null || date -d "+15 days" +%Y-%m-%d)'",
    "taxRate": 10,
    "notes": "Test invoice created via cURL",
    "items": [
      {
        "description": "Test Service 1",
        "quantity": 1,
        "unitPrice": "100.00"
      },
      {
        "description": "Test Service 2",
        "quantity": 2,
        "unitPrice": "50.00"
      }
    ]
  }'
  test_endpoint "POST" "/api/invoices" "Create a new invoice" "$INVOICE_DATA"
  
  # Get invoice details if created
  if [ -n "$INVOICE_ID" ]; then
    test_endpoint "GET" "/api/invoices/${INVOICE_ID}" "Get invoice details"
  fi
  
  # Create a quote using the same client
  QUOTE_DATA='{
    "clientId": '${CLIENT_ID}',
    "quoteNumber": "QT-CURL-'${TIMESTAMP}'",
    "status": "draft",
    "issueDate": "'$(date +%Y-%m-%d)'",
    "expiryDate": "'$(date -v+30d +%Y-%m-%d 2>/dev/null || date -d "+30 days" +%Y-%m-%d)'",
    "taxRate": 10,
    "notes": "Test quote created via cURL",
    "items": [
      {
        "description": "Test Product 1",
        "quantity": 1,
        "unitPrice": "200.00"
      },
      {
        "description": "Test Product 2",
        "quantity": 3,
        "unitPrice": "75.00"
      }
    ]
  }'
  test_endpoint "POST" "/api/quotes" "Create a new quote" "$QUOTE_DATA"
  
  # Get quote details if created
  if [ -n "$QUOTE_ID" ]; then
    test_endpoint "GET" "/api/quotes/${QUOTE_ID}" "Get quote details"
  fi
fi

# Create a vendor
VENDOR_DATA='{
  "name": "Test Vendor (cURL)",
  "email": "curl-test-vendor-'$(date +%s)'@example.com",
  "phone": "123-456-7890"
}'
test_endpoint "POST" "/api/vendors" "Create a new vendor" "$VENDOR_DATA"

# Create an income category
CATEGORY_DATA='{
  "name": "Test Category (cURL) '$(date +%s)'"
}'
test_endpoint "POST" "/api/income-categories" "Create a new income category" "$CATEGORY_DATA"

# Cleanup - delete resources if created
if [ -n "$QUOTE_ID" ]; then
  test_endpoint "DELETE" "/api/quotes/${QUOTE_ID}" "Delete the test quote"
fi

if [ -n "$INVOICE_ID" ]; then
  test_endpoint "DELETE" "/api/invoices/${INVOICE_ID}" "Delete the test invoice"
fi

echo -e "\n${CYAN}===== Test Execution Completed =====${NC}" 