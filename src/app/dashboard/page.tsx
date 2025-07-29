import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "~/components/ui/table";
import Link from "next/link";
import { db } from "~/server/db";
import { bets as betsTable, users } from "~/server/db/schema";
import { desc, eq } from "drizzle-orm";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const bets = await db
    .select({
      id: betsTable.id,
      title: betsTable.title,
      createdBy: betsTable.createdBy,
      creatorName: users.name,
      expirationTime: betsTable.expirationTime,
      createdAt: betsTable.createdAt,
    })
    .from(betsTable)
    .leftJoin(users, eq(betsTable.createdBy, users.id))
    .orderBy(desc(betsTable.createdAt))
    .limit(5);

  return (
    <div className="md:mx-16 md:mt-4 lg:mx-32">
      <Card>
        <CardHeader>Hi {session.user.name}!</CardHeader>
        <CardContent>You have {session.user.credits} credits</CardContent>
      </Card>
      <div className="my-16 flex justify-center">
        <Button>
          <Link href="/bet/new">Create a bet</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead className="hidden md:table-cell">Created by</TableHead>
            <TableHead className="hidden sm:table-cell">Expires</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bets.map((bet, idx) => (
            <TableRow key={idx}>
              <TableCell>{bet.title}</TableCell>
              <TableCell className="hidden md:table-cell">
                {bet.creatorName ?? "Unknown"}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {bet.expirationTime.toLocaleString()}
              </TableCell>
              <TableCell>
                <Button>
                  <Link href={`/bet?id=${bet.id}`}>Show more</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
