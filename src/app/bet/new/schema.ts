import { z } from "zod";

export const formSchema = z.object({
  title: z
    .string()
    .min(2, {
      message: "Title must contain at least 2 characters.",
    })
    .max(32, {
      message: "Title must contain at most 32 characters.",
    }),
  description: z.string().min(2, {
    message: "Description must contain at least 2 characters.",
  }),
  endTime: z.date().min(new Date(), {
    message: "End bet must be in the future.",
  }),
  expirationTime: z.date().min(new Date(), {
    message: "Expiration must be in the future.",
  }),
  optionLabels: z
    .array(
      z.string().min(1, {
        message: "Option cannot be empty.",
      }),
    )
    .min(2, {
      message: "You must provide at least 2 options.",
    })
    .refine((options) => new Set(options).size === options.length, {
      message: "All options must be unique.",
    }),
  optionOdds: z
    .array(
      z
        .number()
        .min(1.01, {
          message: "Odds must be at least 1.01.",
        })
        .max(99.99, {
          message: "Odds must be at most 99.99.",
        }),
    )
    .min(2, {
      message: "You must provide odds for at least 2 options.",
    }),
  fee: z
    .number()
    .min(0, { message: "Fee must be at least 0%." })
    .max(0.25, { message: "Fee must be at most 25%." }),
  lossCap: z
    .number()
    .int()
    .min(1, { message: "Loss cap must be at least 1 credit." }),
});
