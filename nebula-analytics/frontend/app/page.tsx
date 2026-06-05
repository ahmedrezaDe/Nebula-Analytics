'use client';

import React, { useEffect, useState } from 'react';
import { 
  Activity, ShieldAlert, Cpu, Database, AlertTriangle, 
  TrendingUp, Layers, DollarSign, Clock, RefreshCw, Radio, Server
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

export default function DashboardHome() {
  const [streamData, setStreamData] = useState<MetricPoint[]>([]);
  const [insights, setInsights] = useState<AnomalyInsight[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number>(150.0);
  const [currentVolume, setCurrentVolume] = useState<number>(6000);
  const [systemState, setSystemState] = useState<'syncing' | 'nominal' | 'alert'>('syncing');

  useEffect(() => {
    const fetchDashboardState = async () => {
      try {
        const insightsRes = await fetch('http://127.0.0.1:8000/api/v1/insights');
        if (insightsRes.ok) {
          const insightsData = await insightsRes.json();
          setInsights(insightsData);
          setSystemState(insightsData.length > 0 ? 'alert' : 'nominal');
        }

        const anomaliesRes = await fetch('http://127.0.0.1:8000/api/v1/anomalies');
        if (anomaliesRes.ok) {
          const rawAnomalies = await anomaliesRes.json();
          
          if (rawAnomalies.length > 0) {
            const parsedSpecs: MetricPoint[] = rawAnomalies.map((a: any) => {
              const priceMatch = a.description.match(/Price:\s*([\d.]+)/);
              const volMatch = a.description.match(/Vol:\s*([\d.]+)/);
              const priceVal = priceMatch ? parseFloat(priceMatch[1]) : 150;
              const volVal = volMatch ? parseFloat(volMatch[1]) : 6000;
              
              // Tightened anomaly threshold to match strict statistical isolation
              const isAnom = volVal > 22000 || priceVal < 130 || priceVal > 170;

              return { price: priceVal, volume: volVal, isAnomaly: isAnom };
            }).reverse();
            
            setStreamData(parsedSpecs.slice(-35)); 
            if (parsedSpecs.length > 0) {
              const latest = parsedSpecs[parsedSpecs.length - 1];
              setCurrentPrice(latest.price);
              setCurrentVolume(latest.volume);
            }
          }
        }
      } catch (err) {
        console.error("Dashboard engine sync loop drop:", err);
      }
    };

    fetchDashboardState();
    const runtimeInterval = setInterval(fetchDashboardState, 1000);
    return () => clearInterval(runtimeInterval);
  }, []);

  const maxPrice = streamData.length > 0 ? Math.max(...streamData.map(d => d.price)) * 1.03 : 200;
  const minPrice = streamData.length > 0 ? Math.min(...streamData.map(d => d.price)) * 0.97 : 100;

  return (
    <div className="min-h-screen bg-[#06070a] text-[#94a3b8] flex flex-col font-sans antialiased">
      
      {/* INSTITUTIONAL TOP STEWARD NAV */}
      <header className="bg-[#0b0c10] border-b border-[#141722] px-8 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="relative flex items-center justify-center">
            <div className={`p-2 rounded-lg border ${systemState === 'alert' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-emerald-500/5 border-emerald-500/10 text-emerald-400'}`}>
              <Server className="h-5 w-5" />
            </div>
            <span className={`absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ${systemState === 'alert' ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-[0.2em] text-white font-mono">NEBULA.ANALYTICS</h1>
              <span className="text-[9px] font-mono tracking-wider text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 px-1.5 py-0.5 rounded">LIVE NODE</span>
            </div>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-1.5">
              <Radio className="h-3 w-3 text-emerald-400" /> INSTANCE // MACBOOK_PRO_CLUSTER
            </p>
          </div>
        </div>

        {/* SYSTEM STATS */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          <div className="flex items-center space-x-2 bg-[#10121a] px-3 py-1.5 rounded border border-[#141722]">
            <Database className="h-3 w-3 text-slate-500" />
            <span className="text-slate-400">DB: <span className="text-slate-200">TimescaleDB</span></span>
          </div>
          <div className="flex items-center space-x-2 bg-[#10121a] px-3 py-1.5 rounded border border-[#141722]">
            <Cpu className="h-3 w-3 text-slate-500" />
            <span className="text-slate-400">AI: <span className="text-slate-200">Groq (L3.1-70B)</span></span>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8 flex-1 max-w-[1600px] w-full mx-auto">
        
        {/* PREMIUM BENTO GRID KPI METRICS */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0b0c10] border border-[#141722] p-5 rounded-xl">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Asset Target</span>
            <span className="text-base font-bold text-slate-200 mt-1 block font-mono">AAPL // EQUITY FEED</span>
          </div>
          
          <div className="bg-[#0b0c10] border border-[#141722] p-5 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Algorithmic Valuation</span>
            <span className="text-2xl font-semibold text-white tracking-tight font-mono mt-1">${currentPrice.toFixed(2)}</span>
          </div>

          <div className="bg-[#0b0c10] border border-[#141722] p-5 rounded-xl flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block">Network Data Velocity</span>
            <span className="text-2xl font-semibold text-slate-200 tracking-tight font-mono mt-1">
              {currentVolume.toLocaleString()} <span className="text-xs text-slate-500 font-normal">U/S</span>
            </span>
          </div>

          {/* ROI BUSINESS IMPACT METRIC */}
          <div className="bg-[#0e0a0d] border border-red-950/40 p-5 rounded-xl relative overflow-hidden group">
            <span className="text-[10px] font-mono uppercase tracking-wider text-red-400 font-semibold flex items-center gap-1">
              <Clock className="h-3 w-3 text-red-400" /> Capital Loss Mitigated
            </span>
            <span className="text-2xl font-bold text-red-400 tracking-tight font-mono mt-1 block">
              ${(insights.reduce((acc, curr) => acc + curr.score * 1250, 0)).toLocaleString()}
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/0 to-red-500/[0.02] pointer-events-none" />
          </div>
        </section>

        {/* WORKSPACE OPERATIONS ENVIRONMENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* VISUAL MONITORING CANVAS */}
          <div className="lg:col-span-2 bg-[#0b0c10] border border-[#141722] rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[11px] font-bold tracking-widest text-slate-400 uppercase font-mono">Ingested Data Pipeline</h2>
                <p className="text-sm text-slate-500 mt-0.5">Live streaming multi-dimensional metric validation canvas</p>
              </div>
              <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-500 bg-[#06070a] px-2.5 py-1 rounded border border-[#141722]">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>POLLING_ACTIVE_1HZ</span>
              </div>
            </div>

            <div className="w-full bg-[#06070a] border border-[#141722] rounded-xl relative p-6 overflow-hidden min-h-[360px] flex items-end justify-center">
              {streamData.length > 1 ? (
                <div className="w-full h-full min-h-[300px] relative flex flex-col justify-between">
                  
                  {/* CLEAN DESIGN GRAPH GRID */}
                  <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.02]">
                    <div className="border-b border-white w-full h-px" />
                    <div className="border-b border-white w-full h-px" />
                    <div className="border-b border-white w-full h-px" />
                  </div>

                  <svg className="w-full h-full min-h-[260px] z-10" viewBox="0 0 500 150" preserveAspectRatio="none">
                    {/* Render elegant, high-contrast paths */}
                    {streamData.map((d, index) => {
                      const x = (index / (streamData.length - 1)) * 500;
                      const y = 150 - ((d.price - minPrice) / (maxPrice - minPrice)) * 120;
                      
                      return (
                        <g key={index}>
                          {index > 0 && (
                            <line 
                              x1={((index - 1) / (streamData.length - 1)) * 500} 
                              y1={150 - ((streamData[index - 1].price - minPrice) / (maxPrice - minPrice)) * 120} 
                              x2={x} 
                              y2={y} 
                              stroke={d.isAnomaly ? "#ef4444" : "#475569"} 
                              strokeWidth={d.isAnomaly ? "2" : "1.2"} 
                              opacity={d.isAnomaly ? "1" : "0.5"}
                            />
                          )}
                          {d.isAnomaly && (
                            <g>
                              <circle cx={x} cy={y} r="3" fill="#ef4444" />
                              <circle cx={x} cy={y} r="8" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.4" className="animate-pulse" />
                            </g>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                  
                  <div className="flex items-center justify-between font-mono text-[9px] text-slate-600 pt-3 border-t border-[#141722]">
                    <span>SYS_FRAME_WINDOW: 40 VECTOR_POINTS</span>
                    <span>MAX_BOUND: {maxPrice.toFixed(1)}</span>
                    <span>MIN_BOUND: {minPrice.toFixed(1)}</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center space-y-2 text-center p-8 font-mono text-xs">
                  <RefreshCw className="h-4 w-4 text-slate-500 animate-spin" />
                  <p className="text-slate-500">Connecting downstream pipeline arrays...</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT FORENSICS TERMINAL PANEL */}
          <div className="bg-[#0b0c10] border border-[#141722] rounded-xl p-6 flex flex-col min-h-[475px]">
            <div className="flex items-center justify-between pb-4 border-b border-[#141722]">
              <div className="flex items-center space-x-2">
                <ShieldAlert className="h-4 w-4 text-slate-400" />
                <h2 className="text-xs font-bold tracking-wider text-slate-200 uppercase font-mono">AI Incident Logs</h2>
              </div>
              <span className="text-[9px] font-mono tracking-wider bg-slate-400/5 border border-slate-500/10 text-slate-400 px-2 py-0.5 rounded">
                PROCESSED
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto mt-4 space-y-3 max-h-[380px] pr-1 scrollbar">
              {insights.length > 0 ? (
                insights.map((insight) => (
                  <div key={insight.anomaly_id} className="bg-[#06070a] border border-[#141722] p-4 rounded-lg flex flex-col space-y-2 hover:border-red-500/20 transition-all group">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <div className="flex items-center space-x-1.5 text-red-400 font-bold">
                        <AlertTriangle className="h-3 w-3" />
                        <span>ISOLATION ALERT // VECTOR {insight.score}</span>
                      </div>
                      <span className="text-[9px] text-slate-500">
                        {new Date(insight.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {insight.ai_executive_summary}
                    </p>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-[#141722] rounded-xl font-mono text-slate-600">
                  <Cpu className="h-5 w-5 text-slate-700 animate-pulse mb-2" />
                  <p className="text-xs">Monitoring streams...</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Isolation Forest reporting nominal baseline conditions.</p>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}