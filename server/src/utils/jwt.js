import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret-key-change-me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

export const jwtToken = {
  sign: (payload) => {
    try {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    } catch (error) {
      throw new Error("Failed to authenticate token");
    }
  },
  verify: (token) => {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error("Failed to verify token");
    }
  },
  decode: (token) => {
    return jwt.decode(token);
  },
};
