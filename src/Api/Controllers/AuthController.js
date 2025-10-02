const AuthService = require('../Services/AuthServices');

module.exports = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
      const userAgent = req.get('User-Agent');
      const { token, user } = await AuthService.login(email, password, clientIp, userAgent);
      // res.status(200).json({ message: `🎉 Welcome back, ${user.first_name}! You have successfully logged in.`, token, user });
      res.status(200).json({ token, user });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  logout: async (req, res) => {
    const userId = req.user_info?.id;
    const token = req.token;
    const clientIp = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    const userAgent = req.get('User-Agent');
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    try {
      const response = await AuthService.logout(userId, token, clientIp, userAgent);
      req.token = null;
      req.user_info = null;
      req.session.destroy(err => {
        res.clearCookie('connect.sid');
        res.setHeader('Authorization', '');
        res.setHeader('Cache-Control', 'no-store');
        return res.status(200).json({ message: 'Logout successful', response });
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  forgetPassword: async (req, res) => {
    const { email } = req.params;
    try {
      const result = await AuthService.forgetPassword(email);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  },

  changePassword: async (req, res) => {
    const { old_password, new_password } = req.body;
    try {
      const result = await AuthService.changePassword(req.user_info.id, old_password, new_password);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  resetPassword: async (req, res) => {
    const { email } = req.params;
    const { otp, new_password } = req.body;
    try {
      const result = await AuthService.resetPassword(email, otp, new_password);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  upsertOrganization: async (req, res) => {
    try {
      const organization = await AuthService.upsertOrganization(req.body);

      res.status(organization.isNewRecord ? 201 : 200).json({
        message: organization.isNewRecord ? 'Organization created successfully' : 'Organization updated successfully',
        data: organization,
      });
    } catch (error) {
      console.error('Error managing organization record:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },

  getOrganization: async (req, res) => {
    try {
      const organization = await AuthService.getOrganization();

      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }

      res.status(200).json({ data: organization });
    } catch (error) {
      console.error('Error fetching organization:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  },
};
