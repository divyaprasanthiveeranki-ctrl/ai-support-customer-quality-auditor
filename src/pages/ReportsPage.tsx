import { useCallContext } from "@/contexts/CallContext";
import { ExportReport } from "@/components/ExportReport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function ReportsPage() {
  const { calls, selectedCall } = useCallContext();

  const handleBulkExport = () => {
    toast.info("Bulk export coming soon!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground mt-1">Download and manage call reports</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={handleBulkExport}>
          <Download className="w-4 h-4" />
          Bulk Export
        </Button>
      </div>

      {selectedCall && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold">Current Selection</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-foreground">{selectedCall.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(selectedCall.created_at).toLocaleString()}
                </p>
              </div>
            </div>
            <ExportReport callRecord={selectedCall} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">All Calls</CardTitle>
        </CardHeader>
        <CardContent>
          {calls.length === 0 ? (
            <div className="text-center py-10">
              <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No calls to report on yet</p>
            </div>
          ) : (
            <div className="space-y-2">
              {calls.map((call) => (
                <div
                  key={call.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{call.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(call.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <ExportReport callRecord={call} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
