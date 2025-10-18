const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

class FileService {
  constructor() {
    this.UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
    this.ALLOWED_FILE_TYPES = (process.env.ALLOWED_FILE_TYPES || 'pdf,jpg,jpeg,png').split(',');
    this.init();
  }

  // Initialize upload directory
  init() {
    try {
      if (!fs.existsSync(this.UPLOAD_DIR)) {
        fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
        console.log(`✅ Created upload directory: ${this.UPLOAD_DIR}`);
      }
      
      // Create necessary subdirectories
      const subDirs = ['temp', 'backups', 'logs'];
      subDirs.forEach(dir => {
        const dirPath = path.join(this.UPLOAD_DIR, dir);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      });
      
    } catch (error) {
      console.error('❌ Failed to initialize upload directory:', error);
    }
  }

  // Get user-specific directory
  getUserDir(userId) {
    if (!userId) throw new Error('User ID is required');
    return path.join(this.UPLOAD_DIR, 'users', userId.toString());
  }

  // Ensure user directory exists
  ensureUserDir(userId) {
    try {
      const userDir = this.getUserDir(userId);
      if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
        console.log(`✅ Created user directory: ${userDir}`);
      }
      return userDir;
    } catch (error) {
      console.error(`❌ Failed to create user directory for ${userId}:`, error);
      throw error;
    }
  }

  // Save file to user directory
  saveUserFile(userId, fileBuffer, filename, options = {}) {
    try {
      const userDir = this.ensureUserDir(userId);
      const filePath = path.join(userDir, filename);
      
      // Validate file size
      if (fileBuffer.length > this.MAX_FILE_SIZE) {
        throw new Error(`File size exceeds maximum allowed size of ${this.MAX_FILE_SIZE} bytes`);
      }
      
      // Validate file type
      const fileExt = path.extname(filename).toLowerCase().replace('.', '');
      if (!this.ALLOWED_FILE_TYPES.includes(fileExt)) {
        throw new Error(`File type ${fileExt} is not allowed. Allowed types: ${this.ALLOWED_FILE_TYPES.join(', ')}`);
      }
      
      // Write file
      fs.writeFileSync(filePath, fileBuffer);
      
      console.log(`✅ File saved: ${filePath} (${fileBuffer.length} bytes)`);
      
      return {
        success: true,
        filePath: filePath,
        fileSize: fileBuffer.length,
        filename: filename,
        userDir: userDir
      };
      
    } catch (error) {
      console.error(`❌ Failed to save file for user ${userId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Save application PDF
  saveApplicationPDF(userId, pdfBuffer, customFilename = null) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = customFilename || `application_${timestamp}.pdf`;
      
      return this.saveUserFile(userId, pdfBuffer, filename, {
        validateType: false // PDF is always allowed
      });
      
    } catch (error) {
      console.error(`❌ Failed to save application PDF for user ${userId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get user's files
  getUserFiles(userId, fileType = null) {
    try {
      const userDir = this.getUserDir(userId);
      
      if (!fs.existsSync(userDir)) {
        return [];
      }
      
      const files = fs.readdirSync(userDir)
        .map(filename => {
          const filePath = path.join(userDir, filename);
          const stats = fs.statSync(filePath);
          
          return {
            filename,
            filePath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime,
            type: path.extname(filename).toLowerCase().replace('.', '')
          };
        })
        .filter(file => !fileType || file.type === fileType)
        .sort((a, b) => new Date(b.created) - new Date(a.created));
      
      return files;
      
    } catch (error) {
      console.error(`❌ Failed to get files for user ${userId}:`, error);
      return [];
    }
  }

  // Delete user file
  deleteUserFile(userId, filename) {
    try {
      const userDir = this.getUserDir(userId);
      const filePath = path.join(userDir, filename);
      
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: 'File not found'
        };
      }
      
      fs.unlinkSync(filePath);
      console.log(`✅ File deleted: ${filePath}`);
      
      return {
        success: true,
        message: 'File deleted successfully'
      };
      
    } catch (error) {
      console.error(`❌ Failed to delete file ${filename} for user ${userId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Clean up user directory (remove all files)
  cleanupUserDir(userId) {
    try {
      const userDir = this.getUserDir(userId);
      
      if (!fs.existsSync(userDir)) {
        return {
          success: true,
          message: 'User directory does not exist'
        };
      }
      
      const files = fs.readdirSync(userDir);
      let deletedCount = 0;
      
      files.forEach(filename => {
        try {
          const filePath = path.join(userDir, filename);
          fs.unlinkSync(filePath);
          deletedCount++;
        } catch (error) {
          console.error(`❌ Failed to delete ${filename}:`, error);
        }
      });
      
      console.log(`✅ Cleaned up user directory: ${userDir} (${deletedCount} files deleted)`);
      
      return {
        success: true,
        deletedCount: deletedCount,
        message: `Deleted ${deletedCount} files`
      };
      
    } catch (error) {
      console.error(`❌ Failed to cleanup user directory for ${userId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get directory statistics
  getStats() {
    try {
      const getDirSize = (dirPath) => {
        let totalSize = 0;
        
        const calculateSize = (currentPath) => {
          const stats = fs.statSync(currentPath);
          if (stats.isDirectory()) {
            const files = fs.readdirSync(currentPath);
            files.forEach(file => {
              calculateSize(path.join(currentPath, file));
            });
          } else {
            totalSize += stats.size;
          }
        };
        
        if (fs.existsSync(dirPath)) {
          calculateSize(dirPath);
        }
        
        return totalSize;
      };
      
      const totalSize = getDirSize(this.UPLOAD_DIR);
      const userDirs = fs.existsSync(path.join(this.UPLOAD_DIR, 'users')) 
        ? fs.readdirSync(path.join(this.UPLOAD_DIR, 'users')).length 
        : 0;
      
      return {
        uploadDir: this.UPLOAD_DIR,
        totalSize: totalSize,
        totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
        userCount: userDirs,
        maxFileSize: this.MAX_FILE_SIZE,
        allowedTypes: this.ALLOWED_FILE_TYPES
      };
      
    } catch (error) {
      console.error('❌ Failed to get directory stats:', error);
      return {
        error: error.message
      };
    }
  }

  // Backup user files
  backupUserFiles(userId) {
    try {
      const userDir = this.getUserDir(userId);
      const backupDir = path.join(this.UPLOAD_DIR, 'backups', userId.toString());
      
      if (!fs.existsSync(userDir)) {
        return {
          success: false,
          error: 'User directory does not exist'
        };
      }
      
      // Ensure backup directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = path.join(backupDir, `backup_${timestamp}.zip`);
      
      // In a real implementation, you might want to use archiver to create a zip
      // For now, we'll just copy the directory
      this.copyDirSync(userDir, backupPath);
      
      console.log(`✅ User files backed up: ${backupPath}`);
      
      return {
        success: true,
        backupPath: backupPath,
        message: 'Backup created successfully'
      };
      
    } catch (error) {
      console.error(`❌ Failed to backup user files for ${userId}:`, error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Helper: Copy directory
  copyDirSync(src, dest) {
    // Simplified directory copy - in production use fs-extra or similar
    if (fs.statSync(src).isDirectory()) {
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }
      fs.readdirSync(src).forEach(item => {
        this.copyDirSync(path.join(src, item), path.join(dest, item));
      });
    } else {
      fs.copyFileSync(src, dest);
    }
  }
}

// Create singleton instance
const fileService = new FileService();

module.exports = fileService;