const locks = {
  edit: new Map(),
  update: new Map(),
};
module.exports = {
  locks, // Exported for testing or monitoring purposes
};

module.exports = {
  logEvent: async (eventType, resourceId, userId = null) => {
    console.log(`[${new Date().toISOString()}] Event: ${eventType}, Resource: ${resourceId}, User: ${userId}`);
  },

  // Utility function to set lock with a timeout
  setLockWithTimeout: async (lockMap, resourceId, userId, duration) => {
    lockMap.set(resourceId, userId);
    setTimeout(() => {
      if (lockMap.get(resourceId) === userId) {
        lockMap.delete(resourceId);
        logEvent('lockTimeout', resourceId, userId);
      }
    }, duration);
  },

  // Lock and unlock functions for editing
  editLockOn: async (resourceId, userId, timeout = 60000) => {
    // Default timeout: 1 minute
    if (locks.edit.has(resourceId)) {
      if (locks.edit.get(resourceId) !== userId) {
        throw new Error(`Resource ${resourceId} is already locked by another user.`);
      }
    } else {
      setLockWithTimeout(locks.edit, resourceId, userId, timeout);
      logEvent('editLockOn', resourceId, userId);
    }
  },

  editLockOff: async (resourceId, userId) => {
    if (locks.edit.get(resourceId) === userId) {
      locks.edit.delete(resourceId);
      logEvent('editLockOff', resourceId, userId);
    } else {
      throw new Error(`Resource ${resourceId} cannot be unlocked by user ${userId}.`);
    }
  },

  // Lock and unlock functions for updating
  updateLockOn: async (resourceId, userId, timeout = 60000) => {
    // Default timeout: 1 minute
    if (locks.update.has(resourceId)) {
      if (locks.update.get(resourceId) !== userId) {
        throw new Error(`Resource ${resourceId} is already locked by another user.`);
      }
    } else {
      setLockWithTimeout(locks.update, resourceId, userId, timeout);
      logEvent('updateLockOn', resourceId, userId);
    }
  },

  updateLockOff: async (resourceId, userId) => {
    if (locks.update.get(resourceId) === userId) {
      locks.update.delete(resourceId);
      logEvent('updateLockOff', resourceId, userId);
    } else {
      throw new Error(`Resource ${resourceId} cannot be unlocked by user ${userId}.`);
    }
  },

  // Retry mechanism with exponential backoff for acquiring locks
  retryLock: async (lockFunction, resourceId, userId, maxRetries = 5, baseDelay = 100) => {
    let attempts = 0;
    let delay = baseDelay;

    while (attempts < maxRetries) {
      try {
        lockFunction(resourceId, userId);
        return; // Successfully acquired lock
      } catch (error) {
        attempts += 1;
        if (attempts === maxRetries) {
          throw new Error(`Failed to acquire lock on ${resourceId} after ${maxRetries} retries.`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      }
    }
  },

  // Helper functions to check if a lock is active
  isEditLocked: resourceId => locks.edit.has(resourceId),
  isUpdateLocked: resourceId => locks.update.has(resourceId),
};
