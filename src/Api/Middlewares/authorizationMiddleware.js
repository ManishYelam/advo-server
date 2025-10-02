const os = require('os');
const { verifyToken } = require('../../Utils/jwtSecret');
const { User } = require('../Models/Association');
const useragent = require('useragent');

const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || req.connection.remoteAddress || req.ip;
  const user_agent = req.get('User-Agent') || 'unknown';
  const agent = useragent.parse(req.headers['user-agent']);

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }
    if (user.logged_in_status === false) {
      return res.status(401).json({
        error:
          'Oh, come on! 🤨 You’re not logged in, yet you’re trying to access this? Nice try, but no access for you! Go log in first. 🔑',
      });
    }

    // Extract public IPv4 address
    const getPublicIP = () => {
      const interfaces = os.networkInterfaces();
      for (const name of Object.keys(interfaces)) {
        for (const net of interfaces[name]) {
          if (!net.internal && net.family === 'IPv4') {
            return net.address;
          }
        }
      }
      return '127.0.0.1'; // Default fallback
    };

    const operating_system = {
      hostname: os.hostname(), // System name
      platform: os.platform(), // 'linux', 'darwin' (Mac), 'win32'
      os_type: os.type(), // 'Windows_NT', 'Linux', 'Darwin'
      os_version: os.release(), // OS version
      cpu_arch: os.arch(), // 'x64', 'arm', etc.
      total_memory: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB', // Convert to GB
      free_memory: (os.freemem() / (1024 * 1024 * 1024)).toFixed(2) + ' GB', // Convert to GB
      public_ip: getPublicIP(), // Extract public IP only
    };

    // Extract relevant agent details
    const device_info = {
      os: agent.os.family || 'unknown',
      browser: agent.family || 'unknown',
      device_type: agent.device.family || 'desktop',
    };

    req.user_info = decoded;
    req.token = token;
    req.ip = ip;
    req.operating_system = operating_system;
    req.auth_details = {
      user_agent: user_agent,
      device_info,
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token', error: error.message });
  }
};

module.exports = authMiddleware;
