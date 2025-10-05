const Joi = require('joi');

// Schema for creating a client case
const create_client_case_schema = Joi.object({
  name: Joi.string().required(),
  age: Joi.number().optional().allow(null),
  case_number: Joi.string().required(),
  case_name: Joi.string().required(),
  case_type: Joi.string().required(),
  court_name: Joi.string().optional().allow(''),
  contact: Joi.string().length(10).optional().allow(null), // Corrected: Expecting a 10-digit string
  description: Joi.string().required(),
  documents: Joi.array().optional().allow(null),
});

// Schema for updating a client case
const update_client_case_schema = Joi.object({
  case_number: Joi.string().optional(),
  case_name: Joi.string().optional(),
  description: Joi.string().optional().allow(''),
  case_type: Joi.string().optional(),
  court_name: Joi.string().optional().allow(''),
  filing_date: Joi.date().optional(),
  client_name: Joi.string().optional(),
  contact: Joi.string().optional().allow(''), // Corrected: Assuming it can be an empty string
  client_address: Joi.string().optional().allow(''),
  documents: Joi.array().optional().allow(null),
  notes: Joi.string().optional().allow(''),
  opposing_party: Joi.string().optional().allow(''),
  court_address: Joi.string().optional().allow(''),
});

// Schema for creating an admin case
const create_admin_case_schema = Joi.object({
  case_number: Joi.string().required(),
  case_name: Joi.string().required(),
  description: Joi.string().optional().allow(''),
  case_type: Joi.string().required(),
  status: Joi.string().valid('Running', 'Closed', 'Pending').default('Running'),
  court_name: Joi.string().optional().allow(''),
  next_hearing_date: Joi.date().optional(),
  filing_date: Joi.date().required(),
  client_name: Joi.string().required(),
  client_contact: Joi.string().optional().allow(''),
  client_address: Joi.string().optional().allow(''),
  priority: Joi.string().valid('Low', 'Normal', 'High').default('Normal'),
  fees: Joi.number().optional().allow(null),
  payment_status: Joi.string().valid('Pending', 'Paid').default('Pending'),
  documents: Joi.array().optional().allow(null),
  notes: Joi.string().optional().allow(''),
  opposing_party: Joi.string().optional().allow(''),
  case_outcome: Joi.string().optional().allow(''),
  reminders: Joi.array().optional().allow(null),
  legal_category: Joi.string().optional().allow(''),
  court_address: Joi.string().optional().allow(''),
  documents_shared_with_client: Joi.array().optional().allow(null),
  client_id: Joi.number().required(),
});

// Schema for updating an admin case
const update_admin_case_schema = Joi.object({
  case_number: Joi.string().optional(),
  case_name: Joi.string().optional(),
  description: Joi.string().optional().allow(''),
  case_type: Joi.string().optional(),
  status: Joi.string().valid('Running', 'Closed', 'Pending'),
  court_name: Joi.string().optional().allow(''),
  next_hearing_date: Joi.date().optional(),
  filing_date: Joi.date().optional(),
  client_name: Joi.string().optional(),
  client_contact: Joi.string().optional().allow(''),
  client_address: Joi.string().optional().allow(''),
  priority: Joi.string().valid('Low', 'Normal', 'High').optional(),
  fees: Joi.number().optional().allow(null),
  payment_status: Joi.string().valid('Pending', 'Paid').optional(),
  documents: Joi.array().optional().allow(null),
  notes: Joi.string().optional().allow(''),
  opposing_party: Joi.string().optional().allow(''),
  case_outcome: Joi.string().optional().allow(''),
  reminders: Joi.array().optional().allow(null),
  legal_category: Joi.string().optional().allow(''),
  court_address: Joi.string().optional().allow(''),
  documents_shared_with_client: Joi.array().optional().allow(null),
});

module.exports = {
  create_client_case_schema,
  update_client_case_schema,
  create_admin_case_schema,
  update_admin_case_schema,
};
