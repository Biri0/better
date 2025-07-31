import { db } from "~/server/db";
import { bets, betOptions, users } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import Link from "next/link";
import { auth } from "~/server/auth";

type PageProps = {
  searchParams: Promise<Record<string, string>>;
};

export default async function Bet({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const betId = resolvedSearchParams.id;

  // Get current user session
  const session = await auth();

  // Get bet data with creator name
  const bet = betId
    ? await db
        .select({
          id: bets.id,
          title: bets.title,
          description: bets.description,
          endTime: bets.endTime,
          expirationTime: bets.expirationTime,
          createdBy: bets.createdBy,
          createdAt: bets.createdAt,
          creatorName: users.name,
        })
        .from(bets)
        .innerJoin(users, eq(bets.createdBy, users.id))
        .where(eq(bets.id, betId))
    : [];

  const betData = bet[0];

  // Get bet options if bet exists
  const options = betData
    ? await db.select().from(betOptions).where(eq(betOptions.betId, betData.id))
    : [];

  // Get user credits if user is logged in
  const userCredits = session?.user.id
    ? await db
        .select({ credits: users.credits })
        .from(users)
        .where(eq(users.id, session.user.id))
    : [];

  const availableCredits = userCredits[0]?.credits ?? 0;

  if (!betData) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center py-2">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Bet Not Found</CardTitle>
            <CardDescription>
              The bet you&apos;re looking for doesn&apos;t exist or has been
              removed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button className="w-full">Return to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{betData.title}</CardTitle>
          <CardDescription>{betData.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                End Time
              </h3>
              <p className="text-sm">
                {new Date(betData.endTime).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                Expiration Time
              </h3>
              <p className="text-sm">
                {new Date(betData.expirationTime).toLocaleString()}
              </p>
            </div>
            <div>
              <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                Created By
              </h3>
              <p className="text-sm">{betData.creatorName ?? "Unknown"}</p>
            </div>
            <div>
              <h3 className="text-muted-foreground mb-1 text-sm font-medium">
                Created At
              </h3>
              <p className="text-sm">
                {new Date(betData.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* User Credits Display */}
          {session?.user && (
            <div className="bg-muted/50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Your Credits</h3>
                <Badge variant="secondary" className="text-sm">
                  {availableCredits} credits
                </Badge>
              </div>
            </div>
          )}

          {/* Bet Options */}
          {options.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Betting Options</h3>
              <div className="grid gap-4">
                {options.map((option) => (
                  <Card key={option.optionId} className="relative">
                    <CardContent className="p-4">
                      <div className="flex flex-col space-y-4 sm:flex-row sm:items-end sm:space-y-0 sm:space-x-4">
                        <div className="flex-1">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{option.label}</h4>
                              <Badge variant="outline" className="text-xs">
                                {Number(option.currentOdds).toFixed(2)}
                              </Badge>
                            </div>
                            <Badge
                              variant={
                                option.status === "open"
                                  ? "default"
                                  : option.status === "won"
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="text-xs"
                            >
                              {option.status}
                            </Badge>
                          </div>
                        </div>

                        {session?.user && option.status === "open" && (
                          <div className="flex flex-col space-y-2 sm:flex-row sm:items-end sm:space-y-0 sm:space-x-2">
                            <div className="space-y-1">
                              <Label
                                htmlFor={`bet-${option.optionId}`}
                                className="text-xs"
                              >
                                Credits to bet
                              </Label>
                              <Input
                                id={`bet-${option.optionId}`}
                                type="number"
                                min="1"
                                max={availableCredits}
                                placeholder="0"
                                className="w-full sm:w-24"
                                disabled={availableCredits === 0}
                              />
                            </div>
                            <Button
                              size="sm"
                              disabled={availableCredits === 0}
                              className="w-full sm:w-auto"
                            >
                              Place Bet
                            </Button>
                          </div>
                        )}

                        {!session?.user && (
                          <div className="text-muted-foreground text-sm">
                            <Link href="/api/auth/signin" className="underline">
                              Sign in to place bets
                            </Link>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4">
            <Link href="/dashboard">
              <Button variant="outline" className="w-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
