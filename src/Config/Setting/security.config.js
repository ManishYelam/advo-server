const helmet = require('helmet');

// Define Content Security Policy (CSP) as an example
const cspPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", 'https://trustedscripts.example.com'],
    styleSrc: ["'self'", 'https://trustedstyles.example.com'],
    imgSrc: ["'self'", 'data:', 'https://trustedimages.example.com'],
    connectSrc: ["'self'", 'https://trustedapi.example.com'],
    fontSrc: ["'self'", 'https://trustedfonts.example.com'],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    upgradeInsecureRequests: [],
  },
};

// Apply security configurations with Helmet
const securityConfig = helmet({
  contentSecurityPolicy: { directives: cspPolicy.directives },
  frameguard: { action: 'deny' }, // Prevent clickjacking
  noCache: true, // Disable caching
  referrerPolicy: { policy: 'no-referrer' }, // Prevent sending the referrer header
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  xssFilter: true, // Prevent XSS attacks
  hidePoweredBy: true, // Hide the X-Powered-By header
  dnsPrefetchControl: { allow: false }, // Prevent DNS prefetching
  permittedCrossDomainPolicies: { policy: 'none' }, // Prevent Flash from loading
});

// Log the security configuration
console.log('✅ Security configuration applied with Helmet.');

module.exports = securityConfig;
