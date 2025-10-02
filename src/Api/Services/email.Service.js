const sendMail = require('../../Config/Setting/nodemailer.config');
const {
  registrationTemplate,
  passwordChangeTemplate,
  performanceTrackingTemplate,
  systemLogsTemplate,
  notificationTemplate,
} = require('../EmailTemplets/Templates');
const { User } = require('../Models/Association');

module.exports = {
  // ✅
  sendLaunchCodeEmail: async (userId, userName, userEmail, verificationUrl, otp, password) => {
    const user_Email = userEmail;
    const subject = '🚀 Your Exclusive Service Launch Code is Here!';
    const template_Name = 'LaunchCodeTemplate';
    const template_Data = {
      userId: userId,
      userName: userName,
      launchCode: otp,
      verificationUrl: verificationUrl,
      password: password,
    };
    sendMail(user_Email, subject, template_Name, template_Data);
  },
  // ✅
  sendVerificationEmail: async (userName, userEmail, password) => {
    const user_Email = userEmail;
    const subject = '✅ Email Verified Successfully – Welcome Aboard!';
    const template_Name = 'verificationTemplate';
    const template_Data = {
      userEmail: userEmail,
      userName: userName,
      password: password,
    };
    sendMail(user_Email, subject, template_Name, template_Data);
  },
  // ✅
  sendPasswordChangeEmail: async (userId, userEmail, userName) => {
    const user_Email = userEmail;
    const subject = '🔒 Password Update Confirmation – Your Account is Secure';
    const template_Name = 'passwordChangeTemplate';
    const template_Data = {
      userId: userId,
      userName: userName,
    };
    sendMail(user_Email, subject, template_Name, template_Data);
  },

  sendResetPasswordCodeEmail: async (userId, userName, userEmail, resetLink, resetPasswordLink, otp) => {
    const user_Email = userEmail;
    const subject = '🔑 Password Reset Request – Secure Your Account';
    const template_Name = 'sendResetPasswordTemplate';
    const template_Data = {
      userId,
      userName,
      otp,
      resetLink,
      resetPasswordLink,
    };
    sendMail(user_Email, subject, template_Name, template_Data);
  },

  sendRegistrationEmail: async userId => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');
    const subject = 'Welcome to [Your App Name] - Verify Your Email';
    const html = registrationTemplate(user.name, 'http:/localhost:5000/verify?token=abc123');
    sendMail(user.email, subject, html);
  },

  sendOtpEmail: async (userId, userName, userEmail, otp) => {
    const user_Email = userEmail;
    const subject = 'Your OTP Code';
    const template_Name = 'otpTemplate';
    const template_Data = { userId: userId, userName: userName };
    sendMail(user_Email, subject, template_Name, template_Data);
  },
  sendPasswordChangeConfirmation: async (userName, userEmail) => {
    const emailContent = await passwordChangeTemplate(userName);
    sendEmail(userEmail, 'Password Change Confirmation', emailContent);
  },

  // Send performance tracking email
  sendPerformanceTrackingEmail: async (userId, data) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    const subject = 'Performance Tracking Report';
    const html = performanceTrackingTemplate(data);
    sendMail(user.email, subject, html);
  },
  // Send system logs email
  sendSystemLogsEmail: async (userId, logData) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    const subject = 'System Logs Report';
    const html = systemLogsTemplate(logData);
    sendMail(user.email, subject, html);
  },
  // Send generic notification email
  sendNotificationEmail: async (userId, title, content) => {
    const user = await User.findByPk(userId);
    if (!user) throw new Error('User not found');

    const subject = title;
    const html = notificationTemplate(title, content);
    sendMail(user.email, subject, html);
  },

  uploadDocument: async (file, userId, uploadPath = 'uploads') => {
    const allowedFileTypes = ['pdf', 'docx', 'zip'];
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);

    if (!allowedFileTypes.includes(fileExtension)) {
      throw new Error('Invalid file type. Only PDF, DOCX, and ZIP files are allowed.');
    }

    const fileName = `${userId}_${Date.now()}_${file.originalname}`;
    const fullPath = path.join(uploadPath, fileName);

    fs.writeFileSync(fullPath, file.buffer);

    const userEmail = user.email;
    const uploadLink = `${process.env.BASE_URL}/uploads/${fileName}`;
    const emailContent = `
    Hi there, your document has been successfully uploaded. 
    You can access it here: <a href="${uploadLink}">${uploadLink}</a>.
  `;
    sendMail(userEmail, 'Document Uploaded Successfully', emailContent);

    return { fileName, uploadLink };
  },
};
