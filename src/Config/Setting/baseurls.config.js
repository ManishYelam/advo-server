require('dotenv').config();

const envPrefix = process.env.NODE_ENV === 'production' ? 'P_' : 'L_';

const services = [
  'MAIN_SERVER',
  'PHARMACY',
  'LOGISTICS',
  'CUSTOMER_SUPPORT',
  'SALES_MARKETING',
  'FINANCE_ACCOUNTING',
  'COMPLIANCE_LEGAL',
  'HEALTHCARE',
  'IT_DEVELOPMENT',
  'INVENTORY_MANAGEMENT',
  'DATA_ANALYTICS',
  'HR',
  'PARTNERSHIPS',
];

const baseUrls = Object.fromEntries(services.map(service => [`${service}_URL`, process.env[`${envPrefix}${service}_URL`]]));

module.exports = baseUrls;
