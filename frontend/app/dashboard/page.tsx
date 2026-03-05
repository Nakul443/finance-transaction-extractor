"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { transactionAPI } from "@/lib/api";
import { toast } from "sonner";
import { 
  Loader2, Trash2, BarChart3, TrendingUp, TrendingDown, 
  Wallet, Download, RefreshCcw, Search, PieChart as PieChartIcon,
  Moon, Sun, Edit2, Check, X, AlertTriangle, FilterX
} from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useSession, signOut } from "next-auth/react";
import { AIChat } from "@/components/ui/ai-chat";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import { BulkUpload } from "@/components/ui/bulk-upload";

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#f43f5e"];

// Expanded Categories
const CATEGORIES = [
  "Food & Dining", "Shopping", "Rent & Bills", "Transport", 
  "Entertainment", "Health", "Investment", "Salary", "Other"
];

interface Transaction {
  id: string; 
  date: string; 
  description: string; 
  amount: number; 
  category?: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [isDark, setIsDark] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<"all" | "month" | "30days">("all");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") setIsDark(true);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const isIncome = (desc: string) => desc.toLowerCase().match(/salary|refund|credited|received|deposit/);

  const handleExtract = async () => {
    if (!text.trim()) {
      toast.error("Please paste some transaction text first.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await transactionAPI.extract(text);
      
      if (res.data && res.data.transaction) {
        // Use functional update to ensure we don't lose existing data
        setTransactions((prev) => [res.data.transaction, ...prev]);
        setText(""); 
        toast.success("Transaction extracted successfully!");
      }
    } catch (error: any) {
      console.error("Extraction failed:", error);
      toast.error(error.response?.data?.error || "Failed to connect to AI");
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Find the Button in your JSX (near the bottom of the file) and update it:
  <CardContent className="space-y-4">
    <Textarea 
      placeholder="Paste bank SMS here..." 
      value={text} 
      onChange={(e) => setText(e.target.value)} 
      className="dark:bg-slate-800 border-none min-h-[100px] focus-visible:ring-blue-500" 
    />
    
    <Button 
      onClick={handleExtract} // <--- ADD THIS LINE
      disabled={isLoading || !text.trim()} // Prevent double-clicks
      className="w-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
    >
      {isLoading ? (
        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>
      ) : (
        "Extract with AI"
      )}
    </Button>
    
    <BulkUpload onSuccess={(t) => setTransactions((prev) => [t, ...prev])} />
  </CardContent>

  // Advanced Filter Logic
  const filteredData = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (t.category || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? t.category === selectedCategory : true;
      
      if (!matchesSearch || !matchesCategory) return false;
      if (dateFilter === "all") return true;

      const tDate = new Date(t.date);
      const now = new Date();
      if (dateFilter === "month") return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear();
      if (dateFilter === "30days") return (now.getTime() - tDate.getTime()) / (1000 * 3600 * 24) <= 30;
      return true;
    });
  }, [transactions, searchQuery, dateFilter, selectedCategory]);

  const { barData, pieData, stats, budgetAlert } = useMemo(() => {
    const categoryTotals: Record<string, { income: number; expense: number }> = {};
    let inc = 0; let exp = 0;

    filteredData.forEach((t) => {
      const catName = t.category || "Other";
      if (!categoryTotals[catName]) categoryTotals[catName] = { income: 0, expense: 0 };
      const val = parseFloat(t.amount.toString()) || 0;
      if (isIncome(t.description)) {
        categoryTotals[catName].income += val;
        inc += val;
      } else {
        categoryTotals[catName].expense += val;
        exp += val;
      }
    });

    const bar = Object.entries(categoryTotals).map(([name, d]) => ({
      name,
      income: Number(d.income.toFixed(2)),
      expense: Number(d.expense.toFixed(2))
    }));

    const pie = Object.entries(categoryTotals)
      .filter(([_, d]) => d.expense > 0)
      .map(([name, d]) => ({ name, value: Number(d.expense.toFixed(2)) }));

    const ratio = inc > 0 ? (exp / inc) : 0;
    const alert = ratio > 0.8 ? `Warning: Spending is at ${(ratio * 100).toFixed(0)}% of income.` : null;

    return { barData: bar, pieData: pie, stats: { inc, exp, net: inc - exp }, budgetAlert: alert };
  }, [filteredData]);

  // Find your button in the JSX and update it:
  <Button 
      onClick={handleExtract} // <--- ADD THIS
      disabled={isLoading || !text.trim()}
      className="w-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20"
  >
      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Extract with AI"}
  </Button>

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const res = await transactionAPI.list(100);
      setTransactions(res.data.transactions);
    } catch (e) { console.error(e); } 
    finally { setIsLoading(false); }
  };

  useEffect(() => { if (status === "authenticated") fetchTransactions(); }, [status]);

  const handleUpdateCategory = (id: string) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, category: editValue } : t));
    setEditingId(null);
    toast.success("Category updated");
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <header className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-emerald-500 bg-clip-text text-transparent">FinanceFlow Pro</h1>
            <p className="text-slate-500 dark:text-slate-400">Secure Dashboard • {session?.user?.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)} className="rounded-full">
              {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
            </Button>
            <Button variant="outline" className="dark:border-slate-800 rounded-full" onClick={() => signOut()}>Logout</Button>
          </div>
        </header>

        {/* TOP STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-1 text-slate-500 text-sm">Income <TrendingUp className="text-emerald-500 h-4 w-4" /></div>
                <p className="text-2xl font-bold text-emerald-600">₹{stats.inc.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="dark:bg-slate-900 border-none shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
            <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-1 text-slate-500 text-sm">Expenses <TrendingDown className="text-red-500 h-4 w-4" /></div>
                <p className="text-2xl font-bold text-red-600">₹{stats.exp.toLocaleString()}</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-900 dark:bg-blue-600 text-white border-none shadow-lg">
            <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-1 opacity-80 text-sm">Net Balance <Wallet className="h-4 w-4" /></div>
                <p className="text-2xl font-bold">₹{stats.net.toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>

        {/* ANALYTICS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
          <Card className="lg:col-span-8 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2"><BarChart3 className="h-4 w-4 text-blue-500" /> Spending Overview</CardTitle>
              {budgetAlert && <span className="text-xs font-bold text-amber-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" /> {budgetAlert}</span>}
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#1e293b" : "#f1f5f9"} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10}} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip cursor={{fill: isDark ? '#1e293b' : '#f8fafc'}} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#0f172a' : '#fff', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="top" align="right" iconType="circle" />
                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} name="Expense" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-800">
            <CardHeader><CardTitle className="text-lg flex items-center gap-2"><PieChartIcon className="h-4 w-4 text-purple-500" /> Expense Split</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* TRANSACTIONS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Card className="dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader><CardTitle className="text-lg">Add Data</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <Textarea placeholder="Paste bank SMS here..." value={text} onChange={(e) => setText(e.target.value)} className="dark:bg-slate-800 border-none min-h-[100px] focus-visible:ring-blue-500" />
                <Button className="w-full bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20">Extract with AI</Button>
                <BulkUpload onSuccess={(t) => setTransactions((prev) => [t, ...prev])} />
              </CardContent>
            </Card>
            <AIChat />
          </div>

          <div className="lg:col-span-8">
            <Card className="dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-slate-800">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input placeholder="Search..." className="pl-9 dark:bg-slate-800 border-none h-10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  {selectedCategory && (
                    <Button variant="secondary" size="sm" onClick={() => setSelectedCategory(null)} className="h-10 gap-2"><FilterX className="h-4 w-4" /> {selectedCategory}</Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value as any)} className="h-10 px-3 text-sm rounded-md bg-white dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700">
                    <option value="all">All Time</option>
                    <option value="month">This Month</option>
                    <option value="30days">Last 30 Days</option>
                  </select>
                  <Button variant="outline" size="icon" className="text-red-500 h-10 w-10 border-none ring-1 ring-red-100 dark:ring-red-900" onClick={() => { if(window.confirm("Clear?")) setTransactions([]) }}><RefreshCcw className="h-4 w-4" /></Button>
                </div>
              </CardHeader>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-800/50">
                    <TableRow>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-400">Date</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-400">Description</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold text-slate-400">Category</TableHead>
                      <TableHead className="text-right text-[10px] uppercase font-bold text-slate-400">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((t) => {
                      const isInc = isIncome(t.description);
                      return (
                        <TableRow key={t.id} className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-100/20 dark:hover:bg-slate-800/30 transition-colors">
                          <TableCell className="text-[11px] text-slate-500">{new Date(t.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium text-sm max-w-[200px] truncate">{t.description}</TableCell>
                          <TableCell>
                            {editingId === t.id ? (
                              <select 
                                value={editValue} 
                                onChange={(e) => handleUpdateCategory(t.id)} 
                                onBlur={() => setEditingId(null)}
                                className="text-xs p-1 rounded bg-slate-100 dark:bg-slate-800"
                                autoFocus
                              >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                            ) : (
                              <button 
                                onClick={() => setSelectedCategory(t.category || "Other")}
                                onDoubleClick={() => { setEditingId(t.id); setEditValue(t.category || "Other"); }}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold uppercase hover:bg-blue-100 transition-colors"
                              >
                                {t.category || "Other"}
                              </button>
                            )}
                          </TableCell>
                          <TableCell className={`text-right font-mono font-bold ${isInc ? 'text-emerald-600' : 'text-slate-900 dark:text-slate-100'}`}>
                            {isInc ? '+' : ''}₹{t.amount.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}