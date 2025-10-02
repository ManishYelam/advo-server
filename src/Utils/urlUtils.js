const querystring = require('querystring');

// ==========================
// Encode and Decode Functions
// ==========================

// 1. Encode a single value (e.g., user input, string)
function encodeValue(value) {
  return encodeURIComponent(value);
}

// 2. Decode a single value
function decodeValue(value) {
  return decodeURIComponent(value);
}

// ==========================
// Encode and Decode Complex Objects (e.g., Query Params, Filters)
// ==========================

// 3. Encode complex objects to query parameters (Handles nested objects)
function encodeQueryParams(obj) {
  return querystring.stringify(obj);
}

// 4. Decode query parameters string into object
function decodeQueryParams(queryString) {
  return querystring.parse(queryString);
}

// ==========================
// Encode and Decode for Sequelize Queries (where clauses)
// ==========================

// 5. Encode Sequelize `where` clause object for safe transmission
function encodeSequelizeWhere(whereClause) {
  return encodeURIComponent(JSON.stringify(whereClause));
}

// 6. Decode Sequelize `where` clause from encoded string
function decodeSequelizeWhere(encodedWhere) {
  return JSON.parse(decodeURIComponent(encodedWhere));
}

// ==========================
// Encode and Decode JSON (for API calls or data storage)
// ==========================

// 7. Encode JSON data for safe transmission over URL
function encodeJsonForUrl(jsonData) {
  return encodeURIComponent(JSON.stringify(jsonData));
}

// 8. Decode JSON from URL safe string
function decodeJsonFromUrl(encodedJson) {
  return JSON.parse(decodeURIComponent(encodedJson));
}

// ==========================
// Encode and Decode Special URL-safe Strings (e.g., base64, hex)
// ==========================

// 9. Encode string to base64 (useful for data URIs or authorization headers)
function encodeBase64(value) {
  return Buffer.from(value).toString('base64');
}

// 10. Decode base64 encoded string
function decodeBase64(base64String) {
  return Buffer.from(base64String, 'base64').toString('utf-8');
}

// ==========================
// Utility for Safe Encoding (For Database or API integration)
// ==========================

// 11. Safe URL encoding to prevent XSS attacks
function safeEncodeURIComponent(value) {
  return encodeURIComponent(value)
    .replace(/%20/g, '+') // Optional: replacing space with plus sign
    .replace(/%23/g, '#') // Optional: replacing hash symbol
    .replace(/%2F/g, '/'); // Optional: customizing encoding
}

// ==========================
// Encode and Decode for Nested API Data (e.g., complex query params)
// ==========================

// 12. Encode deeply nested objects to URL-safe query string
function encodeDeepNestedParams(params) {
  return encodeURIComponent(JSON.stringify(params));
}

// 13. Decode deeply nested objects from URL-safe string
function decodeDeepNestedParams(encodedParams) {
  return JSON.parse(decodeURIComponent(encodedParams));
}

// ==========================
// URL-safe String Encoding for Usage in APIs and Queries
// ==========================

// 14. Create a URL-safe query string with sorting and filters (for API)
function encodeApiQuery(filters) {
  let encodedFilters = {};
  for (let key in filters) {
    if (filters.hasOwnProperty(key)) {
      encodedFilters[key] = encodeURIComponent(JSON.stringify(filters[key]));
    }
  }
  return querystring.stringify(encodedFilters);
}

// 15. Decode API query parameters with complex filters
function decodeApiQuery(queryString) {
  let decodedParams = querystring.parse(queryString);
  for (let key in decodedParams) {
    if (decodedParams.hasOwnProperty(key)) {
      decodedParams[key] = JSON.parse(decodeURIComponent(decodedParams[key]));
    }
  }
  return decodedParams;
}

// ==========================
// Utility for URL Manipulations (e.g., generating URLs)
// ==========================

// 16. Generate URL-safe query string with encoded parameters
function generateUrlWithQuery(baseUrl, params) {
  const queryString = encodeQueryParams(params);
  return `${baseUrl}?${queryString}`;
}

// 17. Generate URL from API endpoint with complex filters
function generateUrlWithFilters(endpoint, filters) {
  const encodedFilters = encodeApiQuery(filters);
  return `${endpoint}?${encodedFilters}`;
}

// ==========================
// Common Error Handling for Decoding
// ==========================

// 18. Safe decoding of URL or base64 strings with error handling
function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    console.error('Error decoding URL component:', error);
    return null;
  }
}

function safeDecodeBase64(base64String) {
  try {
    return Buffer.from(base64String, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Error decoding Base64 string:', error);
    return null;
  }
}

module.exports = {
  encodeValue,
  decodeValue,
  encodeQueryParams,
  decodeQueryParams,
  encodeSequelizeWhere,
  decodeSequelizeWhere,
  encodeJsonForUrl,
  decodeJsonFromUrl,
  encodeBase64,
  decodeBase64,
  safeEncodeURIComponent,
  encodeDeepNestedParams,
  decodeDeepNestedParams,
  encodeApiQuery,
  decodeApiQuery,
  generateUrlWithQuery,
  generateUrlWithFilters,
  safeDecodeURIComponent,
  safeDecodeBase64,
};
