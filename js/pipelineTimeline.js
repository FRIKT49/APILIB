/**
 * API Library - pipelineTimeline.js
 * GSAP ScrollTrigger & Interactive Stage Controller for the 3D Protocol Pipeline
 * Non-AI telemetry aesthetic, sharp 2-4px radius, transparent glass styling, zero emojis.
 */

import { initPipelineCanvas } from "./pipelineCanvas.js";

// Full Technical Data for the 4 Architecture Stages
export const PIPELINE_STAGES = [
  {
    id: 0,
    number: "01",
    shortName: "INGRESS",
    tag: "01 // INGRESS & CLIENT REQUEST",
    title: "Ingress & Client Request",
    subtitle: "JSON payload, query params, auth bearer token",
    desc: "Direct protocol entrypoint accepting REST, GraphQL, and streaming RPC. Headers and payloads are normalized to standard OAS 3.1 representations.",
    telemetry: [
      { label: "METHOD", value: "POST /v1/query" },
      { label: "PAYLOAD", value: "3.8 KB" },
      { label: "AUTH", value: "BEARER JWT" },
      { label: "INGRESS", value: "2,420 REQ/S" }
    ],
    schemaCode: `{
  "openapi": "3.1.0",
  "info": { "title": "Ingress API", "version": "1.0.0" },
  "paths": {
    "/v1/query": {
      "post": {
        "summary": "Dispatch execution query",
        "security": [{ "bearerAuth": [] }],
        "requestBody": {
          "required": true,
          "content": {
            "application/json": {
              "schema": { "$ref": "#/components/schemas/QueryRequest" }
            }
          }
        }
      }
    }
  }
}`,
    clientCode: `// Stage 01: Client Ingress Request
const response = await fetch("https://api.apilib.dev/v1/query", {
  method: "POST",
  headers: {
    "Authorization": "Bearer eyJhbGciOi...",
    "Content-Type": "application/json",
    "X-Client-Protocol": "oas-3.1"
  },
  body: JSON.stringify({ query: "agent.runtime.status", stream: true })
});
const stream = response.body.getReader();`,
    liveStats: {
      rate: "2,420 req/s",
      latency: "2.1ms",
      status: "200 OK",
      packetLoss: "0.00%",
      p99: "4.8ms"
    },
    paramsConfig: {
      endpoint: "/v1/query",
      method: "POST",
      auth: "Bearer eyJhbGciOiJKV1QiLC...",
      query: "agent.runtime.status",
      stream: true,
      actionLabel: "Execute Ingress Request"
    }
  },
  {
    id: 1,
    number: "02",
    shortName: "GATEWAY",
    tag: "02 // SCHEMA VALIDATION & PROTOCOL GATEWAY",
    title: "Schema Validation & Protocol Gateway",
    subtitle: "Strict OpenAPI 3.1 schema compliance, rate-limiting, CORS",
    desc: "Runtime contract verification against precompiled JSON Schema AST. Automated token bucket throttling and edge perimeter security.",
    telemetry: [
      { label: "OAS SPEC", value: "3.1.0 VALID" },
      { label: "BURST LIMIT", value: "250 RPS" },
      { label: "CORS", value: "PREFLIGHT PASS" },
      { label: "AST COMPILE", value: "0.84ms" }
    ],
    schemaCode: `{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "ValidationGate",
  "type": "object",
  "required": ["query", "stream"],
  "properties": {
    "query": { "type": "string", "minLength": 3, "maxLength": 1024 },
    "stream": { "type": "boolean" },
    "filters": { "type": "array", "items": { "type": "string" } }
  },
  "additionalProperties": false
}`,
    clientCode: `// Stage 02: Edge Gateway AST Validation
import { createValidator } from "@apilib/gateway";

const validator = createValidator(openApiSpec);
const { valid, errors } = validator.verify(request.body);

if (!valid) {
  throw new GatewayError({ status: 422, details: errors });
}
// Rate limit token bucket check: PASS`,
    liveStats: {
      rate: "2,380 req/s",
      latency: "0.84ms",
      status: "VALIDATED",
      packetLoss: "0.00%",
      p99: "1.2ms"
    },
    paramsConfig: {
      burstLimit: "250 RPS",
      strictAst: true,
      cors: "ORIGIN: *",
      testPayload: '{"query": "agent.runtime.status", "stream": true}',
      actionLabel: "Verify AST Schema"
    }
  },
  {
    id: 2,
    number: "03",
    shortName: "COMPILER",
    tag: "03 // TYPE-SAFE SDK & CODE COMPILATION",
    title: "Type-Safe SDK & Code Compilation",
    subtitle: "Dynamic TypeScript / Python bindings generation",
    desc: "Zero-overhead typed client compilation. Generates strongly typed parameter models, response envelopes, and error hierarchies on the fly.",
    telemetry: [
      { label: "TYPESCRIPT", value: "STRICT (v5.5)" },
      { label: "PYTHON", value: "PYDANTIC V2" },
      { label: "COMPILER", value: "WASM FAST-PATH" },
      { label: "ZERO-ANY", value: "ENFORCED" }
    ],
    schemaCode: `// Stage 03: Generated Type-Safe Contract
export interface QueryRequest {
  query: string;
  stream: boolean;
  filters?: readonly string[];
}

export type QueryResponse<T = Record<string, unknown>> = {
  readonly id: string;
  readonly status: "completed" | "processing";
  readonly latencyMs: number;
  readonly payload: T;
};`,
    clientCode: `# Stage 03: Python Pydantic V2 Bindings
from pydantic import BaseModel, Field

class QueryRequest(BaseModel):
    query: str = Field(min_length=3, max_length=1024)
    stream: bool = True
    filters: list[str] = Field(default_factory=list)

class QueryResponse(BaseModel):
    id: str
    status: str
    payload: dict`,
    liveStats: {
      rate: "1,850 builds/s",
      latency: "3.2ms",
      status: "COMPILED",
      packetLoss: "0.00%",
      p99: "5.1ms"
    },
    paramsConfig: {
      targetLang: "TypeScript",
      compilerMode: "Strict (Zero Any)",
      wasmOptimizer: true,
      actionLabel: "Compile Typed SDK"
    }
  },
  {
    id: 3,
    number: "04",
    shortName: "AGENT RUNTIME",
    tag: "04 // MULTI-AGENT RUNTIME & DISPATCH",
    title: "Multi-Agent Runtime & Dispatch",
    subtitle: "Claude Code, OpenAI function tools, MCP protocol dispatch",
    desc: "Dynamic execution bridge exposing declarative tools to LLM orchestrators and autonomous agents with streaming tool call telemetry.",
    telemetry: [
      { label: "MCP PROTOCOL", value: "RFC-2024.1" },
      { label: "TOOL DISPATCH", value: "< 8ms" },
      { label: "RUNTIMES", value: "CLAUDE / OPENAI" },
      { label: "STREAM", value: "BIDIRECTIONAL" }
    ],
    schemaCode: `{
  "name": "apilib_dispatch_tool",
  "description": "Expose catalog endpoint directly as an autonomous agent tool",
  "inputSchema": {
    "type": "object",
    "properties": {
      "serviceId": { "type": "string" },
      "operation": { "type": "string" },
      "parameters": { "type": "object" }
    },
    "required": ["serviceId", "operation"]
  }
}`,
    clientCode: `// Stage 04: MCP Protocol Execution Handler
export async function executeAgentTool(call: McpToolCall) {
  const result = await agentRuntime.dispatch({
    protocol: "mcp-v1",
    tool: call.name,
    args: call.arguments,
    context: { streamTelemetry: true }
  });
  return { content: [{ type: "text", text: JSON.stringify(result) }] };
}`,
    liveStats: {
      rate: "48 tools/s",
      latency: "7.6ms",
      status: "DISPATCHED",
      packetLoss: "0.00%",
      p99: "9.4ms"
    },
    paramsConfig: {
      runtime: "Claude Code",
      mcpVersion: "RFC-2024.1",
      toolId: "apilib_dispatch_tool",
      streaming: true,
      actionLabel: "Dispatch Agent Tool"
    }
  }
];

export class PipelineTimelineController {
  constructor() {
    this.canvasInstance = null;
    this.scrollTrigger = null;
    this.currentStageIndex = 0;
    this.previewStageIndex = null;
    this.activeInspectorTab = "schema"; // "schema" | "client" | "params" | "telemetry"
    this.packetCounter = 10480;
    this.packetLogs = [];

    // Editable parameter test states for each stage
    this.paramStates = [
      { endpoint: "/v1/query", method: "POST", auth: "Bearer jwt_prod_live_8a72", query: "agent.runtime.status", stream: true },
      { burstRps: "250", strictAst: true, corsPass: true, payloadBody: '{"query": "agent.runtime.status", "stream": true}' },
      { targetLang: "ts", strictTypes: true, wasmFastPath: true },
      { agentRuntime: "claude", mcpProtocol: "RFC-2024.1", toolName: "apilib_dispatch_tool", streamEvents: true }
    ];

    this.paramOutputs = [
      "Ready to dispatch query to edge ingress.",
      "Schema AST loaded. Ready to validate test payload.",
      "TypeScript compiler ready. Strict mode enabled.",
      "MCP protocol agent bridge ready for tool execution."
    ];

    this.init();
  }

  init() {
    // 1. Initialize Three.js WebGL 3D Canvas
    this.canvasInstance = initPipelineCanvas("pipelineCanvas");

    // 2. Setup GSAP ScrollTrigger
    this.setupScrollTrigger();

    // 3. Bind UI interactions (clicks, tabs, buttons, hover)
    this.bindUIEvents();

    // 4. Render initial Stage 0 state
    this.renderStage(0);
  }

  setupScrollTrigger() {
    const gsap = window.gsap;
    const ScrollTrigger = window.ScrollTrigger;

    if (!gsap || !ScrollTrigger) {
      console.warn("[PipelineTimeline] GSAP or ScrollTrigger not found globally.");
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const targetSection = document.getElementById("about");
    if (!targetSection) return;

    // Pin `#about` for smooth 2400px scrub distance
    this.scrollTrigger = ScrollTrigger.create({
      trigger: targetSection,
      start: "top top",
      end: "+=2400",
      pin: true,
      scrub: 0.6,
      anticipatePin: 1,
      onUpdate: (self) => {
        const progress = self.progress;

        // Pass progress to 3D canvas for smooth camera glide
        if (this.canvasInstance) {
          this.canvasInstance.setScrollProgress(progress);
        }

        // Update top scrub bar width
        const scrubFill = document.getElementById("pipelineScrubFill");
        if (scrubFill) {
          scrubFill.style.width = `${(progress * 100).toFixed(1)}%`;
        }

        // Determine active stage: 0..3
        const stageIdx = Math.min(3, Math.floor(progress * 4));
        if (stageIdx !== this.currentStageIndex && this.previewStageIndex === null) {
          this.renderStage(stageIdx);
        }
      }
    });
  }

  renderStage(index) {
    this.currentStageIndex = index;
    const stage = PIPELINE_STAGES[index];
    if (!stage) return;

    // Update 3D canvas active stage node
    if (this.canvasInstance) {
      this.canvasInstance.setActiveStage(index);
    }

    // Update Scrubber Step Indicators
    const stepBtns = document.querySelectorAll(".pipeline-step-btn");
    stepBtns.forEach((btn, i) => {
      if (i === index) {
        btn.classList.add("active");
        btn.setAttribute("aria-current", "step");
      } else {
        btn.classList.remove("active");
        btn.removeAttribute("aria-current");
      }
    });

    // Update Stage Cards Highlight
    const stageCards = document.querySelectorAll(".pipeline-stage-card");
    stageCards.forEach((card, i) => {
      const statusEl = card.querySelector(".pipeline-stage-status");
      if (i === index) {
        card.classList.add("active");
        if (statusEl) {
          statusEl.className = "pipeline-stage-status status-active";
          statusEl.innerHTML = `<span class="stage-status-dot"></span> ACTIVE`;
        }
      } else {
        card.classList.remove("active");
        if (statusEl) {
          if (i < index) {
            statusEl.className = "pipeline-stage-status status-completed";
            statusEl.innerHTML = `<span class="stage-status-dot"></span> COMPLETED`;
          } else {
            statusEl.className = "pipeline-stage-status status-queued";
            statusEl.innerHTML = `<span class="stage-status-dot"></span> QUEUED`;
          }
        }
      }
    });

    // Update Header Telemetry Strip
    const liveTelemetryReadout = document.getElementById("pipelineHeaderTelemetry");
    if (liveTelemetryReadout) {
      liveTelemetryReadout.innerHTML = `
        <span class="hud-pill"><span class="pulse-dot"></span> STAGE ${stage.number}</span>
        <span class="hud-pill">RATE: ${stage.liveStats.rate}</span>
        <span class="hud-pill">LATENCY: ${stage.liveStats.latency}</span>
        <span class="hud-pill">STATUS: ${stage.liveStats.status}</span>
      `;
    }

    // Update Right Inspector Panel
    this.updateInspectorContent(index, false);
  }

  updateInspectorContent(stageIdx = this.currentStageIndex, isPreview = false) {
    const stage = PIPELINE_STAGES[stageIdx];
    if (!stage) return;

    const codeDisplay = document.getElementById("pipelineInspectorCode");
    const codeBlock = codeDisplay?.parentElement;
    const paramsDisplay = document.getElementById("pipelineInspectorParams");
    const telemetryDisplay = document.getElementById("pipelineInspectorTelemetry");
    const terminalTitle = document.getElementById("pipelineTerminalStageTitle");

    // Clean, crisp terminal title without truncation
    if (terminalTitle) {
      terminalTitle.innerHTML = `
        <span class="inspector-badge ${isPreview ? 'badge-preview' : 'badge-stage'}">
          ${isPreview ? 'PREVIEW' : 'STAGE ' + stage.number}
        </span>
        <span class="inspector-title-text">${stage.shortName || stage.title.toUpperCase()}</span>
      `;
    }

    // Tab 1: Schema / Spec
    if (this.activeInspectorTab === "schema") {
      if (codeBlock) codeBlock.style.display = "block";
      if (codeDisplay) codeDisplay.textContent = stage.schemaCode;
      if (paramsDisplay) paramsDisplay.style.display = "none";
      if (telemetryDisplay) telemetryDisplay.style.display = "none";
    }
    // Tab 2: Client Code
    else if (this.activeInspectorTab === "client") {
      if (codeBlock) codeBlock.style.display = "block";
      if (codeDisplay) codeDisplay.textContent = stage.clientCode;
      if (paramsDisplay) paramsDisplay.style.display = "none";
      if (telemetryDisplay) telemetryDisplay.style.display = "none";
    }
    // Tab 3: Interactive Parameter Sandbox
    else if (this.activeInspectorTab === "params") {
      if (codeBlock) codeBlock.style.display = "none";
      if (telemetryDisplay) telemetryDisplay.style.display = "none";
      if (paramsDisplay) {
        paramsDisplay.style.display = "flex";
        this.renderParamsView(stageIdx);
      }
    }
    // Tab 4: Live Telemetry
    else if (this.activeInspectorTab === "telemetry") {
      if (codeBlock) codeBlock.style.display = "none";
      if (paramsDisplay) paramsDisplay.style.display = "none";
      if (telemetryDisplay) {
        telemetryDisplay.style.display = "grid";
        telemetryDisplay.innerHTML = `
          <div class="inspector-stat-card">
            <span class="stat-label">INGRESS / BUILD RATE</span>
            <span class="stat-value">${stage.liveStats.rate}</span>
          </div>
          <div class="inspector-stat-card">
            <span class="stat-label">PROCESSING LATENCY</span>
            <span class="stat-value">${stage.liveStats.latency}</span>
          </div>
          <div class="inspector-stat-card">
            <span class="stat-label">P99 TAIL LATENCY</span>
            <span class="stat-value">${stage.liveStats.p99}</span>
          </div>
          <div class="inspector-stat-card">
            <span class="stat-label">PACKET DROP RATE</span>
            <span class="stat-value">${stage.liveStats.packetLoss}</span>
          </div>
          <div class="inspector-stat-card full-width">
            <span class="stat-label">EVENT STREAM LOG</span>
            <div class="stat-log-stream" id="statLogStream">
              ${this.packetLogs.slice(-4).join("<br>") || `[${new Date().toISOString().substring(11, 23)}] Stream synchronized with Stage ${stage.number}`}
            </div>
          </div>
        `;
      }
    }
  }

  renderParamsView(stageIdx) {
    const paramsContainer = document.getElementById("pipelineInspectorParams");
    if (!paramsContainer) return;

    const state = this.paramStates[stageIdx];
    const output = this.paramOutputs[stageIdx];
    let html = "";

    if (stageIdx === 0) {
      html = `
        <div class="param-form-grid">
          <div class="param-field">
            <label class="param-label">METHOD &amp; ENDPOINT</label>
            <div class="param-input-group">
              <span class="param-method-pill">POST</span>
              <input type="text" class="param-input" id="paramEndpoint" value="${state.endpoint}" />
            </div>
          </div>
          <div class="param-field">
            <label class="param-label">AUTH BEARER HEADER</label>
            <input type="text" class="param-input font-mono" id="paramAuth" value="${state.auth}" />
          </div>
          <div class="param-field">
            <label class="param-label">QUERY PAYLOAD TARGET</label>
            <input type="text" class="param-input" id="paramQuery" value="${state.query}" />
          </div>
          <div class="param-field">
            <label class="param-label">STREAMING PROTOCOL</label>
            <label class="param-toggle-label">
              <input type="checkbox" id="paramStream" ${state.stream ? "checked" : ""} />
              <span>Enable SSE Streaming Delivery</span>
            </label>
          </div>
        </div>
        <div class="param-actions-row">
          <button class="param-execute-btn" id="btnExecuteParamTest">
            <span class="pulse-dot"></span> Execute Ingress Request &rarr;
          </button>
        </div>
        <div class="param-output-console">
          <div class="console-label">SIMULATED EXECUTION RESPONSE</div>
          <pre class="console-text" id="paramConsoleText">${output}</pre>
        </div>
      `;
    } else if (stageIdx === 1) {
      html = `
        <div class="param-form-grid">
          <div class="param-field">
            <label class="param-label">SPECIFICATION</label>
            <input type="text" class="param-input font-mono" value="OpenAPI 3.1.0 JSON-Schema AST" readonly />
          </div>
          <div class="param-field">
            <label class="param-label">TOKEN BUCKET BURST LIMIT</label>
            <select class="param-select" id="paramBurst">
              <option value="100" ${state.burstRps === "100" ? "selected" : ""}>100 RPS (Standard)</option>
              <option value="250" ${state.burstRps === "250" ? "selected" : ""}>250 RPS (Default Burst)</option>
              <option value="500" ${state.burstRps === "500" ? "selected" : ""}>500 RPS (Turbo Perimeter)</option>
            </select>
          </div>
          <div class="param-field full-col">
            <label class="param-label">PAYLOAD BODY VALIDATION</label>
            <textarea class="param-textarea font-mono" id="paramPayload">${state.payloadBody}</textarea>
          </div>
        </div>
        <div class="param-actions-row">
          <button class="param-execute-btn" id="btnExecuteParamTest">
            <span class="pulse-dot"></span> Verify AST Schema &rarr;
          </button>
        </div>
        <div class="param-output-console">
          <div class="console-label">GATEWAY AST VERIFICATION LOG</div>
          <pre class="console-text" id="paramConsoleText">${output}</pre>
        </div>
      `;
    } else if (stageIdx === 2) {
      html = `
        <div class="param-form-grid">
          <div class="param-field">
            <label class="param-label">TARGET SDK LANGUAGE</label>
            <select class="param-select" id="paramLang">
              <option value="ts" ${state.targetLang === "ts" ? "selected" : ""}>TypeScript (Strict v5.5)</option>
              <option value="py" ${state.targetLang === "py" ? "selected" : ""}>Python (Pydantic V2)</option>
              <option value="go" ${state.targetLang === "go" ? "selected" : ""}>Go 1.23 Structs</option>
              <option value="rs" ${state.targetLang === "rs" ? "selected" : ""}>Rust Serde Types</option>
            </select>
          </div>
          <div class="param-field">
            <label class="param-label">WASM INLINE OPTIMIZER</label>
            <label class="param-toggle-label">
              <input type="checkbox" id="paramWasm" ${state.wasmFastPath ? "checked" : ""} />
              <span>Zero-Any Type Stripping</span>
            </label>
          </div>
        </div>
        <div class="param-actions-row">
          <button class="param-execute-btn" id="btnExecuteParamTest">
            <span class="pulse-dot"></span> Compile Typed SDK &rarr;
          </button>
        </div>
        <div class="param-output-console">
          <div class="console-label">COMPILER OUTPUT ARTIFACT</div>
          <pre class="console-text" id="paramConsoleText">${output}</pre>
        </div>
      `;
    } else {
      html = `
        <div class="param-form-grid">
          <div class="param-field">
            <label class="param-label">AUTONOMOUS RUNTIME TARGET</label>
            <select class="param-select" id="paramRuntime">
              <option value="claude" ${state.agentRuntime === "claude" ? "selected" : ""}>Claude Code / Anthropic Agent</option>
              <option value="openai" ${state.agentRuntime === "openai" ? "selected" : ""}>OpenAI Function Calling</option>
              <option value="mcp" ${state.agentRuntime === "mcp" ? "selected" : ""}>MCP Server (RFC-2024.1)</option>
            </select>
          </div>
          <div class="param-field">
            <label class="param-label">DISPATCH TOOL ID</label>
            <input type="text" class="param-input font-mono" id="paramToolId" value="${state.toolName}" />
          </div>
        </div>
        <div class="param-actions-row">
          <button class="param-execute-btn" id="btnExecuteParamTest">
            <span class="pulse-dot"></span> Dispatch Agent Tool &rarr;
          </button>
        </div>
        <div class="param-output-console">
          <div class="console-label">AGENT DISPATCH TELEMETRY</div>
          <pre class="console-text" id="paramConsoleText">${output}</pre>
        </div>
      `;
    }

    paramsContainer.innerHTML = html;

    // Bind parameter execution button
    const execBtn = document.getElementById("btnExecuteParamTest");
    if (execBtn) {
      execBtn.addEventListener("click", () => {
        this.runParamSimulation(stageIdx);
      });
    }
  }

  runParamSimulation(stageIdx) {
    const consoleText = document.getElementById("paramConsoleText");
    const btn = document.getElementById("btnExecuteParamTest");
    const now = new Date().toISOString().substring(11, 23);
    const latency = (1.5 + Math.random() * 2.5).toFixed(1);

    if (btn) {
      const orig = btn.innerHTML;
      btn.innerHTML = `<span class="pulse-dot"></span> PROCESSING...`;
      btn.classList.add("executing");
      setTimeout(() => {
        btn.innerHTML = orig;
        btn.classList.remove("executing");
      }, 600);
    }

    let resultMsg = "";
    if (stageIdx === 0) {
      const q = document.getElementById("paramQuery")?.value || "agent.runtime.status";
      resultMsg = `[${now}] HTTP/2 200 OK (${latency}ms)\nContent-Type: application/json; charset=utf-8\nPayload: {\n  "status": "success",\n  "query": "${q}",\n  "streamSession": "sess_${Math.random().toString(36).substring(2, 9)}",\n  "bytesIngressed": 3840\n}`;
    } else if (stageIdx === 1) {
      resultMsg = `[${now}] AST JSON-SCHEMA VALIDATION PASS (${latency}ms)\nPerimeter Check: Token Bucket Allowed\nPayload AST: 0 semantic violations\nCORS Header: Access-Control-Allow-Origin: *\nRate-Limit Remaining: 249/250`;
    } else if (stageIdx === 2) {
      const lang = document.getElementById("paramLang")?.value || "ts";
      resultMsg = `[${now}] WASM FAST-PATH COMPILE SUCCESS (${latency}ms)\nTarget: ${lang.toUpperCase()} | Strict Null Safety: Enforced\nGenerated 1 interface, 1 response envelope, 0 'any' leaks\nArtifact Hash: sha256:${Math.random().toString(36).substring(2, 10)}`;
    } else {
      resultMsg = `[${now}] MCP RFC-2024.1 TOOL DISPATCHED (${latency}ms)\nBridge Protocol: agent-mcp-v1\nStatus: DISPATCH_COMPLETED\nBidirectional Stream: 4 frames sent, 0 packet loss`;
    }

    this.paramOutputs[stageIdx] = resultMsg;
    if (consoleText) {
      consoleText.textContent = resultMsg;
    }

    // Fire 3D particle burst from active stage
    if (this.canvasInstance) {
      this.canvasInstance.triggerPacketBurst(stageIdx);
    }

    // Log to event stream
    this.packetLogs.push(`[${now}] Stage 0${stageIdx + 1} parameter test executed (${latency}ms)`);
  }

  bindUIEvents() {
    // 1. Step Buttons in Scrubber: click to scroll to stage
    const stepBtns = document.querySelectorAll(".pipeline-step-btn");
    stepBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const stageIdx = parseInt(btn.dataset.stage, 10);
        this.renderStage(stageIdx);
        this.scrollToStage(stageIdx);
      });
    });

    // 2. Stage Cards: hover inspection & click to lock and scroll
    const stageCards = document.querySelectorAll(".pipeline-stage-card");
    stageCards.forEach((card) => {
      const stageIdx = parseInt(card.dataset.stage, 10);

      // Hover to inspect live schema/code/parameters
      card.addEventListener("mouseenter", () => {
        if (stageIdx !== this.currentStageIndex) {
          this.previewStageIndex = stageIdx;
          if (this.canvasInstance) {
            this.canvasInstance.previewStage(stageIdx);
          }
          this.updateInspectorContent(stageIdx, true);
        }
      });

      card.addEventListener("mouseleave", () => {
        if (this.previewStageIndex !== null) {
          this.previewStageIndex = null;
          if (this.canvasInstance) {
            this.canvasInstance.revertPreview();
          }
          this.updateInspectorContent(this.currentStageIndex, false);
        }
      });

      // Click to select and scroll
      card.addEventListener("click", () => {
        this.previewStageIndex = null;
        this.renderStage(stageIdx);
        this.scrollToStage(stageIdx);
      });
    });

    // 3. Inspector Tab Buttons
    const tabBtns = document.querySelectorAll(".inspector-tab-btn");
    tabBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        tabBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeInspectorTab = btn.dataset.tab;
        this.updateInspectorContent(this.currentStageIndex, false);
      });
    });

    // 4. Speed Multiplier Toggles
    const speedBtns = document.querySelectorAll(".pipeline-speed-btn");
    speedBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        speedBtns.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        const speed = parseFloat(btn.dataset.speed);
        if (this.canvasInstance) {
          this.canvasInstance.setSpeedMultiplier(speed);
        }
      });
    });

    // 5. Send Sample Packet Button
    const sendPacketBtn = document.getElementById("pipelineSendPacketBtn");
    if (sendPacketBtn) {
      sendPacketBtn.addEventListener("click", () => {
        this.sendSamplePacket();
      });
    }
  }

  scrollToStage(stageIdx) {
    if (!this.scrollTrigger) {
      this.renderStage(stageIdx);
      return;
    }

    const start = this.scrollTrigger.start;
    const end = this.scrollTrigger.end;
    const totalDist = end - start;

    // Progress target for stage 0, 1, 2, 3 plateaus (harmonized with camera waypoints)
    const stageProgress = [0.08, 0.375, 0.625, 0.90][stageIdx];
    const targetY = start + stageProgress * totalDist;

    window.scrollTo({
      top: targetY,
      behavior: "smooth"
    });
  }

  sendSamplePacket() {
    this.packetCounter++;
    const now = new Date().toISOString().substring(11, 23);
    const logLine = `[${now}] Packet #${this.packetCounter} dispatched -> 200 OK (8.2ms)`;
    this.packetLogs.push(logLine);

    // Fire 3D particle burst from stage 0 (Ingress entrypoint)
    if (this.canvasInstance) {
      this.canvasInstance.triggerPacketBurst(0);
    }

    // Temporary button visual feedback
    const btn = document.getElementById("pipelineSendPacketBtn");
    if (btn) {
      const origText = btn.innerHTML;
      btn.innerHTML = `<span class="pulse-dot"></span> DISPATCHING...`;
      btn.style.borderColor = "var(--accent-cyan)";
      setTimeout(() => {
        btn.innerHTML = origText;
        btn.style.borderColor = "";
      }, 700);
    }

    // Update inspector log if telemetry tab is open
    this.updateInspectorContent(this.currentStageIndex, false);
  }

  destroy() {
    if (this.scrollTrigger) {
      this.scrollTrigger.kill();
      this.scrollTrigger = null;
    }
    if (this.canvasInstance) {
      this.canvasInstance.destroy();
      this.canvasInstance = null;
    }
  }
}

export function initPipelineTimeline() {
  return new PipelineTimelineController();
}
