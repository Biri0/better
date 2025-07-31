"use server";

import type { z } from "zod";
import { formSchema } from "./schema";
import { db } from "~/server/db";
import { betOptions, bets, users } from "~/server/db/schema";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";

export async function createBet(values: z.infer<typeof formSchema>): Promise<{
  success: boolean;
  error?: string;
}> {
  const session = await auth();

  if (!session?.user.id) {
    redirect("/dashboard");
  }

  const parsed = formSchema.safeParse(values);
  if (!parsed.success) {
    return { success: false, error: "Invalid form data" };
  }

  const userCredits = await db
    .select({ credits: users.credits })
    .from(users)
    .where(eq(users.id, session.user.id));

  const availableCredits = userCredits[0]?.credits ?? 0;

  if (values.lossCap > availableCredits) {
    return {
      success: false,
      error: `Loss cap cannot exceed your available credits (${availableCredits})`,
    };
  }

  const result = await db.transaction(async (tx) => {
    const betResult = await tx
      .insert(bets)
      .values({
        title: values.title,
        description: values.description,
        endTime: values.endTime,
        expirationTime: values.expirationTime,
        createdBy: session.user.id,
        fee: values.fee.toFixed(2),
        lossCap: values.lossCap,
      })
      .returning({ betId: bets.id });

    const betId = betResult[0]?.betId;
    if (!betId) {
      throw new Error("Failed to create bet");
    }

    await tx.insert(betOptions).values(
      values.optionLabels.map((label, index) => ({
        label: label,
        status: "open" as const,
        betId: betId,
        currentOdds: values.optionOdds[index]!.toFixed(2),
      })),
    );

    const updateResult = await tx
      .update(users)
      .set({
        credits: sql`${users.credits} - ${values.lossCap}`,
      })
      .where(
        sql`${users.id} = ${session.user.id} AND ${users.credits} >= ${values.lossCap}`,
      )
      .returning({ newCredits: users.credits });

    if (updateResult.length === 0) {
      throw new Error("Insufficient credits or user not found");
    }

    return { betId };
  });

  if (!result.betId) {
    return { success: false, error: "Failed to create bet" };
  }

  redirect("/dashboard");
  return { success: true };
}
