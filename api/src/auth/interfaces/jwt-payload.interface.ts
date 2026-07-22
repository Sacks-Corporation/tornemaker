export interface JwtPayload {
  /** Our internal user/admin id (MongoDB ObjectId as string) */
  sub: string;
  email: string;
  /**
   * Present (and set to `'admin'`) only for backoffice admin tokens, so they
   * can be told apart from regular user tokens. Absent on user JWTs.
   */
  role?: 'admin';
}
