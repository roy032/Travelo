import { z } from "zod";

const code = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");
const recoveryCode = z.string().trim().min(8).max(32);

export const twoFactorCodeSchema = z.object({ code });

// Either an app code or a recovery code
const secondFactor = z
  .object({ code: code.optional(), recoveryCode: recoveryCode.optional() })
  .refine((data) => Boolean(data.code) !== Boolean(data.recoveryCode), {
    message: "Enter a code from your app or one recovery code",
  });

export const twoFactorSignInSchema = z
  .object({ challenge: z.string().min(1).max(2000) })
  .and(secondFactor);

export const twoFactorDisableSchema = z
  .object({ password: z.string().min(1).max(128) })
  .and(secondFactor);
