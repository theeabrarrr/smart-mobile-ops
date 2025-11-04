// User-friendly error messages
const ERROR_MESSAGES = {
  FETCH_FAILED: 'Unable to load data. Please try again.',
  CREATE_FAILED: 'Unable to save. Please try again.',
  UPDATE_FAILED: 'Unable to update. Please try again.',
  DELETE_FAILED: 'Unable to delete. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Please sign in to continue.',
  UNKNOWN_ERROR: 'Something went wrong. Please try again.'
};

export function sanitizeError(error: unknown, context?: string): string {
  // In development, log detailed errors with context
  if (import.meta.env.DEV) {
    console.error(`[Dev] ${context || 'Error'}:`, error);
  }
  
  // Return generic message to user
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (message.includes('network') || message.includes('fetch')) {
      return ERROR_MESSAGES.NETWORK_ERROR;
    }
    if (message.includes('unauthorized') || message.includes('auth')) {
      return ERROR_MESSAGES.UNAUTHORIZED;
    }
  }
  
  return ERROR_MESSAGES.UNKNOWN_ERROR;
}

export { ERROR_MESSAGES };
