const User = require('./User');
const Organization = require('./Organization');
const ApplicationProperties = require('./Application.Prop');
const ListOfValues = require('./List.Of.values');
const Cases = require('./Cases');
const Contact = require('./Contacts');
const Payment = require('./Payment');
const UserDocument = require('./UserDocument');

// One client can have many cases
User.hasMany(Cases, { foreignKey: 'clientId', as: 'cases' });
Cases.belongsTo(User, { foreignKey: 'clientId', as: 'client' });

// Optionally, if you want an advocate to be assigned (for multi-advocate scenario)
User.hasMany(Cases, { foreignKey: 'advocateId', as: 'assignedCases' });
Cases.belongsTo(User, { foreignKey: 'advocateId', as: 'advocate' });

Cases.hasMany(Payment, { foreignKey: "case_id", as: "payments" });
Payment.belongsTo(Cases, { foreignKey: "client_id", as: "case" });

// User has many Documents
User.hasMany(UserDocument, {
  foreignKey: 'user_id',
  as: 'userDocuments' // Changed from 'documents'
});

UserDocument.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// Case has many Documents
Cases.hasMany(UserDocument, {
  foreignKey: 'case_id',
  as: 'caseDocuments' // Changed from 'documents'
});

UserDocument.belongsTo(Cases, {
  foreignKey: 'case_id',
  as: 'case'
});


module.exports = {
  User,
  Organization,
  ApplicationProperties,
  ListOfValues,
  Cases,
  Contact,
  Payment,
  UserDocument
};




