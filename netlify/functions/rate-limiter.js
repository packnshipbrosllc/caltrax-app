// Simple in-memory rate limiter
const rateLimitMap = new Map();

const rateLimiter = (identifier, maxRequests = 10, windowMs = 60000) => {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  // Get existing requests for this identifier
  const requests = rateLimitMap.get(identifier) || [];
  
  // Filter out old requests outside the window
  const recentRequests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if limit exceeded
  if (recentRequests.length >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(identifier, recentRequests);
  
  return true; // Request allowed
};

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  const oneHourAgo = now - 3600000; // 1 hour
  
  for (const [key, requests] of rateLimitMap.entries()) {
    const recentRequests = requests.filter(timestamp => timestamp > oneHourAgo);
    if (recentRequests.length === 0) {
      rateLimitMap.delete(key);
    } else {
      rateLimitMap.set(key, recentRequests);
    }
  }
}, 300000); // Clean up every 5 minutes

module.exports = { rateLimiter };



