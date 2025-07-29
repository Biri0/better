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
});
