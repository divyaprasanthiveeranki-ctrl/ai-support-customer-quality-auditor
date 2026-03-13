import { Shield, ShieldAlert, ShieldCheck, ShieldX, AlertTriangle, CheckCircle2, Loader2, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export interface ComplianceData {
  overallScore: number;
  status: string;
  violations: {
    rule: string;
    severity: string;
    description: string;
    timestamp?: string;
    recommendation: string;
  }[];
  passed: {
    rule: string;
    note: string;
  }[];
  recommendations: string[];
}

interface CompliancePanelProps {
  data: ComplianceData | null;
  isChecking: boolean;
  onRunCheck: () => void;
  hasTranscript: boolean;
}

const severityColor: Record<string, string> = {
  critical: "bg-destructive text-destructive-foreground",
  high: "bg-[hsl(var(--speaker-4))] text-primary-foreground",
  medium: "bg-[hsl(var(--speaker-2))] text-primary-foreground",
  low: "bg-muted text-muted-foreground",
};

const statusIcon: Record<string, typeof Shield> = {
  Compliant: ShieldCheck,
  "Minor Violations": ShieldAlert,
  "Major Violations": ShieldX,
  "Critical Breach": ShieldX,
};

const statusColor: Record<string, string> = {
  Compliant: "text-[hsl(var(--speaker-3))]",
  "Minor Violations": "text-[hsl(var(--speaker-2))]",
  "Major Violations": "text-[hsl(var(--speaker-4))]",
  "Critical Breach": "text-destructive",
};

export function CompliancePanel({ data, isChecking, onRunCheck, hasTranscript }: CompliancePanelProps) {
  if (!data && !isChecking) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Compliance & SOP Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Shield className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-xs text-muted-foreground mb-3">
              Run a compliance check against SOP rules and knowledge base
            </p>
            <Button size="sm" onClick={onRunCheck} disabled={!hasTranscript} className="text-xs">
              <ShieldCheck className="w-3.5 h-3.5 mr-1" />
              Run Compliance Check
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isChecking) {
    return (
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Compliance & SOP Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 py-6 justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Checking against SOP rules…</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const StatusIcon = statusIcon[data.status] || Shield;
  const scoreColor =
    data.overallScore >= 80 ? "text-[hsl(var(--speaker-3))]" :
    data.overallScore >= 50 ? "text-[hsl(var(--speaker-2))]" :
    "text-destructive";

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            Compliance & SOP Check
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onRunCheck} className="text-xs h-7">
            Re-check
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Score & Status */}
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className={`text-3xl font-bold ${scoreColor}`}>{data.overallScore}</p>
            <p className="text-[10px] text-muted-foreground">/ 100</p>
          </div>
          <div className="flex-1">
            <div className={`flex items-center gap-1.5 ${statusColor[data.status] || "text-foreground"}`}>
              <StatusIcon className="w-4 h-4" />
              <span className="text-sm font-semibold">{data.status}</span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {data.violations.length} violation{data.violations.length !== 1 ? "s" : ""} · {data.passed.length} passed
            </p>
          </div>
        </div>

        {/* Score bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              data.overallScore >= 80 ? "bg-[hsl(var(--speaker-3))]" :
              data.overallScore >= 50 ? "bg-[hsl(var(--speaker-2))]" :
              "bg-destructive"
            }`}
            style={{ width: `${data.overallScore}%` }}
          />
        </div>

        <Accordion type="multiple" className="space-y-1">
          {/* Violations */}
          {data.violations.length > 0 && (
            <AccordionItem value="violations" className="border-none">
              <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  Violations ({data.violations.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {data.violations.map((v, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-medium text-foreground leading-tight">{v.rule}</p>
                        <Badge className={`text-[9px] shrink-0 ${severityColor[v.severity] || severityColor.low}`}>
                          {v.severity}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1">{v.description}</p>
                      {v.timestamp && (
                        <p className="text-[10px] text-muted-foreground/70">⏱ {v.timestamp}</p>
                      )}
                      <p className="text-[10px] text-primary mt-1">💡 {v.recommendation}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Passed Rules */}
          {data.passed.length > 0 && (
            <AccordionItem value="passed" className="border-none">
              <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(var(--speaker-3))]" />
                  Passed ({data.passed.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1.5">
                  {data.passed.map((p, i) => (
                    <div key={i} className="p-2 rounded-lg bg-[hsl(var(--speaker-3))]/5 border border-[hsl(var(--speaker-3))]/10">
                      <p className="text-xs font-medium text-foreground">{p.rule}</p>
                      <p className="text-[10px] text-muted-foreground">{p.note}</p>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Recommendations */}
          {data.recommendations.length > 0 && (
            <AccordionItem value="recs" className="border-none">
              <AccordionTrigger className="text-xs font-semibold py-2 hover:no-underline">
                <span className="flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-primary" />
                  Recommendations ({data.recommendations.length})
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="space-y-1">
                  {data.recommendations.map((r, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}
