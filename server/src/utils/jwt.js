import jwt from "jsonwebtoken";

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// Read lazily so dotenv has loaded; never fall back to a hardcoded secret.
const getSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return secret;
};

export const jwtToken = {
  sign: (payload) => {
    try {
      return jwt.sign(payload, getSecret(), { expiresIn: JWT_EXPIRES_IN });
    } catch (error) {
      throw new Error("Failed to sign token");
    }
  },
  verify: (token) => {
    try {
      return jwt.verify(token, getSecret());
    } catch (error) {
      throw new Error("Failed to verify token");
    }
  },
  decode: (token) => {
    return jwt.decode(token);
  },
};
