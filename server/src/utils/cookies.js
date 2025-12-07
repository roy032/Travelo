export const cookies = {
  getOptions: () => ({
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60 * 1000, // 15 minutes
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