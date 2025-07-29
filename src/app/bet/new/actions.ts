"use server";

import type { z } from "zod";
import { formSchema } from "./schema";
import { db } from "~/server/db";
import { betOptions, bets } from "~/server/db/schema";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export async function createBet(values: z.infer<typeof formSchema>) {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/dashboard");
  }

  const parsed = formSchema.safeParse(values);
  if (!parsed.success) {
    throw new Error("Invalid data");
  }

  const result = await db
    .insert(bets)
    .values({
      title: values.title,
      description: values.description,
      endTime: values.endTime,
      expirationTime: values.expirationTime,
      createdBy: session.user.id,
    })
    .returning({ betId: bets.id });

  const betId = result[0]?.betId;
  if (!betId) {
    throw new Error("Failed to create bet");
  }

  await db.insert(betOptions).values(
    values.optionLabels.map((label) => ({
      label: label,
      status: "open" as const,
      betId: betId,
    })),
  );

  redirect("/dashboard");
}
