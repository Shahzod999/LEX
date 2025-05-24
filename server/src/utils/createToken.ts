import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv"

dotenv.config()

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined in .env");
}

const JWT_SECRET = process.env.JWT_SECRET;

interface TokenPayload {
  userId: string;
  role?: string;
}

export const generateToken = (
  payload: TokenPayload,
  expiresIn: "20d"
): string => {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
};
