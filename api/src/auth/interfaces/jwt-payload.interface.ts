export interface JwtPayload {
  /** Our internal user id (MongoDB ObjectId as string) */
  sub: string;
  email: string;
}
