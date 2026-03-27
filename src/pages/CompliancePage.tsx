import { useCallContext } from "@/contexts/CallContext";
import { CompliancePanel, type ComplianceData } from "@/components/CompliancePanel";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function CompliancePage() {
  const { selectedCall, isCheckingCompliance, runComplianceCheck } = useCallContext();

  if (!selectedCall) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compliance</h1>
          <p className="text-sm text-muted-foreground mt-1">SOP and compliance verification</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">No call selected</h2>
            <p className="text-sm text-muted-foreground max-w-sm">Upload and select a call to run compliance checks.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Compliance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Checking: <span className="font-medium text-foreground">{selectedCall.file_name}</span>
        </p>
      </div>
      <div className="max-w-2xl">
        <CompliancePanel
          data={selectedCall.compliance_data as ComplianceData | null}
          isChecking={isCheckingCompliance}
          onRunCheck={runComplianceCheck}
          hasTranscript={!!selectedCall.transcript_data}
        />
      </div>
    </div>
  );
}
