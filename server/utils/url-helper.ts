/**
 * URL Helper - Detects the correct base URL for the application
 * Works in both development and production environments
 */

/**
 * Get the base URL for the application
 * In production: Uses Replit's deployment URL
 * In development: Uses localhost with the current port
 */
export function getBaseUrl(): string {
  const isProduction = process.env.NODE_ENV === "production" || 
                       process.env.NODE_ENV === "prod" || 
                       process.env.DEPLOYMENT_TARGET === "vm";

  if (isProduction) {
    // In production deployments, construct URL from Replit environment variables
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      return `https://${process.env.REPL_SLUG}-${process.env.REPL_OWNER}.replit.app`;
    }
    
    // Fallback to custom domain if REPLIT_DEPLOYMENT_URL is set
    if (process.env.REPLIT_DEPLOYMENT_URL) {
      return process.env.REPLIT_DEPLOYMENT_URL;
    }
    
    // Final fallback for other production environments
    if (process.env.BASE_URL) {
      return process.env.BASE_URL;
    }
    
    // If nothing else works, construct from hostname
    const port = process.env.PORT || '5000';
    return `https://${process.env.HOSTNAME || 'localhost'}:${port}`;
  }

  // Development environment
  const port = process.env.PORT || '5000';
  return `http://localhost:${port}`;
}

/**
 * Get the callback URL for OAuth providers
 * @param provider - The OAuth provider name (e.g., 'google')
 */
export function getOAuthCallbackUrl(provider: string): string {
  const baseUrl = getBaseUrl();
  return `${baseUrl}/api/auth/${provider}/callback`;
}

/**
 * Check if the current environment is production
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || 
         process.env.NODE_ENV === "prod" || 
         process.env.DEPLOYMENT_TARGET === "vm";
}
