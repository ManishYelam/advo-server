const { generateUniqueIDForHealth } = require('../../Utils/generateUniqueID');
const { welcomeTemplate } = require('../EmailTemplets/Templates');
const userService = require('../Services/UserService');

module.exports = {
  createUser: async (req, res) => {
    try {
      const newUser = await userService.createUser(req.body);
      res.status(201).json({ success: true, message: 'User created successfully', user: newUser });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  verifyCreateUser: async (req, res) => {
    try {
      const { userId, otp } = req.query;
      const newUser = await userService.verifyCreateUser(userId, otp);
      res.status(200).json({ message: 'Account verified successfully!', user: newUser });
    } catch (error) {
      res.status(500).json({ message: 'Verification failed: ' + error.message });
    }
  },

  getAllUsersV2: async (req, res) => {
    try {
      const { page, limit, search, searchFields, ...filters } = req.body;
      const users = await userService.getAllUsersV2({ page, limit, search, searchFields, ...filters });
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await userService.getAllUsers();
      res.status(200).json(users);
      // res.status(200).json({ message: 'Fetch all users successfully', user: users });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  getUserById: async (req, res) => {
    try {
      const user = await userService.getUserById(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'User found successfully', user: user });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  updateUser: async (req, res) => {
    try {
      const updatedUser = await userService.updateUser(req.params.id, req.body);
      if (updatedUser[0] === 0) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'User updated successfully', user: req.body });
    } catch (error) {
      res.status(500).json({ message: error });
    }
  },

  deleteUser: async (req, res) => {
    try {
      const deleted = await userService.deleteUser(req.params.id);
      if (!deleted) return res.status(404).json({ message: 'User not found' });
      res.status(200).json({ message: 'User deleted successfully', user: req.params.id });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  deleteUserRanges: async (req, res) => {
    try {
      const { start_id, end_id } = req.params;
      const start = parseInt(start_id, 10);
      const end = parseInt(end_id, 10);
      if (isNaN(start) || isNaN(end) || start > end) {
        return res.status(400).json({ error: 'Invalid ID range' });
      }
      const deletedCount = await userService.deleteUserRanges(start, end);
      return res.status(200).json({ message: `${deletedCount} users deleted successfully.` });
    } catch (error) {
      console.error('Error deleting users:', error);
      return res.status(500).json({ error: 'An error occurred while deleting users' });
    }
  },

  saveApplication: async (req, res) => {
    try {
      const data = req.body;

      const formatDate = (dateValue) => {
        if (!dateValue) return null;
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? null : date.toISOString();
      };

      const parseNumber = (value) => (value ? parseFloat(value) : 0);

      const user_data = {
        full_name: data.full_name,
        dob: formatDate(data.dob),
        age: data.age ? parseInt(data.age, 10) : "",
        phone_number: data.phone_number,
        email: data.email,
        gender: data.gender,
        occupation: data.occupation,
        adhar_number: data.adhar_number,
        address: data.address,
        notes: data.notes,
      };

      const case_data = {
        saving_account_start_date: formatDate(data.saving_account_start_date),
        deposit_type: data.deposit_type,
        deposit_duration_years: parseNumber(data.deposit_duration_years),
        fixed_deposit_total_amount: parseNumber(data.fixed_deposit_total_amount),
        interest_rate_fd: parseNumber(data.interest_rate_fd),
        saving_account_total_amount: parseNumber(data.saving_account_total_amount),
        interest_rate_saving: parseNumber(data.interest_rate_saving),
        recurring_deposit_total_amount: parseNumber(data.recurring_deposit_total_amount),
        interest_rate_recurring: parseNumber(data.interest_rate_recurring),
        dnyanrudha_investment_total_amount: parseNumber(data.dnyanrudha_investment_total_amount),
        dynadhara_rate: parseNumber(data.dynadhara_rate),
      };

      const payment_data = {
        method: data.method,
        payment_id: data.payment_id,
        amount: parseNumber(data.amount),
        amount_due: parseNumber(data.amount_due),
        amount_paid: parseNumber(data.amount_paid),
        attempts: data.attempts || 0,
        created_at: formatDate(data.created_at),
        currency: data.currency,
        entity: data.entity,
        order_id: data.order_id,
        notes: data.notes,
        offer_id: data.offer_id,
        receipt: data.receipt,
        status: data.status,
      };

      const saved = await userService.saveApplication(user_data, case_data, payment_data);

      // Optionally send registration email
      // if (saved.success) {
      //   const reg_link = `http://localhost:5173/applicant/${saved.user.id}`;
      //   await welcomeTemplate(saved.user.id, user_data.full_name, user_data.email, reg_link);
      // }

      return res.status(200).json({ message: "✅ Application saved successfully!", data: saved });
    } catch (error) {
      console.error("❌ Error saving application:", error);
      return res.status(500).json({ error: "An error occurred while saving application" });
    }
  }


}