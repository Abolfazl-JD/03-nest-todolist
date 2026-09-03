export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const errors: string[] = [];

  const jwtSecret = config.JWT_SECRET;
  if (typeof jwtSecret !== 'string' || jwtSecret.trim().length < 16) {
    errors.push('JWT_SECRET must be set and at least 16 characters long');
  }

  const expiresIn = config.JWT_EXPIRES_IN;
  if (expiresIn !== undefined && typeof expiresIn !== 'string') {
    errors.push('JWT_EXPIRES_IN must be a string such as "1d" or "3600s"');
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n  - ${errors.join('\n  - ')}`,
    );
  }

  return config;
}
