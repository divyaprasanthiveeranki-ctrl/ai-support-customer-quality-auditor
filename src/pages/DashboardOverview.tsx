import { useCallContext } from "@/contexts/CallContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PhoneCall, Award, ShieldCheck, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

export default function DashboardOverview() {
  const { calls } = useCallContext();

  const totalCalls = calls.length;

  const scores = calls
    .map((c) => (c.summary_data as any)?.qualityScores?.overallScore)
    .filter((s): s is number => typeof s === "number");
  const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

  const complianceCalls = calls.filter((c) => c.compliance_data);
  const compliantCount = complianceCalls.filter(
    (c) => (c.compliance_data as any)?.status === "Compliant"
  ).length;
  const complianceRate = complianceCalls.length
    ? Math.round((compliantCount / complianceCalls.length) * 100)
    : 0;

  const sentiments = calls.reduce<Record<string, number>>((acc, c) => {
    const s = (c.summary_data as any)?.sentiment;
    if (s) acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});
  const sentimentData = Object.entries(sentiments).map(([name, value]) => ({ name, value }));
  const COLORS = [
    "hsl(var(--speaker-2))", "hsl(var(--speaker-4))", "hsl(var(--speaker-3))", "hsl(var(--primary))",
  ];

  const recentScores = calls
    .slice(0, 10)
    .reverse()
    .map((c, i) => ({
      name: `#${i + 1}`,
      score: (c.summary_data as any)?.qualityScores?.overallScore || 0,
    }));

  const stats = [
    { label: "Total Calls", value: totalCalls, icon: PhoneCall, color: "text-primary" },
    { label: "Avg Score", value: `${avgScore}/100`, icon: Award, color: "text-[hsl(var(--speaker-2))]" },
    { label: "Compliance Rate", value: `${complianceRate}%`, icon: ShieldCheck, color: "text-[hsl(var(--speaker-3))]" },
    { label: "Analyzed", value: scores.length, icon: TrendingUp, color: "text-[hsl(var(--speaker-4))]" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Overview of your call quality metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Recent Quality Scores</CardTitle>
          </CardHeader>
          <CardContent>
            {recentScores.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={recentScores}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No score data yet</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Sentiment Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={sentimentData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {sentimentData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-10">No sentiment data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
