import { logger } from "./logger.js";

/**
 * Retry utility with exponential backoff
 * @param fn Function to retry
 * @param retries Number of retries (default: 3)
 * @param delay Initial delay in ms (default: 1000)
 * @param exponentialFactor Factor for exponential backoff (default: 2)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000,
  exponentialFactor: number = 2
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // If this was the last attempt, throw the error
      if (i === retries) {
        logger.error("Retry failed after all attempts", { error: lastError.message, retries });
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const currentDelay = delay * Math.pow(exponentialFactor, i);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.5 * currentDelay;
      const totalDelay = currentDelay + jitter;
      
      logger.warn(`Attempt ${i + 1} failed. Retrying in ${totalDelay}ms...`, { 
        error: lastError.message,
        attempt: i + 1,
        delay: totalDelay
      });
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }
  
  // This should never be reached, but TypeScript requires it
  throw lastError!;
}

/**
 * Circuit breaker pattern implementation
 */
export class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private failureThreshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state === 'OPEN') {
      // Check if timeout has passed
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
        logger.info("Circuit breaker half-open", { timeout: this.timeout });
      } else {
        const error = new Error('Circuit breaker is OPEN');
        logger.error("Circuit breaker open - rejecting call", { error: error.message });
        throw error;
      }
    }

    try {
      const result = await fn();
      
      // Success - reset failure count and close circuit
      this.failureCount = 0;
      this.state = 'CLOSED';
      logger.debug("Circuit breaker closed - successful call");
      
      return result;
    } catch (error) {
      // Failure - increment failure count
      this.failureCount++;
      this.lastFailureTime = Date.now();
      
      logger.error("Circuit breaker call failed", { error: (error as Error).message, failureCount: this.failureCount });
      
      // Check if we should open the circuit
      if (this.failureCount >= this.failureThreshold) {
        this.state = 'OPEN';
        logger.warn("Circuit breaker opened", { failureCount: this.failureCount, threshold: this.failureThreshold });
      }
      
      throw error;
    }
  }

  getState(): string {
    return this.state;
  }
}