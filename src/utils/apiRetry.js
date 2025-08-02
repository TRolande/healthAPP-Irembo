// API Retry Utility for IremboCare+
// Provides retry logic for external API calls

const fetch = require('node-fetch');
const logger = require('./logger');

class APIRetryHandler {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000; // 1 second
    this.maxDelay = options.maxDelay || 10000; // 10 seconds
    this.backoffFactor = options.backoffFactor || 2;
  }

  // Calculate delay with exponential backoff
  calculateDelay(attempt) {
    const delay = Math.min(
      this.baseDelay * Math.pow(this.backoffFactor, attempt),
      this.maxDelay
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  // Sleep function
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if error is retryable
  isRetryableError(error) {
    if (!error) return false;
    
    // Network errors
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' || error.code === 'ECONNRESET') {
      return true;
    }

    // HTTP status codes that are retryable
    if (error.response && error.response.status) {
      const status = error.response.status;
      return status === 429 || status === 502 || status === 503 || status === 504;
    }

    // Timeout errors
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return true;
    }

    return false;
  }

  // Main retry function
  async retry(apiCall, options = {}) {
    const maxRetries = options.maxRetries || this.maxRetries;
    const context = options.context || 'API Call';
    
    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        logger.debug(`${context} - Attempt ${attempt + 1}/${maxRetries + 1}`);
        
        const result = await apiCall();
        
        if (attempt > 0) {
          logger.info(`${context} - Succeeded after ${attempt + 1} attempts`);
        }
        
        return result;
      } catch (error) {
        lastError = error;
        
        logger.warn(`${context} - Attempt ${attempt + 1} failed`, {
          error: error.message,
          code: error.code,
          status: error.response?.status
        });

        // If this is the last attempt or error is not retryable, throw
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          break;
        }

        // Wait before retrying
        const delay = this.calculateDelay(attempt);
        logger.debug(`${context} - Waiting ${delay}ms before retry`);
        await this.sleep(delay);
      }
    }

    logger.error(`${context} - All retry attempts failed`, {
      attempts: maxRetries + 1,
      finalError: lastError.message
    });

    throw lastError;
  }

  // Wrapper for fetch calls
  async fetchWithRetry(url, options = {}, retryOptions = {}) {
    const context = `Fetch ${url}`;
    
    return this.retry(async () => {
      const controller = new AbortController();
      const timeout = options.timeout || 30000;
      
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
          error.response = response;
          throw error;
        }
        
        return response;
      } catch (error) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          const timeoutError = new Error('Request timeout');
          timeoutError.name = 'TimeoutError';
          throw timeoutError;
        }
        
        throw error;
      }
    }, { ...retryOptions, context });
  }

  // Wrapper for axios calls (if using axios)
  async axiosWithRetry(axiosCall, retryOptions = {}) {
    const context = retryOptions.context || 'Axios Call';
    
    return this.retry(async () => {
      try {
        return await axiosCall();
      } catch (error) {
        // Transform axios error for consistency
        if (error.response) {
          error.response = {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          };
        }
        throw error;
      }
    }, { ...retryOptions, context });
  }
}

// Create default instance
const defaultRetryHandler = new APIRetryHandler();

// Export both class and default instance
module.exports = {
  APIRetryHandler,
  retry: defaultRetryHandler.retry.bind(defaultRetryHandler),
  fetchWithRetry: defaultRetryHandler.fetchWithRetry.bind(defaultRetryHandler),
  axiosWithRetry: defaultRetryHandler.axiosWithRetry.bind(defaultRetryHandler)
};