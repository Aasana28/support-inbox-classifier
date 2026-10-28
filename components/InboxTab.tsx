"use client";

import React, { useState, useEffect } from "react";
import {
  EmailItem,
  ProcessResponse,
  ProcessTrace,
  Topic,
  Urgency,
  Team,
  RetrievedChunk,
} from "@/lib/types";
import {
  Inbox,
  Mail,
  Send,
  Edit3,
  XCircle,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  FileText,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  BookOpen,
  Info,
  Check,
  RotateCw,
  PlusCircle,
  Eye,
  CheckCheck,
  Tag,
  SlidersHorizontal,
} from "lucide-react";

interface InboxTabProps {
  initialEmails?: EmailItem[];
}

export function InboxTab({ initialEmails = [] }: InboxTabProps) {
  const [emails, setEmails] = useState<EmailItem[]>(initialEmails);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [emailFilter, setEmailFilter] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStep, setProcessStep] = useState<string>("");
  const [processError, setProcessError] = useState<string | null>(null);

  // Map of emailId -> processed trace result
  const [processedTraces, setProcessedTraces] = useState<Record<string, ProcessTrace>>({});

  // Status of action taken per email: 'none' | 'sent' | 'rejected'
  const [emailActions, setEmailActions] = useState<
    Record<
      string,
      {
        status: "sent" | "rejected";
        timestamp: string;
        editedBody?: string;
        rejectReason?: string;
      }
    >
  >({});

  // Draft editing state
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");

  // Escalation confirmation modal
  const [showEscalationModal, setShowEscalationModal] = useState(false);

  // Reject modal
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReasonInput, setRejectReasonInput] = useState("");

  // Source guidance drawer
  const [activeSourceChunk, setActiveSourceChunk] = useState<RetrievedChunk | null>(null);

  // "How this was produced" collapsible trace
  const [showTraceDetails, setShowTraceDetails] = useState(false);

  // Custom email paste drawer/toggle
  const [showCustomEmailForm, setShowCustomEmailForm] = useState(false);
  const [customFromName, setCustomFromName] = useState("");
  const [customFromEmail, setCustomFromEmail] = useState("");
  const [customCompany, setCustomCompany] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");

  // Load emails from API if not pre-populated
  useEffect(() => {
    if (emails.length === 0) {
      fetch("/api/emails")
        .then((res) => res.json())
        .then((data) => {
          if (data.emails && data.emails.length > 0) {
            setEmails(data.emails);
            setSelectedEmail(data.emails[0]);
          }
        })
        .catch((err) => console.error("Failed to load emails:", err));
    } else if (!selectedEmail && emails.length > 0) {
      setSelectedEmail(emails[0]);
    }
  }, [emails, selectedEmail]);

  // Synchronize draft editor whenever selected email's trace changes
  useEffect(() => {
    if (selectedEmail && processedTraces[selectedEmail.id]) {
      const trace = processedTraces[selectedEmail.id];
      const action = emailActions[selectedEmail.id];
      setDraftSubject(trace.draft.subject);
      setDraftBody(action?.editedBody || trace.draft.body);
    } else {
      setDraftSubject("");
      setDraftBody("");
    }
    setIsEditingDraft(false);
    setProcessError(null);
  }, [selectedEmail, processedTraces, emailActions]);

  // Handle running classification & draft pipeline
  const handleProcessEmail = async (emailToProcess?: EmailItem) => {
    const target = emailToProcess || selectedEmail;
    if (!target) return;

    setIsProcessing(true);
    setProcessError(null);

    try {
      setProcessStep("Classifying topic, urgency, and routing team...");
      await new Promise((r) => setTimeout(r, 200));

      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: target.subject,
          body: target.body,
          sender: `${target.fromName} <${target.fromEmail}>`,
        }),
      });

      setProcessStep("Retrieving guidance & evaluating escalation rules...");
      const data: ProcessResponse = await res.json();

      if (!data.success || !data.trace) {
        throw new Error(data.error || "Failed to process email");
      }

      setProcessStep("Validating citations and formatting draft reply...");
      await new Promise((r) => setTimeout(r, 150));

      setProcessedTraces((prev) => ({
        ...prev,
        [target.id]: data.trace!,
      }));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setProcessError(msg);
    } finally {
      setIsProcessing(false);
      setProcessStep("");
    }
  };

  // Quick Preset Buttons
  const handleQuickPreset = (presetId: string) => {
    const found = emails.find((e) => e.id === presetId);
    if (found) {
      setSelectedEmail(found);
      setShowCustomEmailForm(false);
      // If not processed yet, optionally auto-process or let user click
    }
  };

  // Create custom email
  const handleCreateCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSubject.trim() || !customBody.trim()) return;

    const newId = `custom-${Date.now()}`;
    const newEmail: EmailItem = {
      id: newId,
      fromName: customFromName.trim() || "Guest Client",
      fromEmail: customFromEmail.trim() || "client@customdomain.in",
      company: customCompany.trim() || "Custom Client Org",
      subject: customSubject.trim(),
      body: customBody.trim(),
      receivedAt: new Date().toISOString(),
    };

    setEmails((prev) => [newEmail, ...prev]);
    setSelectedEmail(newEmail);
    setShowCustomEmailForm(false);
    // Reset form
    setCustomFromName("");
    setCustomFromEmail("");
    setCustomCompany("");
    setCustomSubject("");
    setCustomBody("");
  };

  // Human Approval Action: Send (Simulated)
  const handleApproveSend = () => {
    if (!selectedEmail) return;
    const currentTrace = processedTraces[selectedEmail.id];

    // If escalated, require extra confirmation step
    if (currentTrace?.isEscalated && !showEscalationModal) {
      setShowEscalationModal(true);
      return;
    }

    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    setEmailActions((prev) => ({
      ...prev,
      [selectedEmail.id]: {
        status: "sent",
        timestamp,
        editedBody: draftBody,
      },
    }));

    setShowEscalationModal(false);
    setIsEditingDraft(false);
  };

  // Reject Action
  const handleConfirmReject = () => {
    if (!selectedEmail) return;
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    setEmailActions((prev) => ({
      ...prev,
      [selectedEmail.id]: {
        status: "rejected",
        timestamp,
        rejectReason: rejectReasonInput.trim() || "Disapproved by human reviewer",
      },
    }));

    setShowRejectModal(false);
    setRejectReasonInput("");
  };

  const currentTrace = selectedEmail ? processedTraces[selectedEmail.id] : null;
  const currentAction = selectedEmail ? emailActions[selectedEmail.id] : null;

  const filteredEmails = emails.filter((e) => {
    const q = emailFilter.toLowerCase();
    return (
      e.subject.toLowerCase().includes(q) ||
      e.fromName.toLowerCase().includes(q) ||
      e.company.toLowerCase().includes(q) ||
      e.body.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 4 to 5 One-click Quick Example Buttons */}
      <div className="mb-5 bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Sparkles className="w-4 h-4 text-[#2F5D8A]" />
          <span>Quick Test Presets:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleQuickPreset("email-001")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          >
            1. Normal Billing (Invoice)
          </button>
          <button
            onClick={() => handleQuickPreset("email-002")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
          >
            2. Angry / ₹1.8L Refund Demand
          </button>
          <button
            onClick={() => handleQuickPreset("email-003")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
          >
            3. Legal Threat / NDA Breach
          </button>
          <button
            onClick={() => handleQuickPreset("email-004")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors"
          >
            4. Security Data Leak (Critical)
          </button>
          <button
            onClick={() => handleQuickPreset("email-005")}
            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
          >
            5. Vague One-Liner
          </button>
        </div>
      </div>

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Email Inbox List (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
          {/* Top Search & Custom Email Action */}
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter inbox emails..."
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2F5D8A]"
                />
              </div>

              <button
                onClick={() => setShowCustomEmailForm(!showCustomEmailForm)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#2F5D8A] hover:bg-[#24496d] text-white shrink-0 shadow-sm transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Paste Custom</span>
              </button>
            </div>

            {/* Custom Email Form Drawer */}
            {showCustomEmailForm && (
              <form
                onSubmit={handleCreateCustomEmail}
                className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm space-y-2.5 text-xs animate-in fade-in duration-150"
              >
                <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                  <span className="font-semibold text-slate-800">
                    Paste or Type Custom Incoming Email
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCustomEmailForm(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Sender Name (e.g. Ramesh Patel)"
                    value={customFromName}
                    onChange={(e) => setCustomFromName(e.target.value)}
                    className="p-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Company (e.g. Surat Retail)"
                    value={customCompany}
                    onChange={(e) => setCustomCompany(e.target.value)}
                    className="p-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white"
                  />
                </div>

                <input
                  type="text"
                  placeholder="Email Subject Line *"
                  required
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full p-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white"
                />

                <textarea
                  rows={3}
                  placeholder="Email Body Content (test prompt injection, refund demand, vague queries, etc.) *"
                  required
                  value={customBody}
                  onChange={(e) => setCustomBody(e.target.value)}
                  className="w-full p-1.5 border border-slate-200 rounded text-xs bg-slate-50 focus:bg-white"
                />

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCustomEmailForm(false)}
                    className="px-2.5 py-1 text-slate-500 hover:bg-slate-100 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-[#2F5D8A] text-white rounded font-medium hover:bg-[#24496d]"
                  >
                    Add to Inbox
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Email Item Rows */}
          <div className="divide-y divide-slate-100 overflow-y-auto flex-1">
            {filteredEmails.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No incoming emails match filter.
              </div>
            ) : (
              filteredEmails.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                const trace = processedTraces[email.id];
                const action = emailActions[email.id];

                return (
                  <button
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                    }}
                    className={`w-full text-left p-3.5 transition-colors duration-150 flex flex-col gap-1.5 ${
                      isSelected
                        ? "bg-[#2F5D8A]/5 border-l-4 border-l-[#2F5D8A]"
                        : "hover:bg-slate-50/80 border-l-4 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-xs font-semibold truncate ${
                          isSelected ? "text-[#2F5D8A]" : "text-slate-900"
                        }`}
                      >
                        {email.fromName}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(email.receivedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="text-xs text-slate-700 font-medium truncate">
                      {email.subject}
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {email.body}
                    </p>

                    {/* Status Badges after processing */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {trace ? (
                        <>
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {trace.classification.topic}
                          </span>

                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                              trace.classification.urgency === "critical"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : trace.classification.urgency === "high"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {trace.classification.urgency}
                          </span>

                          {trace.isEscalated && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                              <ShieldAlert className="w-2.5 h-2.5" />
                              Escalated
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">
                          Not processed yet
                        </span>
                      )}

                      {/* Mock Action State (Sent / Rejected) */}
                      {action && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ml-auto flex items-center gap-1 ${
                            action.status === "sent"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          <CheckCheck className="w-3 h-3" />
                          {action.status === "sent" ? "Sent (simulated)" : "Rejected"}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Email Detail, Classification & Draft (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedEmail ? (
            <>
              {/* Selected Email Header & Content Card */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                      {selectedEmail.subject}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="font-medium text-slate-700">
                        {selectedEmail.fromName}
                      </span>
                      <span>&lt;{selectedEmail.fromEmail}&gt;</span>
                      <span>•</span>
                      <span>{selectedEmail.company}</span>
                    </div>
                  </div>

                  {/* Primary Trigger: Process Email */}
                  <button
                    onClick={() => handleProcessEmail(selectedEmail)}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-[#2F5D8A] hover:bg-[#24496d] disabled:opacity-60 text-white font-medium text-xs sm:text-sm rounded-lg shadow-sm transition-colors shrink-0"
                  >
                    {isProcessing ? (
                      <>
                        <RotateCw className="w-4 h-4 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 fill-white" />
                        <span>{currentTrace ? "Re-Process Email" : "Process Email"}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Email Body */}
                <div className="mt-4 text-xs sm:text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-sans bg-slate-50/50 p-4 rounded-lg border border-slate-100 max-h-56 overflow-y-auto">
                  {selectedEmail.body}
                </div>

                {/* Processing Step Indicator */}
                {isProcessing && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2.5 text-xs text-blue-800">
                    <RotateCw className="w-4 h-4 animate-spin text-[#2F5D8A]" />
                    <span className="font-medium">{processStep}</span>
                  </div>
                )}

                {/* Error Banner */}
                {processError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-xs text-red-700">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <div>
                      <span className="font-semibold">Processing Error:</span> {processError}
                    </div>
                  </div>
                )}
              </div>

              {/* CLASSIFICATION & ESCALATION RESULTS */}
              {currentTrace && (
                <div className="space-y-4">
                  {/* Classification Card */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-[#2F5D8A]" />
                        AI Classification & Triage
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Model: {currentTrace.groqModel}
                      </span>
                    </div>

                    {/* 3 Metric Cards with Confidence Bars */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Topic */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Classified Topic
                        </span>
                        <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">
                          {currentTrace.classification.topic}
                        </span>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Confidence</span>
                          <span className="font-mono font-semibold">
                            {Math.round(currentTrace.classification.topicConfidence * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-[#2F5D8A] h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.round(
                                currentTrace.classification.topicConfidence * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Urgency */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Urgency Level
                        </span>
                        <span
                          className={`text-xs font-bold block mt-0.5 capitalize ${
                            currentTrace.classification.urgency === "critical"
                              ? "text-rose-600"
                              : currentTrace.classification.urgency === "high"
                              ? "text-amber-600"
                              : "text-slate-800"
                          }`}
                        >
                          {currentTrace.classification.urgency}
                        </span>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Confidence</span>
                          <span className="font-mono font-semibold">
                            {Math.round(currentTrace.classification.urgencyConfidence * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              currentTrace.classification.urgency === "critical"
                                ? "bg-rose-600"
                                : currentTrace.classification.urgency === "high"
                                ? "bg-amber-500"
                                : "bg-[#2F5D8A]"
                            }`}
                            style={{
                              width: `${Math.round(
                                currentTrace.classification.urgencyConfidence * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Team */}
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                          Responsible Team
                        </span>
                        <span className="text-xs font-bold text-slate-800 block mt-0.5 truncate">
                          {currentTrace.classification.team}
                        </span>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Confidence</span>
                          <span className="font-mono font-semibold">
                            {Math.round(currentTrace.classification.teamConfidence * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className="bg-[#2F5D8A] h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.round(
                                currentTrace.classification.teamConfidence * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* One-line Reasoning */}
                    <div className="text-xs text-slate-600 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100 flex items-start gap-2">
                      <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-700">Triage Reason: </span>
                        {currentTrace.classification.reason}
                      </div>
                    </div>

                    {/* ESCALATION BANNER (If Escalated) */}
                    {currentTrace.isEscalated ? (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 space-y-2">
                        <div className="flex items-center gap-2">
                          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                          <span className="font-bold text-sm tracking-tight text-rose-800">
                            ESCALATED TO HUMAN REVIEW
                          </span>
                          <span className="text-[11px] font-medium bg-rose-200/70 text-rose-800 px-2 py-0.5 rounded ml-auto">
                            Requires Confirmation
                          </span>
                        </div>
                        <p className="text-xs text-rose-700">
                          This case triggered code-level escalation rules. Draft reply is locked to a safe holding response with non-promissory guarantees.
                        </p>
                        <div className="mt-2 pt-2 border-t border-rose-200/60">
                          <span className="text-[11px] font-semibold text-rose-800 uppercase block mb-1">
                            Triggered Rules & Matched Keywords:
                          </span>
                          <ul className="space-y-1 text-xs text-rose-700">
                            {currentTrace.escalationRules
                              .filter((r) => r.triggered)
                              .map((r, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span>•</span>
                                  <span>
                                    <strong>{r.name}:</strong> {r.reason}
                                  </span>
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Standard Case:</strong> All confidence scores meet threshold (&ge; 0.70), no sensitive keywords or critical urgency detected.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* RETRIEVED GUIDANCE & CITATIONS */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-[#2F5D8A]" />
                        Retrieved Approved Guidance (Top-3)
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Threshold: {currentTrace.similarityThreshold}
                      </span>
                    </div>

                    <div className="space-y-2">
                      {currentTrace.retrievedChunks.map((chunk, idx) => {
                        const isAbove = chunk.meetsThreshold;
                        return (
                          <div
                            key={chunk.chunkId}
                            className={`p-3 rounded-lg border text-xs transition-colors ${
                              isAbove
                                ? "bg-slate-50 border-slate-200"
                                : "bg-amber-50/50 border-amber-200 text-amber-900"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800 truncate">
                                  #{idx + 1} {chunk.docTitle}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.2 rounded">
                                  {chunk.section}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded ${
                                    isAbove
                                      ? "bg-emerald-100 text-emerald-800"
                                      : "bg-amber-100 text-amber-800"
                                  }`}
                                >
                                  Score: {chunk.similarityScore.toFixed(3)}
                                </span>
                                <button
                                  onClick={() =>
                                    setActiveSourceChunk(
                                      activeSourceChunk?.chunkId === chunk.chunkId ? null : chunk
                                    )
                                  }
                                  className="text-[11px] text-[#2F5D8A] hover:underline font-medium flex items-center gap-0.5"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Source</span>
                                </button>
                              </div>
                            </div>

                            {/* Text snippet */}
                            <p className="mt-1 text-slate-600 line-clamp-2">
                              {chunk.text.replace(/^Document:.*\nTopic:.*\nOwner:.*\n\n/, "")}
                            </p>

                            {/* Full Source Drawer when expanded */}
                            {activeSourceChunk?.chunkId === chunk.chunkId && (
                              <div className="mt-2.5 p-3 bg-white rounded border border-slate-200 text-slate-700 whitespace-pre-wrap font-sans text-xs">
                                <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-100 font-semibold text-slate-800">
                                  <span>{chunk.chunkId}</span>
                                  <button
                                    onClick={() => setActiveSourceChunk(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                  >
                                    ✕
                                  </button>
                                </div>
                                {chunk.text}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Citations Used by the Draft */}
                    {currentTrace.draft.usedGuidance.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1.5">
                          Verified Inline Citations ({currentTrace.draft.usedGuidance.length}):
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {currentTrace.draft.usedGuidance.map((cite, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full"
                              title={`Quote: "${cite.quote}"`}
                            >
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span className="font-mono">{cite.chunkId}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* DRAFT REPLY & HUMAN APPROVAL CONTROLS */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                          <Mail className="w-4 h-4 text-[#2F5D8A]" />
                          Draft Reply
                        </span>
                        <span className="text-xs text-slate-400 block mt-0.5">
                          Human-in-the-loop: Nothing is ever sent automatically without manual approval.
                        </span>
                      </div>

                      {/* Mock Sent / Rejected confirmation badge */}
                      {currentAction && (
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                            currentAction.status === "sent"
                              ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                              : "bg-rose-100 text-rose-800 border border-rose-300"
                          }`}
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          {currentAction.status === "sent"
                            ? `Sent (simulated) at ${currentAction.timestamp}`
                            : `Rejected at ${currentAction.timestamp}`}
                        </span>
                      )}
                    </div>

                    {/* Reviewer Note (Mandatory on Escalation) */}
                    {currentTrace.draft.reviewerNote && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 space-y-1">
                        <span className="font-bold flex items-center gap-1 text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Note to Human Reviewer:
                        </span>
                        <p>{currentTrace.draft.reviewerNote}</p>
                      </div>
                    )}

                    {/* Subject Line */}
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                        Subject Line
                      </label>
                      <input
                        type="text"
                        value={draftSubject}
                        onChange={(e) => setDraftSubject(e.target.value)}
                        disabled={!isEditingDraft}
                        className={`w-full text-xs font-medium px-3 py-1.5 rounded-lg border ${
                          isEditingDraft
                            ? "bg-white border-[#2F5D8A] ring-1 ring-[#2F5D8A]"
                            : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    {/* Reply Textarea */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase">
                          Response Body
                        </label>
                        <span className="text-[11px] text-slate-400">
                          {isEditingDraft ? "Editing mode active" : "Read-only preview"}
                        </span>
                      </div>
                      <textarea
                        rows={7}
                        value={draftBody}
                        onChange={(e) => setDraftBody(e.target.value)}
                        disabled={!isEditingDraft}
                        className={`w-full text-xs sm:text-sm p-3.5 rounded-lg border font-sans leading-relaxed ${
                          isEditingDraft
                            ? "bg-white border-[#2F5D8A] ring-1 ring-[#2F5D8A] text-slate-900"
                            : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    {/* Action Buttons: Approve & Send, Edit, Reject */}
                    <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsEditingDraft(!isEditingDraft)}
                          className={`flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                            isEditingDraft
                              ? "bg-slate-800 text-white border-slate-800"
                              : "bg-white hover:bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>{isEditingDraft ? "Done Editing" : "Edit Draft"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowRejectModal(true)}
                          className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white hover:bg-rose-50 text-rose-700 border border-slate-200 hover:border-rose-300 transition-colors"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleApproveSend}
                        className={`flex items-center justify-center gap-2 px-5 py-2 text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors text-white ${
                          currentTrace.isEscalated
                            ? "bg-amber-600 hover:bg-amber-700"
                            : "bg-emerald-600 hover:bg-emerald-700"
                        }`}
                      >
                        <Send className="w-4 h-4 fill-white" />
                        <span>
                          {currentTrace.isEscalated
                            ? "Review & Approve Escalation"
                            : "Approve & Send (Mock)"}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* COLLAPSIBLE: "How this was produced" (Processing Trace) */}
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setShowTraceDetails(!showTraceDetails)}
                      className="w-full px-5 py-3.5 bg-slate-50/70 hover:bg-slate-100/70 flex items-center justify-between text-left text-xs font-bold text-slate-700 uppercase tracking-wider transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-[#2F5D8A]" />
                        <span>How this was produced (Processing Trace)</span>
                      </div>
                      {showTraceDetails ? (
                        <ChevronUp className="w-4 h-4 text-slate-500" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-500" />
                      )}
                    </button>

                    {showTraceDetails && (
                      <div className="p-5 border-t border-slate-200 space-y-4 text-xs font-mono text-slate-700">
                        {/* Timings row */}
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                          <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 block font-sans">
                              Classify
                            </span>
                            <span className="font-semibold">
                              {currentTrace.timings.classifyMs}ms
                            </span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 block font-sans">
                              Embed
                            </span>
                            <span className="font-semibold">
                              {currentTrace.timings.embedMs}ms
                            </span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 block font-sans">
                              Retrieve
                            </span>
                            <span className="font-semibold">
                              {currentTrace.timings.retrieveMs}ms
                            </span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 block font-sans">
                              Draft
                            </span>
                            <span className="font-semibold">
                              {currentTrace.timings.draftMs}ms
                            </span>
                          </div>
                          <div className="p-2 bg-slate-50 rounded border border-slate-200">
                            <span className="text-[10px] text-slate-400 block font-sans">
                              Validate
                            </span>
                            <span className="font-semibold">
                              {currentTrace.timings.validateMs}ms
                            </span>
                          </div>
                          <div className="p-2 bg-[#2F5D8A]/10 rounded border border-[#2F5D8A]/20">
                            <span className="text-[10px] text-[#2F5D8A] block font-sans font-bold">
                              Total Pipeline
                            </span>
                            <span className="font-bold text-[#2F5D8A]">
                              {currentTrace.timings.totalMs}ms
                            </span>
                          </div>
                        </div>

                        {/* Similarity Scores vs Threshold Marker */}
                        <div className="space-y-2 pt-2 border-t border-slate-100 font-sans">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">
                              Guidance Similarity Scores vs Threshold Marker (
                              {currentTrace.similarityThreshold}):
                            </span>
                          </div>

                          {currentTrace.retrievedChunks.map((chunk) => (
                            <div key={chunk.chunkId} className="space-y-1">
                              <div className="flex items-center justify-between text-[11px] text-slate-600">
                                <span className="truncate max-w-[280px]">
                                  {chunk.docTitle} ({chunk.chunkId})
                                </span>
                                <span className="font-mono font-semibold">
                                  {chunk.similarityScore.toFixed(3)}
                                </span>
                              </div>
                              <div className="relative w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                {/* Threshold marker at 65% */}
                                <div
                                  className="absolute top-0 bottom-0 w-0.5 bg-rose-500 z-10"
                                  style={{
                                    left: `${currentTrace.similarityThreshold * 100}%`,
                                  }}
                                  title="Threshold Marker (0.65)"
                                />
                                <div
                                  className={`h-full rounded-full ${
                                    chunk.meetsThreshold
                                      ? "bg-[#2F5D8A]"
                                      : "bg-amber-400"
                                  }`}
                                  style={{
                                    width: `${Math.min(
                                      100,
                                      Math.round(chunk.similarityScore * 100)
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Rules Evaluated by Code */}
                        <div className="pt-2 border-t border-slate-100 font-sans">
                          <span className="text-[11px] font-semibold text-slate-500 uppercase block mb-1">
                            Deterministic Code Escalation Evaluation:
                          </span>
                          <div className="space-y-1.5 text-xs">
                            {currentTrace.escalationRules.map((rule) => (
                              <div
                                key={rule.ruleId}
                                className={`p-2 rounded flex items-center justify-between border ${
                                  rule.triggered
                                    ? "bg-rose-50 border-rose-200 text-rose-800"
                                    : "bg-slate-50 border-slate-200 text-slate-600"
                                }`}
                              >
                                <div>
                                  <span className="font-semibold">{rule.name}</span>
                                  <span className="block text-[11px] text-slate-500">
                                    {rule.reason}
                                  </span>
                                </div>
                                <span
                                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                                    rule.triggered
                                      ? "bg-rose-200 text-rose-900"
                                      : "bg-slate-200 text-slate-700"
                                  }`}
                                >
                                  {rule.triggered ? "TRIGGERED" : "PASS"}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 flex flex-col items-center gap-3">
              <Inbox className="w-10 h-10 text-slate-300" />
              <p className="text-sm font-medium">Select an email on the left to review and triage.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Escalation Confirmation Step */}
      {showEscalationModal && selectedEmail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-slate-900">
                Confirm Approval of Escalated Case
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              This client email was flagged by deterministic escalation rules. Approving will send the holding response to the client. Please confirm that you have inspected the account and verified that no unauthorized financial or legal commitments are made.
            </p>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 space-y-1">
              <span className="font-semibold block">Active Escalation Rules:</span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                {currentTrace?.escalationRules
                  .filter((r) => r.triggered)
                  .map((r, i) => (
                    <li key={i}>{r.reason}</li>
                  ))}
              </ul>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEscalationModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApproveSend}
                className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold shadow-sm"
              >
                Confirm & Approve Escalated Reply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Reject Reason */}
      {showRejectModal && selectedEmail && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-rose-600">
              <XCircle className="w-5 h-5" />
              <h3 className="text-base font-bold text-slate-900">
                Reject Draft Response
              </h3>
            </div>

            <p className="text-xs text-slate-600">
              Provide an optional internal rejection reason for the audit trail:
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Requires verbal phone consultation with client before replying..."
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5D8A]"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg border border-slate-200 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-semibold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
