import { z } from "zod";

export const formSchema = z.object({
  optionId: z.string(),
  expectedOdd: z.number(),
  credits: z.number().min(1),
});
