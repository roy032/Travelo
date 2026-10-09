// Keep the cookie lifetime in line with JWT_EXPIRES_IN (e.g. "15m", "12h", "7d")
const parseDuration = (value) => {
  const match = /^(\d+)\s*([smhd])?$/.exec(String(value || '').trim());
  if (!match) return 24 * 60 * 60 * 1000;
  const units = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return Number(match[1]) * (match[2] ? units[match[2]] : 1);
};

export const cookies = {
  getOptions: () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: parseDuration(process.env.JWT_EXPIRES_IN || '1d'),
  }),

  set: (res, name, value, options = {}) => {
    const opts = { ...cookies.getOptions(), ...options };
    res.cookie(name, value, opts);
  },

  clear: (res, name, options = {}) => {
    const opts = { ...cookies.getOptions(), ...options, maxAge: 0 };
    res.cookie(name, '', opts);
  },

  get: (req, name) => {
    return req.cookies[name];
  },
};