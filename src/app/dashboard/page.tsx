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

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/dashboard");
  }

  const bets = [
    { title: "My bet", createdBy: "Me", expires: "Tomorrow" },
    { title: "Another bet", createdBy: "Alice", expires: "Next week" },
    { title: "Yet another bet", createdBy: "Bob", expires: "Next month" },
  ];

  return (
    <div className="m-1 md:mx-32 md:mt-4">
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
            <TableHead>Created by</TableHead>
            <TableHead>Expires</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bets.map((bet, idx) => (
            <TableRow key={idx}>
              <TableCell>{bet.title}</TableCell>
              <TableCell>{bet.createdBy}</TableCell>
              <TableCell>{bet.expires}</TableCell>
              <TableCell>
                <Button>Show more</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
