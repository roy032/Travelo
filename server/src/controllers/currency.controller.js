import { convertQuerySchema } from "#validations/expense.validation.js";
import { formatValidationError } from "#utils/format.js";
import {
  SUPPORTED_CURRENCIES,
  convertAmount,
  getRates,
} from "#services/currency.service.js";

/**
 * List supported currencies with their current rate against USD
 * @route GET /api/currency/rates
 */
export const getRatesController = async (req, res, next) => {
  try {
    const table = await getRates();
    res.set("Cache-Control", "private, max-age=3600");
    res.status(200).json({
      base: table.base,
      currencies: SUPPORTED_CURRENCIES,
      rates: table.rates,
      source: table.source,
      approximate: table.approximate,
      fetchedAt: table.fetchedAt,
    });
  } catch (e) {
    next(e);
  }
};

/**
 * Convert an amount between two currencies
 * @route GET /api/currency/convert?amount=10&from=EUR&to=BDT
 */
export const convertController = async (req, res, next) => {
  try {
    const validationResult = convertQuerySchema.safeParse(req.query);

    if (!validationResult.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: formatValidationError(validationResult.error),
      });
    }

    const { amount, from, to } = validationResult.data;
    res.status(200).json(await convertAmount(amount, from, to));
  } catch (e) {
    next(e);
  }
};
