"use server";

import type { z } from "zod";
import { formSchema } from "./schema";
import { db } from "~/server/db";
import { bets } from "~/server/db/schema";
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

  await db.insert(bets).values({
    title: values.title,
    description: values.description,
    endTime: values.endTime,
    expirationTime: values.expirationTime,
    createdBy: session.user.id,
  });

  redirect("/dashboard");
}
