import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'development_secret_key_for_jwt_tokens_society_management_portal';
const JWT_EXPIRES_IN = '1d'; // Token expires in 24 hours

export interface TokenPayload {
  userId: string;
  email: string;
  roleId: string;
  roleName: string;
  societyId: string;
  permissions: string[];
}

export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
