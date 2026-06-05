'use client';

import React, { useEffect, useState } from 'react';
import { 
  Activity, ShieldAlert, Cpu, Database, AlertTriangle, 
  Terminal, CheckCircle2, BarChart3, Hammer, Shield, Sliders, RefreshCw
} from 'lucide-react';

interface MetricPoint {
  price: number;
  volume: number;
  isAnomaly: boolean;
}

interface AnomalyInsight {
  anomaly_id: number;
  score: number;
  technical_specs: string;
  timestamp: string;
  ai_executive_summary: string;
}

type VerticalType = 'fintech' | 'industrial' | 'cyber';

export default function DashboardHome() {
  const [activeVertical, setActiveVertical] = useState<VerticalType>('fintech');
  const [streamData, setStreamData] = useState<MetricPoint[]>([]);
  const [insights, setInsights] = useState<AnomalyInsight[]>([]);
  const [currentVal1, setCurrentVal1] = useState<number>(0);
  const [currentVal2, setCurrentVal2] = useState<number>(0);
  const [systemState, setSystemState] = useState<'syncing' | 'nominal' | 'alert'>('syncing');

  const verticalConfig = {
    fintech: {
      title: "Quantitative Capital Vector Node",
      tagline: "Non-Linear Volatility Insulation & Density Isolation",
      description: "Monitors structural order-book imbalances and liquidity exhaustion metrics using streaming high-frequency multi-sigma density isolation bounds. Insulates institutional asset positions against predatory algorithmic drift.",
      entity: "TRACE NODE // CAP_VECTOR.AAPL.US_MARKETS",
      f1_label: "Statistical Dispersion Delta",
      f1_unit: "$",
      f2_label: "Transaction Stream Velocity",
      f2_unit: " TX/S",
      roi_label: "Aggregated Capital Exposure Insulated",
      stroke: "#10b981",
      cardHover: "hover:border-emerald-500/40 hover:shadow-[0_0_15px_rgba(16,185,129,0.05)]"
    },
    industrial: {
      title: "SCADA Infrastructure Telemetry Core",
      tagline: "Predictive Critical Kinematic Maintenance Forensics",
      description: "Cross-analyzes fluid hydraulic head-loss indexes and torsional bearing fatigue frequencies. Flags multi-variable structural stress and cavitation thresholds before micro-fractures propagate to failure.",
      entity: "SENSOR STREAM // BLOCK_04_ROTATION.TURBINE_KINETICS",
      f1_label: "Hydraulic Line Pressure Index",
      f1_unit: " PSI",
      f2_label: "Resonant Harmonic Vibration Delta",
      f2_unit: " Hz",
      roi_label: "System Asset Destruction Prevented",
      stroke: "#f59e0b",
      cardHover: "hover:border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.05)]"
    },
    cyber: {
      title: "Distributed Packet Edge Forensics Hub",
      tagline: "Perimeter Threat Ingress Countermeasures Matrix",
      description: "Maps asynchronous packet fragmentation skews against volumetric external ingress request spikes. Isolates stateful firewall degradation patterns and lateral data movement anomalies within milliseconds.",
      entity: "ZERO-TRUST INGRESS // EDGE_ROUTING.NODE_ALPHA",
      f1_label: "Internal Packet Ingress Latency",
      f1_unit: " ms",
      f2_label: "Ingress Inflow Volume Stream",
      f2_unit: " KB/S",
      roi_label: "Breach Liability Financial Impact Deflected",
      stroke: "#6366f1",
      cardHover: "hover:border-indigo-500/40 hover:shadow-[0_0_15px_rgba(99,102,241,0.05)]"
    }
  }[activeVertical];

  useEffect(() => {
    let socket: WebSocket | null = null;
    let isMounted = true;

    // frontend/app/page.tsx -> Dynamic API Routing Configuration
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://192.168.0.230:8000";
    const wsBaseUrl = process.env.NEXT_PUBLIC_WS_URL || "ws://192.168.0.230:8000";

    const fetchInitialMetrics = async () => {
      try {
        const insightsRes = await fetch(`${apiBaseUrl}/api/v1/insights?vertical=${activeVertical}`);
        if (insightsRes.ok && isMounted) {
          const insightsData = await insightsRes.json();
          setInsights(insightsData);
        }

        const anomaliesRes = await fetch(`${apiBaseUrl}/api/v1/insights?vertical=${activeVertical}`);
        if (anomaliesRes.ok && isMounted) {
          const rawAnomalies = await anomaliesRes.json();
          
          if (rawAnomalies.length > 0) {
            const parsedSpecs: MetricPoint[] = rawAnomalies.map((a: any) => {
              const f1Match = a.description.match(/Field_1:\s*([\d.]+)/);
              const f2Match = a.description.match(/Field_2:\s*([\d.]+)/);
              return {
                price: f1Match ? parseFloat(f1Match[1]) : 0,
                volume: f2Match ? parseFloat(f2Match[1]) : 0,
                isAnomaly: a.score > 1.5
              };
            }).reverse();
            
            setStreamData(parsedSpecs.slice(-35)); 
            if (parsedSpecs.length > 0) {
              const latest = parsedSpecs[parsedSpecs.length - 1];
              setCurrentVal1(latest.price);
              setCurrentVal2(latest.volume);
              setSystemState(latest.isAnomaly ? 'alert' : 'nominal');
            }
          } else {
            setStreamData([]);
            setCurrentVal1(0);
            setCurrentVal2(0);
            setSystemState('nominal');
          }
        }
      } catch (err) {
        console.error("Initial baseline hydration dropped:", err);
      }
    };

    fetchInitialMetrics();

    const connectWebSocket = () => {
      if (!isMounted) return;

      // Update your WebSocket initialization string:
      socket = new WebSocket(`${wsBaseUrl}/api/v1/stream`);

      socket.onopen = () => {
        if (isMounted) console.log(`⚡ Telemetry pipeline mapped cleanly to channel: [${activeVertical.toUpperCase()}]`);
      };

      socket.onmessage = (event) => {
        if (!isMounted) return;
        const message = JSON.parse(event.data);
        
        if (message.type === 'METRIC_TICK' && message.vertical === activeVertical) {
          const newPoint: MetricPoint = {
            price: message.data.price,
            volume: message.data.volume,
            isAnomaly: message.data.isAnomaly
          };

          setStreamData((prevData) => {
            const updated = [...prevData, newPoint];
            return updated.slice(-35);
          });

          setCurrentVal1(newPoint.price);
          setCurrentVal2(newPoint.volume);
          
          if (newPoint.isAnomaly) {
            setSystemState('alert');
            fetch(`${apiBaseUrl}/api/v1/insights?vertical=${activeVertical}`)
              .then(res => res.json())
              .then(data => { if (isMounted) setInsights(data); })
              .catch(err => console.error("Forensics stream update fault:", err));
          } else {
            setSystemState('nominal');
          }
        }
      };

      socket.onerror = (error) => {
        if (isMounted) {
          console.error("WebSocket telemetry channel error:", error);
        }
      };

      socket.onclose = () => {
        if (isMounted) console.log("🔌 Telemetry channel socket cycled.");
      };
    };

    const socketTimeout = setTimeout(connectWebSocket, 150);

    return () => {
      isMounted = false;
      clearTimeout(socketTimeout);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
    };
  }, [activeVertical]);

  const maxVal = streamData.length > 0 ? Math.max(...streamData.map(d => d.price)) * 1.05 : 200;
  const minVal = streamData.length > 0 ? Math.min(...streamData.map(d => d.price)) * 0.95 : 0;

  const generateBezierPath = () => {
    if (streamData.length < 2) return '';
    let path = '';
    streamData.forEach((d, index) => {
      const x = (index / (streamData.length - 1)) * 500;
      const y = 150 - ((d.price - minVal) / (Math.max(maxVal - minVal, 1))) * 120;
      
      if (index === 0) {
        path = `M ${x} ${y}`;
      } else {
        const prevX = ((index - 1) / (streamData.length - 1)) * 500;
        const prevY = 150 - ((streamData[index - 1].price - minVal) / (Math.max(maxVal - minVal, 1))) * 120;
        const cpX1 = prevX + (x - prevX) / 2;
        const cpY1 = prevY;
        const cpX2 = prevX + (x - prevX) / 2;
        const cpY2 = y;
        path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
      }
    });
    return path;
  };

  const exportForensicManifest = () => {
    if (insights.length === 0) {
      alert("No forensic logs available in the active telemetry scope cache.");
      return;
    }

    const timestampStr = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `NEXUS_FORENSIC_MANIFEST_${activeVertical.toUpperCase()}_${timestampStr}.md`;

    let markdownContent = `# 📑 NEXUS METRIC CORE // SECURE FORENSIC MANIFEST\n`;
    markdownContent += `## DOMAIN FILTER SCOPE: [${activeVertical.toUpperCase()}]\n`;
    markdownContent += `### EXPORT TIMESTAMP: ${new Date().toLocaleString()} // SECURITY PROTOCOL ACTIVE\n`;
    markdownContent += `========================================================================\n\n`;
    markdownContent += `The system has isolated and logged the following multi-variable anomalies using unsupervised density isolation metrics. Forensic summaries were synthesized via the containerized cognitive processing layer.\n\n`;

    insights.forEach((insight, idx) => {
      markdownContent += `### [LOG INGESTION NODE #${idx + 1}]\n`;
      markdownContent += `* **Incident ID:** COR_ERR_${insight.anomaly_id}\n`;
      markdownContent += `* **Telemetry Timestamp:** ${new Date(insight.timestamp).toLocaleString()}\n`;
      markdownContent += `* **Computed Deviation Strength:** ${insight.score} Index Points\n`;
      markdownContent += `* **System Technical Specs:** ${insight.technical_specs}\n`;
      markdownContent += `\n**AI EXECUTIVE ANOMALY BREAKDOWN:**\n`;
      markdownContent += `> ${insight.ai_executive_summary}\n`;
      markdownContent += `\n------------------------------------------------------------------------\n\n`;
    });

    markdownContent += `\n\n*MANIFEST END // NEXUS METRIC CORE v3.2.4 // REGULATED COMPLIANCE TRAIL RECORD*`;

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-[#030407] text-[#8e9bb2] flex flex-col font-sans antialiased selection:bg-emerald-500/20">
      
      {/* DE-SLOPPED INSTITUTIONAL MANAGEMENT HEADER */}
      <header className="bg-[#05060b]/90 backdrop-blur-xl border-b border-[#121526] px-10 py-5 flex flex-col xl:flex-row items-center justify-between gap-6 sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className={`p-3 rounded-xl border transition-all duration-500 bg-linear-to-br ${systemState === 'alert' ? 'from-red-500/10 to-red-600/5 border-red-500/30 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'from-emerald-500/5 to-teal-500/5 border-[#161b33] text-emerald-400'}`}>
              <Activity className={`h-5 w-5 ${systemState === 'alert' ? 'animate-bounce' : 'animate-pulse'}`} />
            </div>
            <span className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ${systemState === 'alert' ? 'bg-red-500' : 'bg-emerald-400'}`} />
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xs font-black tracking-[0.35em] font-mono uppercase bg-linear-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">NEXUS METRIC CORE</h1>
              <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 bg-[#0a0c16] border border-[#161b33] px-2 py-0.5 rounded-md">INSTITUTIONAL v3.2.4</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1.5 uppercase tracking-wider">
              <Terminal className="h-3 w-3 text-slate-400" /> INSTITUTIONAL TELEMETRY LAYER // MULTI-TENANT ISOLATION PIPELINE
            </p>
          </div>
        </div>

        {/* PREMIUM EDGE NAVIGATION ROUTER WITH DYNAMIC GLOW */}
        <div className="flex items-center bg-[#05060b] p-1.5 rounded-xl border border-[#141726] shadow-inner max-w-full overflow-x-auto scrollbar-none shrink-0 relative z-50 pointer-events-auto">
          {(['fintech', 'industrial', 'cyber'] as VerticalType[]).map((v) => {
            const isActive = activeVertical === v;
            const activeStyle = v === 'fintech' ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]" :
                                v === 'industrial' ? "bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.2)]" :
                                "bg-indigo-500/10 border-indigo-500/50 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]";

            return (
              <button
                key={v}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  setActiveVertical(v);
                  setSystemState('syncing');
                }}
                className={`flex items-center space-x-2.5 px-5 py-2.5 rounded-lg text-[11px] font-mono tracking-widest transition-all uppercase duration-300 relative z-50 cursor-pointer select-none active:scale-95 ${isActive ? activeStyle : 'border-transparent text-slate-500 hover:text-slate-300'}`}
              >
                {v === 'fintech' && <BarChart3 className={`h-3.5 w-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />}
                {v === 'industrial' && <Hammer className={`h-3.5 w-3.5 ${isActive ? 'text-amber-400' : 'text-slate-500'}`} />}
                {v === 'cyber' && <Shield className={`h-3.5 w-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />}
                <span>{v}</span>
              </button>
            );
          })}
        </div>

        <div className="hidden xl:flex items-center gap-4 text-[10px] font-mono">
          <div className="flex items-center space-x-2 bg-[#05060b] px-3 py-2 rounded-lg border border-[#121526]">
            <Database className="h-3.5 w-3.5 text-slate-600" />
            <span className="text-slate-400">STORAGE ARCHITECTURE: <span className="text-white font-bold">TimescaleDB Cluster</span></span>
          </div>
          <div className="flex items-center space-x-2 bg-[#05060b] px-3 py-2 rounded-lg border border-[#121526]">
            <Sliders className="h-3.5 w-3.5 text-slate-600" />
            <span className="text-slate-400">ISOLATION CORE: <span className="text-white font-bold">Edge Hardware Vector Node</span></span>
          </div>
        </div>
      </header>

      {/* WORKSPACE CONTENT CONTAINER */}
      <div className="p-4 md:p-8 xl:p-10 space-y-6 md:space-y-8 flex-1 max-w-[1700px] w-full mx-auto">
        
        {/* PLATFORM DOMAIN IDENTIFIER CARD */}
        <section className="bg-linear-to-r from-[#06080e] to-[#040508] border border-[#121626] rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="space-y-1 z-10 max-w-4xl">
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-slate-400 bg-slate-500/5 px-2.5 py-1 rounded-md border border-slate-500/10">Active Telemetry Intercept Filter</span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-2 font-mono uppercase">{verticalConfig.title}</h2>
            <p className="text-xs font-mono text-slate-400 font-medium tracking-wide mt-1">{verticalConfig.tagline}</p>
            <p className="text-xs text-slate-500 leading-relaxed pt-2 border-t border-[#121626]/40 mt-2">{verticalConfig.description}</p>
          </div>
          <div className="absolute top-0 right-0 w-80 h-full bg-linear-to-l from-slate-500/1 to-transparent pointer-events-none" />
        </section>

        {/* HIGH-DENSITY HIGH-VALUE CARD METRICS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className={`bg-[#05060b] border border-[#121526] p-5 rounded-xl flex flex-col justify-between group transition-all duration-300 ${verticalConfig.cardHover}`}>
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block">System Monitor Routing Target</span>
            <span className="text-xs font-bold text-white mt-2 block font-mono tracking-tight break-all">{verticalConfig.entity}</span>
          </div>
          
          <div className={`bg-[#05060b] border border-[#121526] p-5 rounded-xl flex flex-col justify-between group transition-all duration-300 ${verticalConfig.cardHover}`}>
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block">{verticalConfig.f1_label}</span>
            <span className="text-2xl font-black text-white tracking-tight font-mono mt-2 flex items-baseline">
              {verticalConfig.f1_unit === '$' ? <span className="text-xs text-slate-500 mr-0.5 font-normal">$</span> : ''}
              {currentVal1.toFixed(2)}
              {verticalConfig.f1_unit !== '$' ? <span className="text-xs text-slate-500 ml-1 font-normal">{verticalConfig.f1_unit}</span> : ''}
            </span>
          </div>

          <div className={`bg-[#05060b] border border-[#121526] p-5 rounded-xl flex flex-col justify-between group transition-all duration-300 ${verticalConfig.cardHover}`}>
            <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 block">{verticalConfig.f2_label}</span>
            <span className="text-2xl font-black text-slate-200 tracking-tight font-mono mt-2 flex items-baseline">
              {currentVal2.toLocaleString()}
              <span className="text-xs text-slate-500 ml-1 font-normal">{verticalConfig.f2_unit}</span>
            </span>
          </div>

          <div className="bg-[#0a0709] border border-red-950/40 p-5 rounded-xl relative overflow-hidden group hover:border-red-900/40 transition-all duration-300 shadow-lg">
            <span className="text-[9px] font-mono uppercase tracking-widest text-red-400 font-bold flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3 text-red-400" /> {verticalConfig.roi_label}
            </span>
            <span className="text-2xl font-black tracking-tight font-mono mt-2 block text-red-400">
              ${(insights.reduce((acc, curr) => acc + curr.score * 1650, 0)).toLocaleString()}
            </span>
            <div className="absolute inset-0 bg-linear-to-r from-red-500/0 to-red-500/2 pointer-events-none" />
          </div>
        </section>

        {/* PRIMARY VIEWPORT LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* HIGH-DENSITY VECTOR MATRIX CANVAS */}
          <div className="lg:col-span-2 bg-[#05060b] border border-[#121526] rounded-2xl p-6 space-y-6 shadow-2xl relative group">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase font-mono">Statistical Signal Tracking Array</h3>
                <p className="text-xs text-slate-500 mt-0.5">Real-time non-linear density vector streams mapped across mathematical distribution coordinates</p>
              </div>
              <div className="flex items-center space-x-2 text-[9px] font-mono text-slate-500 bg-[#030407] px-2.5 py-1.5 rounded-lg border border-[#121526]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="tracking-wider">SAMPLING_INTERVAL: REALTIME WSS</span>
              </div>
            </div>

            <div className="w-full bg-[#030407] border border-[#121524] rounded-xl relative p-4 md:p-6 overflow-hidden min-h-[280px] md:min-h-[380px] flex items-center justify-center transition-all duration-500 group-hover:border-[#1a1f38]">
              {streamData.length > 1 ? (
                <div className="w-full h-full min-h-[320px] relative flex flex-col justify-between flex-1">
                  
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20 z-0">
                    <div className="border-b border-[#141829] w-full h-px" />
                    <div className="border-b border-[#141829] w-full h-px" />
                    <div className="border-b border-[#141829] w-full h-px" />
                    <div className="border-b border-[#141829] w-full h-px" />
                    <div className="border-b border-[#141829] w-full h-px" />
                  </div>
                  <div className="absolute inset-0 flex justify-between pointer-events-none opacity-20 z-0">
                    <div className="border-r border-[#141829] h-full w-px" />
                    <div className="border-r border-[#141829] h-full w-px" />
                    <div className="border-r border-[#141829] h-full w-px" />
                    <div className="border-r border-[#141829] h-full w-px" />
                    <div className="border-r border-[#141829] h-full w-px" />
                  </div>

                  <div className="flex-1 flex flex-col w-full h-full relative z-10">
                    
                    <svg className="w-full h-[220px] overflow-visible" viewBox="0 0 500 150" { ...{ preserveAspectRatio: "none" } as any }>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={verticalConfig.stroke} stopOpacity="0.12" />
                          <stop offset="100%" stopColor={verticalConfig.stroke} stopOpacity="0.00" />
                        </linearGradient>
                      </defs>
                      <path d={`${generateBezierPath()} L 500 150 L 0 150 Z`} fill="url(#areaGradient)" />
                      <path d={generateBezierPath()} fill="none" stroke={verticalConfig.stroke} strokeWidth="1.75" strokeLinecap="round" />
                      
                      {streamData.map((d, index) => {
                        const x = (index / (streamData.length - 1)) * 500;
                        const y = 150 - ((d.price - minVal) / (Math.max(maxVal - minVal, 1))) * 120;
                        if (!d.isAnomaly) return null;
                        return (
                          <g key={`point-${index}`} className="z-30">
                            <circle cx={x} cy={y} r="3" fill="#ef4444" />
                            <circle cx={x} cy={y} r="8" fill="none" stroke="#ef4444" strokeWidth="0.75" opacity="0.6" className="animate-ping" />
                          </g>
                        );
                      })}
                    </svg>

                    <div className="mt-6 border-t border-[#121526] pt-4 h-[50px] w-full relative">
                      <div className="absolute top-[7px] left-0 text-[8px] font-mono text-slate-500 tracking-widest bg-[#030407] px-1">VELOCITY DENSITY (FIELD_2)</div>
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 40" { ...{ preserveAspectRatio: "none" } as any }>
                        {streamData.map((d, index) => {
                          const x = (index / (streamData.length - 1)) * 500;
                          const maxVol = Math.max(...streamData.map(s => s.volume), 10);
                          const height = Math.max((d.volume / maxVol) * 40, 2);
                          return (
                            <rect
                              key={`bar-${index}`}
                              x={x - 2}
                              y={40 - height}
                              width="4"
                              height={height}
                              fill={verticalConfig.stroke}
                              opacity={d.isAnomaly ? "0.9" : "0.15"}
                              rx="1"
                              className="transition-all duration-300"
                            />
                          );
                        })}
                      </svg>
                    </div>

                  </div>
                  
                  <div className="flex items-center justify-between font-mono text-[9px] text-slate-600 pt-3 border-t border-[#121526] mt-4 z-10">
                    <span className="tracking-wider">INGESTION_STREAM_ACTIVE // VECTOR_NODES: {streamData.length}</span>
                    <span className="uppercase tracking-widest text-slate-500">INGESTION CHANNEL // DOMAIN_PARTITION:01</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 text-center p-12 font-mono h-full w-full relative group">
                  <div className="relative flex items-center justify-center h-20 w-20">
                    <div className="absolute inset-0 rounded-full border border-slate-500/10 animate-ping duration-1000" />
                    <div className="absolute h-12 w-12 rounded-full border border-slate-500/5 animate-pulse" />
                    <RefreshCw className="h-5 w-5 text-slate-500/30 animate-spin duration-4000" />
                  </div>
                  <div className="space-y-1 max-w-sm">
                    <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">Synchronizing Network Clusters</p>
                    <p className="text-[10px] text-slate-600 leading-relaxed">Awaiting raw structural data telemetry injection packet sequences over persistent WebSockets...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* HARDENED STATISTICAL FORENSICS TERMINAL */}
          <div className="bg-[#05060b] border border-[#121526] rounded-2xl p-6 flex flex-col min-h-[495px] shadow-2xl">
            {/* CARD HEADER ROW */}
            <div className="flex items-center justify-between pb-4 border-b border-[#121526]">
              <div className="flex items-center space-x-2.5">
                <ShieldAlert className="h-4 w-4 text-slate-400" />
                <h3 className="text-[10px] font-bold tracking-widest text-slate-200 uppercase font-mono">Statistical Forensics Terminal</h3>
              </div>
              <span className="text-[8px] font-bold font-mono tracking-widest bg-slate-500/5 border border-slate-500/20 text-slate-400 px-2 py-0.5 rounded uppercase">
                {activeVertical}_ISOLATION
              </span>
            </div>

            {/* ⚡ STANDALONE EXPORT ACTION CONTROL BAR (Guarantees infinite cross-device visibility) */}
            <div className="pt-3 pb-2 border-b border-[#121526]/40 flex items-center justify-between">
              <span className="text-[9px] font-mono text-slate-500 tracking-wider">Compliance Logging Utility</span>
              <button
                type="button"
                onClick={exportForensicManifest}
                className={`text-[10px] font-mono font-black tracking-widest bg-white/5 hover:bg-white/10 text-white border px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer select-none active:scale-95 shadow-md ${
                  activeVertical === 'fintech' ? 'border-emerald-500/40 hover:border-emerald-400 text-emerald-400' :
                  activeVertical === 'industrial' ? 'border-amber-500/40 hover:border-amber-400 text-amber-400' :
                  'border-indigo-500/40 hover:border-indigo-400 text-indigo-400'
                }`}
              >
                📥 EXPORT FORENSIC LOGS
              </button>
            </div>
            
            {/* SCROLLING RECONNAISSANCE CONTENT CONTAINER */}
            <div className="flex-1 overflow-y-auto mt-4 space-y-3 max-h-[340px] pr-1 scrollbar">
              {insights.length > 0 ? (
                insights.map((insight) => {
                  const isHighUrgency = insight.score >= 1.8;
                  return (
                    <div 
                      key={insight.anomaly_id} 
                      className={`bg-[#030407] border-y border-r border-l-2 p-4 rounded-r-xl rounded-l-md flex flex-col space-y-3 transition-all duration-300 group ${
                        isHighUrgency 
                          ? 'border-y-[#1c1215] border-r-[#1c1215] border-l-red-500/70 hover:border-y-red-500/20 hover:border-r-red-500/20' 
                          : 'border-y-[#121524] border-r-[#121524] border-l-slate-600/40 hover:border-y-slate-500/20 hover:border-r-slate-500/20'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <div className={`flex items-center space-x-1.5 font-bold tracking-wider ${isHighUrgency ? 'text-red-400' : 'text-slate-400'}`}>
                          <AlertTriangle className={`h-3 w-3 ${isHighUrgency ? 'animate-pulse' : ''}`} />
                          <span>DEVIATION DETECTED // VECTOR_INDEX {insight.score}</span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-medium">
                          {new Date(insight.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed font-sans font-normal tracking-wide">
                        {insight.ai_executive_summary}
                      </p>
                      <div className="pt-2 border-t border-[#121526]/60 flex items-center justify-between text-[9px] font-mono text-slate-500">
                        <span className="tracking-wider">ENGINE: AUTOMATED FORENSICS ROUTER</span>
                        <span className="text-emerald-500 font-bold uppercase tracking-wider">Mitigated</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#121526] rounded-xl font-mono text-slate-600 my-auto">
                  <Cpu className="h-5 w-5 text-slate-700 animate-pulse mb-2" />
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Scanning Ingestion Vectors</p>
                  <p className="text-[10px] text-slate-600 mt-1 leading-relaxed max-w-[200px] mx-auto">Unsupervised multi-sigma distribution loops online. Signals normal.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}