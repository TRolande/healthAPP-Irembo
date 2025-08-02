// Simple Logger Utility for IremboCare+
// Provides structured logging without external dependencies

const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logLevel = process.env.LOG_LEVEL || 'info';
    this.logFile = process.env.LOG_FILE || 'logs/app.log';
    this.ensureLogDirectory();
  }

  ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta
    };
    return JSON.stringify(logEntry);
  }

  writeLog(level, message, meta = {}) {
    const formattedMessage = this.formatMessage(level, message, meta);
    
    // Console output
    console.log(formattedMessage);
    
    // File output (async, non-blocking)
    try {
      fs.appendFile(this.logFile, formattedMessage + '\n', (err) => {
        if (err) {
          console.error('Failed to write to log file:', err);
        }
      });
    } catch (error) {
      console.error('Logger error:', error);
    }
  }

  info(message, meta = {}) {
    this.writeLog('info', message, meta);
  }

  error(message, meta = {}) {
    this.writeLog('error', message, meta);
  }

  warn(message, meta = {}) {
    this.writeLog('warn', message, meta);
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.writeLog('debug', message, meta);
    }
  }
}

module.exports = new Logger();