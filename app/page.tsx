"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession, signOut } from "@/lib/auth-client";
import {
  api,
  streamInsight,
  streamChat,
  ConflictError,
  type SalesRecord,
  type Team,
  type ChatMessage,
} from "@/lib/api";
import { socket } from "@/lib/socket";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [product, setProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [soldAt, setSoldAt] = useState("");
  const [teamId, setTeamId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string }[]>([]);

  const [editingRecord, setEditingRecord] = useState<SalesRecord | null>(null);
  const [editProduct, setEditProduct] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editSoldAt, setEditSoldAt] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  const [insight, setInsight] = useState<string | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    if (!session) return;

    socket.connect();

    function handleCreated(record: SalesRecord) {
      setRecords((prev) => [record, ...prev]);
    }

    function handleUpdated(record: SalesRecord) {
      setRecords((prev) => prev.map((r) => (r.id === record.id ? record : r)));
    }

    function handleDeleted({ id }: { id: string }) {
      setRecords((prev) => prev.filter((r) => r.id !== id));
    }

    function handleOnlineUsers(users: { id: string; name: string }[]) {
      setOnlineUsers(users);
    }

    socket.on("sales-record:created", handleCreated);
    socket.on("sales-record:updated", handleUpdated);
    socket.on("sales-record:deleted", handleDeleted);
    socket.on("online-users", handleOnlineUsers);

    return () => {
      socket.off("sales-record:created", handleCreated);
      socket.off("sales-record:updated", handleUpdated);
      socket.off("sales-record:deleted", handleDeleted);
      socket.off("online-users", handleOnlineUsers);
      socket.disconnect();
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    api.getSalesRecords().then(setRecords);
    api.getTeams().then((teams) => {
      setTeams(teams);
      if (teams[0]) setTeamId(teams[0].id);
    });
  }, [session]);

  const chartData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const record of records) {
      const current = totals.get(record.team.name) ?? 0;
      totals.set(record.team.name, current + Number(record.amount));
    }
    return Array.from(totals, ([team, total]) => ({ team, total }));
  }, [records]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    try {
      await api.createSalesRecord({
        product,
        amount: Number(amount),
        soldAt,
        teamId,
      });
      setDialogOpen(false);
      setProduct("");
      setAmount("");
      setSoldAt("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create record");
    }
  }

  async function handleDelete(id: string) {
    await api.deleteSalesRecord(id);
  }

  async function handleGenerateInsight() {
    setInsightLoading(true);
    setInsightError(null);
    setInsight("");

    try {
      await streamInsight((chunk) => {
        setInsight((prev) => (prev ?? "") + chunk);
      });
    } catch (err) {
      setInsightError(err instanceof Error ? err.message : "Failed to generate insight");
    } finally {
      setInsightLoading(false);
    }
  }

  async function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = { role: "user", content: chatInput };
    const history = [...chatMessages, userMessage];

    setChatMessages([...history, { role: "assistant", content: "" }]);
    setChatInput("");
    setChatLoading(true);
    setChatError(null);

    try {
      await streamChat(history, (chunk) => {
        setChatMessages((prev) => {
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = { ...last, content: last.content + chunk };
          return next;
        });
      });
    } catch (err) {
      setChatError(err instanceof Error ? err.message : "Failed to get a response");
    } finally {
      setChatLoading(false);
    }
  }

  function openEdit(record: SalesRecord) {
    setEditingRecord(record);
    setEditProduct(record.product);
    setEditAmount(record.amount);
    setEditSoldAt(record.soldAt.slice(0, 10));
    setEditError(null);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRecord) return;
    setEditError(null);

    try {
      await api.updateSalesRecord(editingRecord.id, {
        product: editProduct,
        amount: Number(editAmount),
        soldAt: editSoldAt,
        expectedUpdatedAt: editingRecord.updatedAt,
      });
      setEditingRecord(null);
    } catch (err) {
      if (err instanceof ConflictError) {
        setEditError(
          "Someone else already changed this record. The table now shows the latest version — please try again.",
        );
        return;
      }
      setEditError(err instanceof Error ? err.message : "Failed to update record");
    }
  }

  if (isPending || !session) {
    return null;
  }

  const role = session.user.role;
  const userTeamId = session.user.teamId;
  const canWrite = role === "ADMIN" || role === "MANAGER";
  const selectableTeams =
    role === "MANAGER" ? teams.filter((t) => t.id === userTeamId) : teams;

  function canWriteRecord(record: SalesRecord) {
    if (role === "ADMIN") return true;
    if (role === "MANAGER") return record.teamId === userTeamId;
    return false;
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold">Sales Records</h1>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {onlineUsers.length} online:{" "}
            {onlineUsers.map((u) => u.name).join(", ")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canWrite && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button>Add record</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add sales record</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="product">Product</Label>
                  <Input
                    id="product"
                    value={product}
                    onChange={(e) => setProduct(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="soldAt">Sold at</Label>
                  <Input
                    id="soldAt"
                    type="date"
                    value={soldAt}
                    onChange={(e) => setSoldAt(e.target.value)}
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="teamId">Team</Label>
                  <select
                    id="teamId"
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="border-input rounded-md border bg-transparent px-3 py-2 text-sm"
                    required
                  >
                    {selectableTeams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button type="submit">Save</Button>
              </form>
            </DialogContent>
          </Dialog>
          )}
          <Button variant="outline" onClick={() => signOut()}>
            Sign out
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales by Team</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="team" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="var(--color-primary)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>AI Insight</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateInsight}
            disabled={insightLoading}
          >
            {insightLoading ? "Generating..." : "Generate Insight"}
          </Button>
        </CardHeader>
        <CardContent>
          {insightError && <p className="text-sm text-destructive">{insightError}</p>}
          {insight && <p className="text-sm whitespace-pre-line">{insight}</p>}
          {!insight && !insightError && !insightLoading && (
            <p className="text-sm text-muted-foreground">
              Click &quot;Generate Insight&quot; to get an AI summary of recent sales.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ask about your sales data</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex max-h-64 flex-col gap-3 overflow-y-auto">
            {chatMessages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                e.g. &quot;Why did sales increase this week?&quot;
              </p>
            )}
            {chatMessages.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "text-right" : "text-left"}
              >
                <span
                  className={
                    m.role === "user"
                      ? "inline-block rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground"
                      : "inline-block rounded-lg bg-muted px-3 py-2 text-sm whitespace-pre-line"
                  }
                >
                  {m.content || "..."}
                </span>
              </div>
            ))}
          </div>
          {chatError && <p className="text-sm text-destructive">{chatError}</p>}
          <form onSubmit={handleSendChat} className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about your sales data..."
              disabled={chatLoading}
            />
            <Button type="submit" disabled={chatLoading}>
              Send
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog
        open={editingRecord !== null}
        onOpenChange={(open) => !open && setEditingRecord(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit sales record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-product">Product</Label>
              <Input
                id="edit-product"
                value={editProduct}
                onChange={(e) => setEditProduct(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="edit-soldAt">Sold at</Label>
              <Input
                id="edit-soldAt"
                type="date"
                value={editSoldAt}
                onChange={(e) => setEditSoldAt(e.target.value)}
                required
              />
            </div>
            {editError && <p className="text-sm text-destructive">{editError}</p>}
            <Button type="submit">Save</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Product</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Team</TableHead>
            <TableHead>Sold at</TableHead>
            <TableHead>Recorded by</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell>{record.product}</TableCell>
              <TableCell>{record.amount}</TableCell>
              <TableCell>{record.team.name}</TableCell>
              <TableCell>
                {new Date(record.soldAt).toLocaleDateString()}
              </TableCell>
              <TableCell>{record.recordedBy.name}</TableCell>
              <TableCell>
                {canWriteRecord(record) && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(record)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(record.id)}
                    >
                      Delete
                    </Button>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
