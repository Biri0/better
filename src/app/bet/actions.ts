"use server";

import type { z } from "zod";
import { formSchema } from "./schema";
import { db } from "~/server/db";
import { betOptions, users, bets, betsPlaced } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type * as schema from "~/server/db/schema";

// Helper functions for odds calculation
async function calculateCurrentExposure(
  tx: PgTransaction<
    PostgresJsQueryResultHKT,
    typeof schema,
    ExtractTablesWithRelations<typeof schema>
  >,
  betId: string,
): Promise<Record<string, number>> {
  const allOptions = await tx
    .select({ optionId: betOptions.optionId })
    .from(betOptions)
    .where(eq(betOptions.betId, betId));

  const exposure: Record<string, number> = {};

  for (const option of allOptions) {
    const betsOnOption = await tx
      .select({
        staked: betsPlaced.staked,
        odds: betsPlaced.odds,
      })
      .from(betsPlaced)
      .where(eq(betsPlaced.optionId, option.optionId));

    // Calculate exposure: sum of (bet_amount * (odds - 1))
    const totalExposure = betsOnOption.reduce(
      (sum: number, bet: { staked: number; odds: string }) => {
        return sum + bet.staked * (Number(bet.odds) - 1);
      },
      0,
    );

    exposure[option.optionId] = totalExposure;
  }

  return exposure;
}

function calculateTargetProbabilities(
  exposure: Record<string, number>,
  lossCap: number,
): Record<string, number> {
  const probabilities: Record<string, number> = {};

  for (const optionId in exposure) {
    const currentExposure = exposure[optionId];
    if (currentExposure !== undefined) {
      const exposureFactor = currentExposure / lossCap;
      // Base probability + increment for exposure
      probabilities[optionId] = Math.max(0.1 + exposureFactor * 0.7, 0.01);
    }
  }

  return probabilities;
}

function normalizeWithMargin(
  probabilities: Record<string, number>,
  fee: number,
): Record<string, number> {
  const sumProbabilities = Object.values(probabilities).reduce(
    (a, b) => a + b,
    0,
  );

  // Target: sum should be > 1 to guarantee profit
  const targetSum = 1 + fee;

  const normalizationFactor = targetSum / sumProbabilities;

  const normalizedProbabilities: Record<string, number> = {};
  for (const optionId in probabilities) {
    const probability = probabilities[optionId];
    if (probability !== undefined) {
      normalizedProbabilities[optionId] = probability * normalizationFactor;
    }
  }

  return normalizedProbabilities;
}

function convertToOdds(
  probabilities: Record<string, number>,
): Record<string, number> {
  const odds: Record<string, number> = {};

  for (const optionId in probabilities) {
    const probability = probabilities[optionId];
    if (probability !== undefined) {
      odds[optionId] = Math.max(
        1 / probability,
        1.01, // Minimum absolute odds
      );
    }
  }

  return odds;
}

async function updateAllOdds(
  tx: PgTransaction<
    PostgresJsQueryResultHKT,
    typeof schema,
    ExtractTablesWithRelations<typeof schema>
  >,
  betId: string,
  lossCap: number,
  fee: number,
): Promise<void> {
  // 1. Calculate current exposure for all options
  const exposure = await calculateCurrentExposure(tx, betId);

  // 2. Calculate target probabilities based on exposure
  const targetProbabilities = calculateTargetProbabilities(exposure, lossCap);

  // 3. Normalize to maintain house margin
  const normalizedProbabilities = normalizeWithMargin(targetProbabilities, fee);

  // 4. Convert to odds
  const newOdds = convertToOdds(normalizedProbabilities);

  // 5. Update all options in database
  for (const optionId in newOdds) {
    const odds = newOdds[optionId];
    if (odds !== undefined) {
      await tx
        .update(betOptions)
        .set({ currentOdds: odds.toFixed(2) })
        .where(eq(betOptions.optionId, optionId));
    }
  }
}

export async function bet(values: z.infer<typeof formSchema>): Promise<{
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

  try {
    return await db.transaction(async (tx) => {
      const [option] = await tx
        .select({
          odds: betOptions.currentOdds,
          status: betOptions.status,
          betId: betOptions.betId,
        })
        .from(betOptions)
        .where(eq(betOptions.optionId, values.optionId));

      if (!option) {
        throw new Error("Option not found");
      }

      if (option.status !== "open") {
        throw new Error("Betting is closed for this option");
      }

      if (Number(option.odds) !== values.expectedOdd) {
        throw new Error("Odds have changed");
      }

      const [bet] = await tx
        .select({
          endTime: bets.endTime,
          lossCap: bets.lossCap,
          fee: bets.fee,
        })
        .from(bets)
        .where(eq(bets.id, option.betId));

      if (!bet || bet.endTime < new Date()) {
        throw new Error("Betting period has ended");
      }

      const [existingBet] = await tx
        .select({ userId: betsPlaced.userId })
        .from(betsPlaced)
        .where(
          and(
            eq(betsPlaced.userId, session.user.id),
            eq(betsPlaced.optionId, values.optionId),
          ),
        );

      if (existingBet) {
        throw new Error("You have already placed a bet on this option");
      }

      const [user] = await tx
        .select({ credits: users.credits })
        .from(users)
        .where(eq(users.id, session.user.id))
        .for("update");

      if (!user) {
        throw new Error("User not found");
      }

      if (user.credits < values.credits) {
        throw new Error("Not enough credits");
      }

      await tx
        .update(users)
        .set({ credits: user.credits - values.credits })
        .where(eq(users.id, session.user.id));

      await tx.insert(betsPlaced).values({
        userId: session.user.id,
        optionId: values.optionId,
        staked: values.credits,
        odds: option.odds,
      });

      // Update all odds for this bet based on new exposure
      await updateAllOdds(tx, option.betId, bet.lossCap, Number(bet.fee));

      return { success: true };
    });
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
