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
import {
  DollarSign,
  Receipt,
  TrendingUp,
  Users,
  Sparkles,
  Pencil,
  Trash2,
  FileDown,
  Plus,
  Inbox,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DashboardNav } from "@/components/dashboard-nav";
import { ChatWidget } from "@/components/chat-widget";
import { useSession } from "@/lib/auth-client";
import {
  api,
  streamInsight,
  streamChat,
  ConflictError,
  type SalesRecord,
  type Team,
  type ChatMessage,
} from "@/lib/api";
import { exportSalesReportPdf } from "@/lib/export-pdf";
import { socket } from "@/lib/socket";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "THB",
  maximumFractionDigits: 0,
});

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const [records, setRecords] = useState<SalesRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [product, setProduct] = useState("");
  const [amount, setAmount] = useState("");
  const [soldAt, setSoldAt] = useState("");
  const [teamId, setTeamId] = useState("");
  const [onlineUsers, setOnlineUsers] = useState<{ id: string; name: string }[]>([]);

  const [deleteTarget, setDeleteTarget] = useState<SalesRecord | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [editingRecord, setEditingRecord] = useState<SalesRecord | null>(null);
  const [editProduct, setEditProduct] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [editSoldAt, setEditSoldAt] = useState("");

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

    function handleConnectError() {
      toast.error("Live updates are unavailable — reconnecting...");
    }

    socket.on("sales-record:created", handleCreated);
    socket.on("sales-record:updated", handleUpdated);
    socket.on("sales-record:deleted", handleDeleted);
    socket.on("online-users", handleOnlineUsers);
    socket.on("connect_error", handleConnectError);

    return () => {
      socket.off("sales-record:created", handleCreated);
      socket.off("sales-record:updated", handleUpdated);
      socket.off("sales-record:deleted", handleDeleted);
      socket.off("online-users", handleOnlineUsers);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, [session]);

  useEffect(() => {
    if (!session) return;
    Promise.all([api.getSalesRecords(), api.getTeams()])
      .then(([records, teams]) => {
        setRecords(records);
        setTeams(teams);
        if (teams[0]) setTeamId(teams[0].id);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load dashboard data");
      })
      .finally(() => {
        setRecordsLoading(false);
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

  const stats = useMemo(() => {
    const totalRevenue = records.reduce((sum, r) => sum + Number(r.amount), 0);
    const recordCount = records.length;
    const avgDeal = recordCount === 0 ? 0 : totalRevenue / recordCount;
    return { totalRevenue, recordCount, avgDeal };
  }, [records]);

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = records.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const pageEnd = Math.min(currentPage * pageSize, records.length);
  const paginatedRecords = records.slice(pageStart - 1, pageEnd);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();

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
      toast.success("Record added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create record");
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      await api.deleteSalesRecord(deleteTarget.id);
      toast.success("Record deleted");
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete record");
    } finally {
      setDeleting(false);
    }
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
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRecord) return;

    try {
      await api.updateSalesRecord(editingRecord.id, {
        product: editProduct,
        amount: Number(editAmount),
        soldAt: editSoldAt,
        expectedUpdatedAt: editingRecord.updatedAt,
      });
      setEditingRecord(null);
      toast.success("Record updated");
    } catch (err) {
      if (err instanceof ConflictError) {
        setEditingRecord(null);
        toast.error(
          "Someone else already changed this record. The table now shows the latest version — please try again.",
        );
        return;
      }
      toast.error(err instanceof Error ? err.message : "Failed to update record");
    }
  }

  if (isPending || !session) {
    return (
      <div className="flex flex-1 flex-col gap-6 p-8">
        <Skeleton className="h-14 w-full max-w-sm" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
        <Skeleton className="h-72 w-full" />
      </div>
    );
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
    <div className="flex flex-1 flex-col">
      <DashboardNav user={session.user} onlineCount={onlineUsers.length} />

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Sales overview</h1>
            <p className="text-sm text-muted-foreground">
              {onlineUsers.length > 0
                ? `${onlineUsers.map((u) => u.name).join(", ")} online now`
                : "Real-time view of your team's performance"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canWrite && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger
                  render={
                    <Button>
                      <Plus /> Add record
                    </Button>
                  }
                />
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
                      <Select value={teamId} onValueChange={(value) => setTeamId(value ?? "")}>
                        <SelectTrigger id="teamId" className="w-full">
                          <SelectValue placeholder="Select a team" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectableTeams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button type="submit">Save</Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
            <Button
              variant="outline"
              onClick={() => exportSalesReportPdf(records, insight)}
              disabled={records.length === 0}
            >
              <FileDown /> Export PDF
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recordsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : (
            <>
              <StatCard
                icon={DollarSign}
                label="Total revenue"
                value={currency.format(stats.totalRevenue)}
              />
              <StatCard icon={Receipt} label="Records" value={String(stats.recordCount)} />
              <StatCard
                icon={TrendingUp}
                label="Avg. deal size"
                value={currency.format(stats.avgDeal)}
              />
              <StatCard icon={Users} label="Online now" value={String(onlineUsers.length)} />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Sales by team</CardTitle>
            </CardHeader>
            <CardContent>
              {recordsLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : chartData.length === 0 ? (
                <EmptyState
                  icon={TrendingUp}
                  title="No sales yet"
                  description="Add your first record to see it charted here."
                />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="team"
                        tickFormatter={(value: string) => value.replace(" Region", "")}
                        interval={0}
                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                        axisLine={{ stroke: "var(--border)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--muted)" }}
                        contentStyle={{
                          background: "var(--popover)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--radius-md)",
                          fontSize: 13,
                        }}
                      />
                      <Bar dataKey="total" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> AI Insight
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateInsight}
                disabled={insightLoading}
              >
                {insightLoading ? "Generating..." : "Generate"}
              </Button>
            </CardHeader>
            <CardContent>
              {insightError && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {insightError}
                </p>
              )}
              {insight && <p className="text-sm leading-relaxed whitespace-pre-line">{insight}</p>}
              {!insight && !insightError && !insightLoading && (
                <EmptyState
                  icon={Sparkles}
                  title="No insight yet"
                  description='Click "Generate" for an AI summary of recent sales.'
                />
              )}
            </CardContent>
          </Card>
        </div>


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
              <Button type="submit">Save</Button>
            </form>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => !open && setDeleteTarget(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this record?</AlertDialogTitle>
              <AlertDialogDescription>
                {deleteTarget && (
                  <>
                    This will permanently delete the &quot;{deleteTarget.product}&quot; record
                    for {currency.format(Number(deleteTarget.amount))}. This cannot be undone.
                  </>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={confirmDelete} disabled={deleting}>
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Card>
          <CardHeader>
            <CardTitle>Sales records</CardTitle>
          </CardHeader>
          <CardContent>
            {recordsLoading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : records.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No sales records yet"
                description={
                  canWrite
                    ? 'Click "Add record" above to log your first sale.'
                    : "Records added by your team will show up here."
                }
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Sold at</TableHead>
                      <TableHead>Recorded by</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">{record.product}</TableCell>
                        <TableCell>{currency.format(Number(record.amount))}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.team.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(record.soldAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {record.recordedBy.name}
                        </TableCell>
                        <TableCell className="text-right">
                          {canWriteRecord(record) && (
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => openEdit(record)}
                                aria-label="Edit record"
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleteTarget(record)}
                                aria-label="Delete record"
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {records.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span>Rows per page</span>
                  <Select
                    value={String(pageSize)}
                    onValueChange={(value) => {
                      setPageSize(Number(value ?? 25));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger size="sm" className="w-[72px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[10, 25, 50, 100].map((size) => (
                        <SelectItem key={size} value={String(size)}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-4">
                  <span>
                    {pageStart}–{pageEnd} of {records.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label="Previous page"
                    >
                      <ChevronLeft />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Next page"
                    >
                      <ChevronRight />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ChatWidget
        messages={chatMessages}
        input={chatInput}
        onInputChange={setChatInput}
        onSubmit={handleSendChat}
        loading={chatLoading}
        error={chatError}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-1">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-foreground">
          <Icon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-xs text-muted-foreground">{label}</span>
          <span className="truncate text-lg font-semibold tracking-tight">{value}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" />
      </span>
      <p className="text-sm font-medium">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
