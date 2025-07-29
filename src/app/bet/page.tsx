import { db } from "~/server/db";
import { bets } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import Link from "next/link";

type PageProps = {
  searchParams: Promise<Record<string, string>>;
};

export default async function Bet({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const betId = resolvedSearchParams.id;
  const bet = betId
    ? await db.selectDistinct().from(bets).where(eq(bets.id, betId))
    : [];

  const betData = bet[0];

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
              <p className="text-sm">{betData.createdBy}</p>
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
