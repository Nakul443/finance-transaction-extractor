"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { transactionAPI } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Trash2, BarChart3 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession, signOut } from "next-auth/react";
import { AIChat } from "@/components/ui/ai-chat";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { BulkUpload } from "@/components/ui/bulk-upload";

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category?: string;
  confidence: number;
  balanceAfter?: number;
  createdAt: string;
}

const COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // FIX: Force strictly numeric aggregation to avoid large/weird string values
  const chartData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.forEach((t) => {
      const cat = t.category || "Other";
      const val = typeof t.amount === "string" ? parseFloat(t.amount) : t.amount;
      categories[cat] = (categories[cat] || 0) + (isNaN(val) ? 0 : val);
    });
    return Object.entries(categories).map(([name, total]) => ({ name, total }));
  }, [transactions]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.accessToken) {
      fetchTransactions();
    }
  }, [status, session?.accessToken, router]);

  const fetchTransactions = async (cursor?: string) => {
    if (cursor) setIsLoadingMore(true);
    else setIsLoadingTransactions(true);

    try {
      const response = await transactionAPI.list(10, cursor);
      const newTransactions = response.data.transactions;
      if (cursor) {
        setTransactions((prev) => [...prev, ...newTransactions]);
      } else {
        setTransactions(newTransactions);
      }
      setNextCursor(response.data.nextCursor);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load transactions.");
    } finally {
      setIsLoadingTransactions(false);
      setIsLoadingMore(false);
    }
  };

  const handleExtract = async () => {
    if (!text.trim()) return;
    setIsLoading(true);
    try {
      const response = await transactionAPI.extract(text);
      setTransactions([response.data.transaction, ...transactions]);
      setText("");
      toast.success("Transaction saved!");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Extraction failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      await transactionAPI.delete(id);
      setTransactions(transactions.filter((t) => t.id !== id));
      toast.success("Deleted");
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  const handleLogout = () => signOut({ callbackUrl: "/login" });

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {session?.user?.name || "User"}!
            </h1>
            <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">
              Org ID: {(session?.user as any)?.organizationId || "Personal"}
            </p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            Logout
          </Button>
        </header>

        <Card className="mb-8">
          <CardHeader className="flex flex-row items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-600" />
            <CardTitle>Spending Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              {transactions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 60, bottom: 20 }} // Increased left margin
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      fontSize={12}
                      tick={{ fill: "#6b7280" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      fontSize={11}
                      tick={{ fill: "#6b7280" }}
                      // FIX: Formatting for large numbers (Billion/Million/Kilo)
                      tickFormatter={(value) => {
                        if (value >= 1000000000) return `₹${(value / 1000000000).toFixed(1)}B`;
                        if (value >= 1000000) return `₹${(value / 1000000).toFixed(1)}M`;
                        if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
                        return `₹${value}`;
                      }}
                    />
                    <Tooltip
                      cursor={{ fill: "#f3f4f6" }}
                      formatter={(value: any) => {
                        const amount = Number(value || 0);
                        return [
                          `₹${amount.toLocaleString("en-IN")}`,
                          "Total Spent",
                        ];
                      }}
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                      }}
                    />
                    <Bar
                      dataKey="total"
                      radius={[6, 6, 0, 0]}
                      barSize={45} // Fixed bar width
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  Add transactions to see your spending visualization.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Extract Transaction</CardTitle>
                <CardDescription>
                  Paste raw bank SMS or email text
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="e.g., Paid Rs. 500 to Starbucks..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <Button
                  onClick={handleExtract}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    "Process Text"
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400">Or</span>
                  </div>
                </div>

                <BulkUpload
                  onSuccess={(newT) =>
                    setTransactions((prev) => [newT, ...prev])
                  }
                />
              </CardContent>
            </Card>
            <AIChat />
          </div>

          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>History</CardTitle>
                <span className="text-xs text-gray-400">
                  {transactions.length} items loaded
                </span>
              </CardHeader>
              <CardContent>
                {isLoadingTransactions ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-300" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="rounded-md border bg-white overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.length === 0 ? (
                            <TableRow>
                              <TableCell
                                colSpan={5}
                                className="h-24 text-center text-gray-500"
                              >
                                No transactions found.
                              </TableCell>
                            </TableRow>
                          ) : (
                            transactions.map((t) => (
                              <TableRow key={t.id}>
                                <TableCell className="text-xs text-gray-500">
                                  {new Date(t.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {t.description}
                                </TableCell>
                                <TableCell>
                                  <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase">
                                    {t.category || "Other"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-mono font-bold">
                                  ₹{Number(t.amount).toLocaleString("en-IN")}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-400 hover:text-red-600"
                                    onClick={() => handleDelete(t.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                    {nextCursor && (
                      <div className="flex justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => fetchTransactions(nextCursor)}
                          disabled={isLoadingMore}
                          className="text-gray-500"
                        >
                          {isLoadingMore ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            "Load more"
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}