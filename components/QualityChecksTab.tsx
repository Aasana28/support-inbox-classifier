"use client";

import React, { useState } from "react";
import {
  QUALITY_TEST_CASES,
  QualityTestCase,
  QualityCheckResult,
} from "@/lib/quality-checks";
import { ProcessResponse, ProcessTrace } from "@/lib/types";
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCw,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  ExternalLink,
  Info,
} from "lucide-react";

export function QualityChecksTab() {
  const [results, setResults] = useState<Record<string, QualityCheckResult>>({});
  const [runningIds, setRunningIds] = useState<Set<string>>(new Set());
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "passed" | "failed">("all");
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);

  const runSingleTest = async (testCase: QualityTestCase): Promise<QualityCheckResult> => {
    setRunningIds((prev) => new Set(prev).add(testCase.id));
    const start = Date.now();

    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: testCase.email.subject,
          body: testCase.email.body,
          sender: testCase.email.fromName,
        }),
      });

      const data: ProcessResponse = await res.json();
      const durationMs = Date.now() - start;

      if (!data.success || !data.trace) {
        const failResult: QualityCheckResult = {
          testId: testCase.id,
          name: testCase.name,
          passed: false,
          actualSummary: `API Error: ${data.error || "Unknown error"}`,
          expectedSummary: formatExpected(testCase),
          error: data.error,
          durationMs,
        };
        setResults((prev) => ({ ...prev, [testCase.id]: failResult }));
        return failResult;
      }

      const trace = data.trace;
      let passed = true;
      const actualTokens: string[] = [];
      const expectedTokens: string[] = [];

      // Check Team
      if (testCase.expected.team) {
        expectedTokens.push(`Team: ${testCase.expected.team}`);
        actualTokens.push(`Team: ${trace.classification.team}`);
        if (trace.classification.team !== testCase.expected.team) {
          passed = false;
        }
      }

      // Check Topic
      if (testCase.expected.topic) {
        expectedTokens.push(`Topic: ${testCase.expected.topic}`);
        actualTokens.push(`Topic: ${trace.classification.topic}`);
        if (trace.classification.topic !== testCase.expected.topic) {
          passed = false;
        }
      }

      // Check Urgency
      if (testCase.expected.urgency) {
        expectedTokens.push(`Urgency: ${testCase.expected.urgency}`);
        actualTokens.push(`Urgency: ${trace.classification.urgency}`);
        if (trace.classification.urgency !== testCase.expected.urgency) {
          passed = false;
        }
      }

      // Check Escalation
      if (testCase.expected.isEscalated !== undefined) {
        expectedTokens.push(`Escalated: ${testCase.expected.isEscalated}`);
        actualTokens.push(`Escalated: ${trace.isEscalated}`);
        if (trace.isEscalated !== testCase.expected.isEscalated) {
          passed = false;
        }
      }

      // Check Forbidden phrases in draft
      if (testCase.expected.forbiddenInDraft) {
        const draftLower = trace.draft.body.toLowerCase();
        for (const forbidden of testCase.expected.forbiddenInDraft) {
          if (draftLower.includes(forbidden.toLowerCase())) {
            passed = false;
            actualTokens.push(`Contained forbidden phrase: "${forbidden}"`);
          }
        }
      }

      // Custom check
      if (testCase.expected.customCheck) {
        const custom = testCase.expected.customCheck(trace);
        if (!custom.pass) {
          passed = false;
          actualTokens.push(custom.reason);
        } else {
          actualTokens.push(custom.reason);
        }
      }

      const testResult: QualityCheckResult = {
        testId: testCase.id,
        name: testCase.name,
        passed,
        actualSummary: actualTokens.join(" • ") || "Passed",
        expectedSummary: expectedTokens.join(" • ") || "Criteria met",
        trace,
        durationMs,
      };

      setResults((prev) => ({ ...prev, [testCase.id]: testResult }));
      return testResult;
    } catch (err: unknown) {
      const durationMs = Date.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      const errResult: QualityCheckResult = {
        testId: testCase.id,
        name: testCase.name,
        passed: false,
        actualSummary: `Request failed: ${message}`,
        expectedSummary: formatExpected(testCase),
        error: message,
        durationMs,
      };
      setResults((prev) => ({ ...prev, [testCase.id]: errResult }));
      return errResult;
    } finally {
      setRunningIds((prev) => {
        const next = new Set(prev);
        next.delete(testCase.id);
        return next;
      });
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    for (const testCase of QUALITY_TEST_CASES) {
      await runSingleTest(testCase);
      // Small pause between live requests to respect API rate limits
      await new Promise((r) => setTimeout(r, 300));
    }
    setIsRunningAll(false);
  };

  function formatExpected(tc: QualityTestCase): string {
    const parts: string[] = [];
    if (tc.expected.team) parts.push(`Team: ${tc.expected.team}`);
    if (tc.expected.topic) parts.push(`Topic: ${tc.expected.topic}`);
    if (tc.expected.urgency) parts.push(`Urgency: ${tc.expected.urgency}`);
    if (tc.expected.isEscalated !== undefined)
      parts.push(`Escalated: ${tc.expected.isEscalated ? "Yes" : "No"}`);
    return parts.join(" • ");
  }

  const executedCount = Object.keys(results).length;
  const passedCount = Object.values(results).filter((r) => r.passed).length;
  const failedCount = Object.values(results).filter((r) => !r.passed).length;

  const filteredTests = QUALITY_TEST_CASES.filter((tc) => {
    const res = results[tc.id];
    if (activeFilter === "all") return true;
    if (activeFilter === "passed") return res && res.passed;
    if (activeFilter === "failed") return res && !res.passed;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header and Controls */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#2F5D8A]" />
            Live Quality Checks & Verification Suite
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            16 live integration tests testing prompt-injection safety, classification accuracy, escalation triggers, and citation validation.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunAll}
            disabled={isRunningAll}
            className="flex items-center gap-2 px-4 py-2 bg-[#2F5D8A] hover:bg-[#24496d] disabled:opacity-60 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            {isRunningAll ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>Running Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run All 16 Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Total Test Cases</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {QUALITY_TEST_CASES.length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Executed</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {executedCount} / {QUALITY_TEST_CASES.length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Passed</span>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {passedCount}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs text-slate-500 font-medium">Failed</span>
          <p className={`text-2xl font-bold mt-1 ${failedCount > 0 ? "text-rose-600" : "text-slate-400"}`}>
            {failedCount}
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveFilter("all")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeFilter === "all"
              ? "bg-slate-900 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          All ({QUALITY_TEST_CASES.length})
        </button>
        <button
          onClick={() => setActiveFilter("passed")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeFilter === "passed"
              ? "bg-emerald-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Passed ({passedCount})
        </button>
        <button
          onClick={() => setActiveFilter("failed")}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            activeFilter === "failed"
              ? "bg-rose-600 text-white"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          Failed ({failedCount})
        </button>
      </div>

      {/* Test Cases Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-200">
          {filteredTests.map((testCase, idx) => {
            const result = results[testCase.id];
            const isRunning = runningIds.has(testCase.id);
            const isExpanded = expandedTraceId === testCase.id;

            return (
              <div key={testCase.id} className="p-4 sm:p-5 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Test Info */}
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded shrink-0 mt-0.5">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-900">
                          {testCase.name}
                        </h3>
                        {result && (
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                              result.passed
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : "bg-rose-50 text-rose-700 border border-rose-200"
                            }`}
                          >
                            {result.passed ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Passed
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Failed
                              </>
                            )}
                          </span>
                        )}
                        {isRunning && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            <RotateCw className="w-3 h-3 animate-spin" />
                            Running...
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {testCase.description}
                      </p>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {result && (
                      <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {result.durationMs}ms
                      </span>
                    )}

                    <button
                      onClick={() => runSingleTest(testCase)}
                      disabled={isRunning || isRunningAll}
                      className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-md transition-colors"
                    >
                      {isRunning ? "Running..." : "Run Test"}
                    </button>

                    {result?.trace && (
                      <button
                        onClick={() =>
                          setExpandedTraceId(isExpanded ? null : testCase.id)
                        }
                        className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-900 rounded-md border border-slate-200"
                        title="Toggle full trace inspection"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Email Subject / Snippet Preview */}
                <div className="mt-3 p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-100 font-mono">
                  <span className="text-slate-400 font-sans font-semibold mr-1">
                    Input Email:
                  </span>
                  &quot;{testCase.email.subject}&quot; — {testCase.email.body.slice(0, 110)}...
                </div>

                {/* Comparison Row when executed */}
                {result && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                        Expected Condition
                      </span>
                      <span className="font-medium text-slate-700">
                        {result.expectedSummary}
                      </span>
                    </div>

                    <div
                      className={`p-2.5 rounded border ${
                        result.passed
                          ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                          : "bg-rose-50/50 border-rose-200 text-rose-900"
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-slate-400 uppercase block">
                        Actual Result
                      </span>
                      <span className="font-medium">
                        {result.actualSummary}
                      </span>
                    </div>
                  </div>
                )}

                {/* Expanded Full Trace Drawer */}
                {isExpanded && result?.trace && (
                  <div className="mt-4 p-4 bg-slate-900 text-slate-100 rounded-lg text-xs font-mono space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400 font-sans font-semibold">
                        System Trace Inspection ({result.trace.groqModel})
                      </span>
                      <span className="text-slate-400">
                        Total: {result.trace.timings.totalMs}ms
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Classified Topic</span>
                        <span className="text-emerald-400 font-semibold">
                          {result.trace.classification.topic} (
                          {Math.round(result.trace.classification.topicConfidence * 100)}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Assigned Team</span>
                        <span className="text-blue-400 font-semibold">
                          {result.trace.classification.team} (
                          {Math.round(result.trace.classification.teamConfidence * 100)}%)
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Urgency</span>
                        <span
                          className={`font-semibold ${
                            result.trace.classification.urgency === "critical"
                              ? "text-rose-400"
                              : "text-amber-400"
                          }`}
                        >
                          {result.trace.classification.urgency}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Escalation Status</span>
                        <span
                          className={`font-semibold ${
                            result.trace.isEscalated
                              ? "text-rose-400"
                              : "text-emerald-400"
                          }`}
                        >
                          {result.trace.isEscalated ? "ESCALATED" : "Standard"}
                        </span>
                      </div>
                    </div>

                    {/* Triggered Rules */}
                    {result.trace.escalationRules.filter((r) => r.triggered).length > 0 && (
                      <div className="pt-2 border-t border-slate-800">
                        <span className="text-slate-400 block mb-1">
                          Triggered Code Escalation Rules:
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-rose-300">
                          {result.trace.escalationRules
                            .filter((r) => r.triggered)
                            .map((r, i) => (
                              <li key={i}>
                                <strong>{r.name}:</strong> {r.reason}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {/* Draft Reply Snippet */}
                    <div className="pt-2 border-t border-slate-800">
                      <span className="text-slate-400 block mb-1">Generated Draft Reply:</span>
                      <div className="bg-slate-950 p-3 rounded text-slate-300 whitespace-pre-wrap font-sans text-xs max-h-36 overflow-y-auto">
                        {result.trace.draft.body}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
