"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Fingerprint } from "lucide-react";
import { formatPatientId } from "@/lib/auth-helper";

export function PatientIdCard({ patientId, userName }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(patientId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!patientId) return null;

  const formattedId = formatPatientId(patientId);

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Fingerprint className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-lg">Your Patient ID</h3>
                <Badge variant="outline" className="text-xs">
                  Unique Identifier
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Share this ID with your doctor for secure access
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="bg-background px-4 py-2 rounded-lg border font-mono text-lg tracking-wider">
              {formattedId}
            </div>
            <Button
              variant="outline"
              size="icon"
              onClick={copyToClipboard}
              className="flex-shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1 h-1 rounded-full bg-primary" />
            <span>Use this ID instead of email to login</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-1 h-1 rounded-full bg-primary" />
            <span>Doctors need this ID to access your records</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}