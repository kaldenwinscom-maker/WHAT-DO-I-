"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";

// ─── TYPES ────────────────────────────────────────────────────────────────────
type Page = "landing"|"auth"|"dashboard"|"chat"|"agents"|"workflows"|"crm"|"analytics"|"files"|"team"|"settings"|"admin";
type Plan = "free"|"pro"|"agency";
interface User { id:string; name:string; email:string; plan:Plan; role:string; company:string; avatar:string; }
interface Msg { id:string; role:"user"|"assistant"; content:string; time:Date; model?:string; }
interface Conv { id:string; title:string; agentType?:string; model:string; messages:Msg[]; updatedAt:Date; }
interface WFNode { id:string; type:string; label:string; x:number; y:number; color:string; icon:string; }
interface Workflow { id:string; name:string; description:string; active:boolean; nodes:WFNode[]; runs:number; lastRun?:string; }
interface Lead { id:string; company:string; name:string; email:string; status:string; score:number; value:number; source:string; }
interface Deal { id:string; title:string; company:string; value:number; stage:string; probability:number; }
interface UpFile { id:string; name:string; type:string; size:number; uploadedAt:string; summary?:string; }
interface TeamMember { id:string; name:string; email:string; role:string; status:string; }
interface Notif { id:string; type:string; title:string; body:string; read:boolean; }
interface Toast { id:string; type:"success"|"error"|"info"; msg:string; }

// ─── ICONS ────────────────────────────────────────────────────────────────────
const I = ({ n, s=18, c="currentColor" }: { n:string; s?:number; c?:string }) => {
  const icons: Record<string,React.ReactElement> = {
    brain: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.98-3 2.5 2.5 0 0 1-1.32-4.24 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.96-3.11A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.98-3 2.5 2.5 0 0 0 1.32-4.24 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.96-3.11A2.5 2.5 0 0 0 14.5 2Z"/></svg>,
    zap: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    users: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    chart: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    msg: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
    workflow: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><rect x="3" y="3" width="5" height="5" rx="1"/><rect x="16" y="3" width="5" height="5" rx="1"/><rect x="16" y="16" width="5" height="5" rx="1"/><path d="M5.5 8v3c0 1.1.9 2 2 2H12"/><path d="M12 13h1.5a2 2 0 0 1 2 2v1"/><path d="M12 13V8"/></svg>,
    settings: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    home: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    file: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
    crm: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>,
    send: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
    plus: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
    x: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    check: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
    arrow: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    crown: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/><path d="M5 20h14"/></svg>,
    robot: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8" y2="16"/><line x1="16" y1="16" x2="16" y2="16"/><path d="M9 19h6"/></svg>,
    trending: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    bell: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    search: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    upload: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>,
    mic: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>,
    star: <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
    logout: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    menu: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    copy: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    eye: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
    eyeoff: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
    shield: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    globe: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
    code: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
    trash: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    edit: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    link: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
    key: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    mail: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    target: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    dollar: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
    download: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
    adduser: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>,
    filter: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
    play: <svg width={s} height={s} viewBox="0 0 24 24" fill={c} stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    pause: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>,
    refresh: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.95"/></svg>,
    analytics: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    lock: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    calendar: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    database: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
    sparkles: <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.8"><path d="M12 3l1.88 5.76L19.64 9l-4.88 3.56L16.64 18.44 12 15l-4.64 3.44 1.88-5.88L4.36 9l5.76-.24z"/></svg>,
  };
  return icons[n] || <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill={c}/></svg>;
};

// ─── ANIMATED BACKGROUND ─────────────────────────────────────────────────────
const AnimatedBg = () => (
  <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>
    <div style={{ position:"absolute", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(108,99,255,0.10) 0%, transparent 70%)", top:"-200px", left:"-150px", animation:"morph 14s ease-in-out infinite" }}/>
    <div style={{ position:"absolute", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle, rgba(0,212,170,0.07) 0%, transparent 70%)", bottom:"-100px", right:"-100px", animation:"morph 18s ease-in-out infinite reverse" }}/>
    <div style={{ position:"absolute", width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle, rgba(167,139,250,0.06) 0%, transparent 70%)", top:"50%", left:"40%", animation:"morph 12s ease-in-out infinite 2s" }}/>
    <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 1px 1px, rgba(255,255,255,0.025) 1px, transparent 0)", backgroundSize:"40px 40px" }}/>
  </div>
);

// ─── TOAST SYSTEM ─────────────────────────────────────────────────────────────
const ToastContainer = ({ toasts, onRemove }: { toasts:Toast[]; onRemove:(id:string)=>void }) => (
  <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8 }}>
    {toasts.map(t => (
      <div key={t.id} className="toast" style={{ animation:"slide-up 0.3s cubic-bezier(0.22,1,0.36,1)" }}>
        <div style={{ width:8, height:8, borderRadius:"50%", background: t.type==="success"?"var(--accent2)":t.type==="error"?"var(--accent3)":"var(--accent)", flexShrink:0 }}/>
        <span style={{ fontSize:14, color:"var(--text)" }}>{t.msg}</span>
        <button onClick={()=>onRemove(t.id)} style={{ background:"none", border:"none", color:"var(--text3)", cursor:"pointer", marginLeft:"auto", padding:2 }}><I n="x" s={14}/></button>
      </div>
    ))}
  </div>
);

// ─── MINI LINE CHART ──────────────────────────────────────────────────────────
const MiniLineChart = ({ data, color="#6c63ff", height=60 }: { data:number[]; color?:string; height?:number }) => {
  const w = 200; const h = height;
  const max = Math.max(...data); const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v,i) => `${(i/(data.length-1))*w},${h - ((v-min)/range)*(h-8)-4}`).join(" ");
  const area = `M ${pts.split(" ").join(" L ")} L ${w},${h} L 0,${h} Z`;
  return (
    <svg width="100%" height={height} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id={`grad-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color.replace("#","")})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// ─── BAR CHART ────────────────────────────────────────────────────────────────
const BarChart = ({ data, labels, color="#6c63ff" }: { data:number[]; labels:string[]; color?:string }) => {
  const max = Math.max(...data) || 1;
  return (
    <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:120 }}>
      {data.map((v,i) => (
        <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
          <div style={{ width:"100%", background: color+"22", borderRadius:"4px 4px 0 0", position:"relative", height:((v/max)*100)+"%" }}>
            <div style={{ position:"absolute", inset:0, background:`linear-gradient(180deg, ${color}, ${color}aa)`, borderRadius:"4px 4px 0 0" }}/>
          </div>
          <span style={{ fontSize:10, color:"var(--text3)", whiteSpace:"nowrap" }}>{labels[i]}</span>
        </div>
      ))}
    </div>
  );
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_USER: User = { id:"u1", name:"Alex Johnson", email:"alex@acme.com", plan:"pro", role:"admin", company:"Acme Corp", avatar:"AJ" };

const AGENTS = [
  { id:"a1", name:"Marketing AI", type:"marketing", emoji:"📣", color:"#6c63ff", desc:"Campaigns, copy & growth strategy", msgs:1240, status:"online" },
  { id:"a2", name:"Sales AI", type:"sales", emoji:"💰", color:"#00d4aa", desc:"Outreach, follow-ups & CRM automation", msgs:893, status:"online" },
  { id:"a3", name:"Copy AI", type:"copywriting", emoji:"✍️", color:"#34d399", desc:"Blog posts, emails & ad copy", msgs:2105, status:"online" },
  { id:"a4", name:"Research AI", type:"research", emoji:"🔬", color:"#f5a623", desc:"Analysis, summaries & reports", msgs:672, status:"busy" },
  { id:"a5", name:"Support AI", type:"support", emoji:"💬", color:"#ff6b6b", desc:"Tickets, FAQs & customer responses", msgs:3201, status:"online" },
  { id:"a6", name:"Social AI", type:"social", emoji:"📱", color:"#a78bfa", desc:"Posts, captions & platform strategy", msgs:1544, status:"online" },
];

const MOCK_CONVS: Conv[] = [
  { id:"c1", title:"Marketing Strategy Q4", agentType:"marketing", model:"gpt-4o", messages:[
    { id:"m1", role:"user", content:"Help me create a Q4 marketing strategy for our SaaS product.", time:new Date(Date.now()-3600000) },
    { id:"m2", role:"assistant", content:"I'll help you build a comprehensive Q4 marketing strategy. Here's a high-level framework:\n\n**Q4 Marketing Strategy Framework**\n\n1. **Holiday Campaign (Nov–Dec)**\n   - Black Friday SaaS deals (40% off annual plans)\n   - Year-end \"New Year, New Tools\" campaign\n   - Gift guides targeting decision-makers\n\n2. **Content Calendar**\n   - Weekly case studies showcasing ROI\n   - LinkedIn thought leadership posts (3x/week)\n   - Email nurture sequence (8-part series)\n\n3. **Paid Acquisition**\n   - Google Ads: target \"AI tool for business\" keywords\n   - LinkedIn Ads: target CTOs & Growth Managers\n   - Retargeting budget: 30% of total ad spend\n\n4. **Key Metrics to Track**\n   - CAC target: under $120\n   - Trial-to-paid conversion: 25%+\n   - MRR growth target: 18%\n\nWant me to drill down into any specific area?", time:new Date(Date.now()-3540000), model:"gpt-4o" },
  ], updatedAt:new Date(Date.now()-3540000) },
  { id:"c2", title:"Cold Email Sequence", agentType:"sales", model:"claude-sonnet-4-6", messages:[
    { id:"m3", role:"user", content:"Write a 5-email cold outreach sequence for selling our AI platform to marketing agencies.", time:new Date(Date.now()-86400000) },
    { id:"m4", role:"assistant", content:"Here's a 5-email cold outreach sequence optimized for marketing agencies:\n\n**Email 1 – Pattern Interrupt (Day 1)**\nSubject: Your competitors are already using this\n\nHi {{first_name}},\n\nNoticed {{company}} does impressive work for clients like {{client_example}}.\n\nQuick question: how much time does your team spend on content creation vs. strategy?\n\nMost agencies I talk to say 60%+ goes to execution. We fix that.\n\nWorth a 15-min call this week?\n\n**Email 2 – Social Proof (Day 3)**\nSubject: How Agency X cut content costs by 70%\n\n...\n\nWant me to write all 5 emails in full?", time:new Date(Date.now()-86340000), model:"claude-sonnet-4-6" },
  ], updatedAt:new Date(Date.now()-86340000) },
  { id:"c3", title:"Blog Post: AI Trends 2025", agentType:"copywriting", model:"gpt-4o-mini", messages:[
    { id:"m5", role:"user", content:"Write a 500-word blog post about AI trends for 2025.", time:new Date(Date.now()-172800000) },
    { id:"m6", role:"assistant", content:"# 5 AI Trends That Will Define Business in 2025\n\nThe AI revolution isn't coming — it's already here. But 2025 promises to be the year when AI stops being a novelty and becomes the backbone of how businesses operate.\n\n**1. Agentic AI Takes Over Workflows**\n\nForget chatbots that answer questions. The next wave of AI agents will autonomously execute multi-step business processes...", time:new Date(Date.now()-172740000), model:"gpt-4o-mini" },
  ], updatedAt:new Date(Date.now()-172740000) },
];

const MOCK_LEADS: Lead[] = [
  { id:"l1", company:"TechFlow Inc", name:"Sarah Chen", email:"sarah@techflow.com", status:"qualified", score:87, value:12000, source:"LinkedIn" },
  { id:"l2", company:"Veloce Agency", name:"Marcus Rodriguez", email:"m.rod@veloce.io", status:"proposal", score:92, value:28000, source:"Referral" },
  { id:"l3", company:"Apex Growth", name:"Priya Sharma", email:"priya@apex.co", status:"contacted", score:65, value:8500, source:"Website" },
  { id:"l4", company:"NexGen Labs", name:"James Wilson", email:"jwilson@nexgen.io", status:"new", score:45, value:5000, source:"Cold Email" },
  { id:"l5", company:"Orbital Digital", name:"Emma Davis", email:"emma@orbital.com", status:"negotiation", score:95, value:45000, source:"Partner" },
  { id:"l6", company:"Spark Creative", name:"Tom Baker", email:"tom@spark.io", status:"closed_won", score:100, value:18000, source:"LinkedIn" },
];

const MOCK_DEALS: Record<string, Deal[]> = {
  new: [
    { id:"d1", title:"Enterprise License", company:"NexGen Labs", value:5000, stage:"new", probability:20 },
    { id:"d2", title:"Starter Plan x5", company:"Bloom Digital", value:2450, stage:"new", probability:30 },
  ],
  contacted: [
    { id:"d3", title:"Agency Package", company:"Apex Growth", value:8500, stage:"contacted", probability:45 },
  ],
  proposal: [
    { id:"d4", title:"Pro Annual", company:"Veloce Agency", value:28000, stage:"proposal", probability:70 },
    { id:"d5", title:"Team License", company:"DataSync", value:12000, stage:"proposal", probability:65 },
  ],
  closed: [
    { id:"d6", title:"Enterprise Deal", company:"Orbital Digital", value:45000, stage:"closed", probability:100 },
  ],
};

const MOCK_FILES: UpFile[] = [
  { id:"f1", name:"Q4_Strategy_Deck.pdf", type:"application/pdf", size:2457600, uploadedAt:"2025-05-01", summary:"Executive strategy deck covering Q4 marketing initiatives, budget allocation, and KPI targets." },
  { id:"f2", name:"Customer_Research.docx", type:"application/vnd.openxmlformats-officedocument.wordprocessingml.document", size:891904, uploadedAt:"2025-05-03" },
  { id:"f3", name:"Brand_Assets.png", type:"image/png", size:1245184, uploadedAt:"2025-05-06" },
  { id:"f4", name:"Sales_Data_April.csv", type:"text/csv", size:45056, uploadedAt:"2025-05-07", summary:"April sales data with 156 transactions, $124K total revenue, 23% growth MoM." },
  { id:"f5", name:"Competitor_Analysis.pdf", type:"application/pdf", size:3145728, uploadedAt:"2025-05-08" },
];

const MOCK_TEAM: TeamMember[] = [
  { id:"t1", name:"Alex Johnson", email:"alex@acme.com", role:"admin", status:"active" },
  { id:"t2", name:"Maya Patel", email:"maya@acme.com", role:"member", status:"active" },
  { id:"t3", name:"Chris Lee", email:"chris@acme.com", role:"member", status:"active" },
  { id:"t4", name:"Jordan Kim", email:"jordan@acme.com", role:"viewer", status:"active" },
  { id:"t5", name:"Sam Rivera", email:"sam@acme.com", role:"member", status:"invited" },
];

const MOCK_WORKFLOWS: Workflow[] = [
  {
    id:"w1", name:"Lead Capture → AI Email", description:"Auto-qualify leads and send personalized outreach", active:true, runs:247, lastRun:"2 hours ago",
    nodes:[
      { id:"n1", type:"trigger", label:"Form Submit", x:40, y:80, color:"#6c63ff", icon:"link" },
      { id:"n2", type:"action", label:"AI Qualify Lead", x:220, y:80, color:"#f5a623", icon:"sparkles" },
      { id:"n3", type:"action", label:"Send Email", x:400, y:80, color:"#00d4aa", icon:"mail" },
      { id:"n4", type:"action", label:"Update CRM", x:580, y:80, color:"#a78bfa", icon:"database" },
    ],
  },
  {
    id:"w2", name:"Weekly Report Generator", description:"Auto-generate and send analytics reports every Monday", active:true, runs:12, lastRun:"2 days ago",
    nodes:[
      { id:"n5", type:"trigger", label:"Schedule (Mon 9am)", x:40, y:80, color:"#6c63ff", icon:"calendar" },
      { id:"n6", type:"action", label:"Fetch Analytics", x:220, y:80, color:"#f5a623", icon:"analytics" },
      { id:"n7", type:"action", label:"AI Write Report", x:400, y:80, color:"#00d4aa", icon:"sparkles" },
      { id:"n8", type:"action", label:"Email Team", x:580, y:80, color:"#ff6b6b", icon:"mail" },
    ],
  },
];

const NOTIFS: Notif[] = [
  { id:"n1", type:"success", title:"Workflow completed", body:"Lead Capture workflow ran successfully — 3 leads processed", read:false },
  { id:"n2", type:"info", title:"New team member", body:"Sam Rivera accepted your invite", read:false },
  { id:"n3", type:"info", title:"AI usage at 80%", body:"You've used 80% of your monthly AI quota", read:true },
  { id:"n4", type:"success", title:"Deal closed!", body:"Orbital Digital deal — $45,000 won 🎉", read:true },
];

const REV_DATA = [18200, 21500, 19800, 24300, 22100, 28900, 26400, 31200, 29800, 35100, 32600, 38400];
const USAGE_DATA = [420, 680, 520, 890, 760, 1240, 980, 1450, 1120, 1680, 1340, 1920];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function WhatApp() {
  const [page, setPage] = useState<Page>("landing");
  const [user, setUser] = useState<User|null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login"|"signup">("login");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [notifs, setNotifs] = useState<Notif[]>(NOTIFS);
  const [showNotifs, setShowNotifs] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 1024;

  const toast = useCallback((msg:string, type:"success"|"error"|"info"="success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(p => [...p, { id, type, msg }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
  }, []);

  const removeToast = useCallback((id:string) => setToasts(p => p.filter(t => t.id !== id)), []);

  const nav = useCallback((p: Page) => {
    if (!user && p !== "landing" && p !== "auth") { setPage("auth"); return; }
    setPage(p);
    setSidebarOpen(false);
  }, [user]);

  const login = useCallback((u: User) => { setUser(u); setPage("dashboard"); toast("Welcome back, " + u.name + "!"); }, [toast]);
  const logout = useCallback(() => { setUser(null); setPage("landing"); toast("Signed out successfully", "info"); }, [toast]);

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <>
      <AnimatedBg />
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {page === "landing" && <LandingPage onNav={nav} />}
      {page === "auth" && <AuthPage mode={authMode} setMode={setAuthMode} onLogin={login} onNav={nav} toast={toast} />}
      {user && !["landing","auth"].includes(page) && (
        <AppShell page={page} user={user} onNav={nav} onLogout={logout} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} notifs={notifs} setNotifs={setNotifs} unreadCount={unreadCount} showNotifs={showNotifs} setShowNotifs={setShowNotifs} toast={toast} />
      )}
    </>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────
function LandingPage({ onNav }: { onNav:(p:Page)=>void }) {
  const [scrolled, setScrolled] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number|null>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const features = [
    { icon:"brain", title:"Multi-Model AI", desc:"Switch between GPT-4o, Claude 3.5, and Gemini seamlessly for best results", color:"var(--accent)" },
    { icon:"workflow", title:"Workflow Automation", desc:"Build powerful Zapier-like automations with triggers, conditions, and actions", color:"var(--accent2)" },
    { icon:"users", title:"Team Collaboration", desc:"Invite your team, share workspaces, and manage permissions by role", color:"#a78bfa" },
    { icon:"shield", title:"Enterprise Security", desc:"SOC2 compliant, end-to-end encryption, rate limiting, and audit logs", color:"var(--accent4)" },
    { icon:"analytics", title:"Deep Analytics", desc:"Real-time dashboards for AI usage, ROI tracking, and team productivity", color:"var(--accent3)" },
    { icon:"code", title:"API First", desc:"Full REST API, webhooks, and SDKs to integrate with any existing system", color:"#34d399" },
  ];

  const plans = [
    { name:"Starter", price:"0", period:"Free forever", features:["3 AI Agents","100 messages/mo","Basic templates","Community support","1 user"], cta:"Get Started Free", highlight:false },
    { name:"Pro", price:"49", period:"/month", features:["15 AI Agents","Unlimited messages","Workflow automation","5 team members","Priority support","Analytics dashboard","File uploads (10GB)"], cta:"Start 14-Day Trial", highlight:true },
    { name:"Agency", price:"149", period:"/month", features:["Unlimited agents","Unlimited messages","White-label option","25 team members","Custom integrations","Dedicated account manager","SLA guarantee","Admin panel"], cta:"Contact Sales", highlight:false },
  ];

  const testimonials = [
    { name:"Sarah Chen", role:"CMO at TechFlow", avatar:"SC", text:"WHAT reduced our content production time by 80%. The marketing agent writes better copy than our junior team. Absolute game changer.", rating:5 },
    { name:"Marcus Rodriguez", role:"Founder, Veloce", avatar:"MR", text:"Replaced 3 separate SaaS tools with WHAT. The workflow automation alone saves us 20 hours a week. The ROI is insane.", rating:5 },
    { name:"Priya Sharma", role:"Head of Growth, Apex", avatar:"PS", text:"Our sales team closes 40% more deals since using the Sales AI agent daily. The personalization is unreal.", rating:5 },
  ];

  const faqs = [
    { q:"Do I need coding skills to use WHAT?", a:"No coding required. WHAT is designed for business users. You can build workflows, configure agents, and run automations with a drag-and-drop interface." },
    { q:"Which AI models are supported?", a:"We support OpenAI GPT-4o and GPT-4o Mini, Anthropic Claude 3.5 Sonnet and Haiku, and Google Gemini 1.5 Pro and Flash. You can switch between models per conversation." },
    { q:"How is my data protected?", a:"Your data is encrypted at rest and in transit. We never use your conversations to train AI models. WHAT is SOC2 Type II compliant." },
    { q:"Can I bring my own API keys?", a:"Yes! You can use your own OpenAI, Anthropic, or Gemini API keys in Settings. This lets you control costs and access your own rate limits." },
    { q:"Is there a free trial?", a:"The Starter plan is free forever with 100 messages/month. Pro plans include a 14-day free trial with no credit card required." },
  ];

  const r3 = "28px";

  return (
    <div style={{ position:"relative", zIndex:1 }}>
      {/* Navbar */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"0 32px", background:scrolled?"rgba(6,8,16,0.9)":"transparent", backdropFilter:scrolled?"blur(20px)":"none", borderBottom:scrolled?"1px solid var(--border)":"none", transition:"all 0.3s", display:"flex", alignItems:"center", justifyContent:"space-between", height:68 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer" }} onClick={()=>onNav("landing")}>
          <div style={{ width:36, height:36, borderRadius:10, background:"linear-gradient(135deg, var(--accent), #9c63ff)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px var(--glow)" }}>
            <I n="brain" s={18} c="#fff"/>
          </div>
          <span style={{ fontFamily:"Syne, sans-serif", fontWeight:800, fontSize:18, letterSpacing:"-0.5px" }}>WHAT</span>
        </div>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          <div className="hide-mobile" style={{ display:"flex", gap:2 }}>
            {["Features","Pricing","Agents"].map(item => (
              <button key={item} style={{ background:"none", border:"none", color:"var(--text2)", fontSize:14, padding:"8px 14px", cursor:"pointer", borderRadius:8, transition:"color 0.15s", fontFamily:"DM Sans, sans-serif" }}
                onMouseEnter={e=>(e.currentTarget.style.color="var(--text)")} onMouseLeave={e=>(e.currentTarget.style.color="var(--text2)")}>{item}</button>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm" style={{ marginLeft:8 }} onClick={()=>onNav("auth")}>Sign in</button>
          <button className="btn btn-primary btn-sm" onClick={()=>{ onNav("auth"); }}>Get Started <I n="arrow" s={13}/></button>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:"120px 24px 80px", textAlign:"center" }}>
        <div style={{ maxWidth:800, animation:"slide-up 0.8s cubic-bezier(0.22,1,0.36,1) both" }}>
          <div className="tag glass2" style={{ marginBottom:24, display:"inline-flex", color:"var(--accent2)", border:"1px solid rgba(0,212,170,0.3)", gap:6 }}>
            <I n="sparkles" s={12} c="var(--accent2)"/> Now with Claude 3.5 + GPT-4o
          </div>
          <h1 style={{ fontSize:"clamp(44px,7vw,82px)", fontWeight:800, lineHeight:1.05, letterSpacing:"-3px", marginBottom:24 }}>
            Scale Your Business<br/>
            <span className="gradient-text">With AI Employees</span>
          </h1>
          <p style={{ fontSize:19, color:"var(--text2)", lineHeight:1.7, marginBottom:40, maxWidth:560, margin:"0 auto 40px" }}>
            Deploy intelligent AI agents that handle marketing, sales, support, and operations — all in one unified workspace built for modern teams.
          </p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap" }}>
            <button className="btn btn-primary btn-lg" onClick={()=>onNav("auth")}>Start Free Today <I n="arrow" s={16}/></button>
            <button className="btn btn-ghost btn-lg">Watch Demo ▶</button>
          </div>
          <div style={{ marginTop:56, display:"flex", gap:48, justifyContent:"center", flexWrap:"wrap" }}>
            {[["12K+","Active teams"],["94M+","AI messages"],["99.9%","Uptime SLA"]].map(([n,l]) => (
              <div key={l} style={{ textAlign:"center" }}>
                <div style={{ fontSize:30, fontWeight:800, fontFamily:"Syne, sans-serif", background:"linear-gradient(135deg, var(--text), var(--text2))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{n}</div>
                <div style={{ fontSize:13, color:"var(--text3)", marginTop:2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding:"80px 32px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:60 }}>
          <div className="tag glass" style={{ marginBottom:16, display:"inline-flex", color:"var(--text2)" }}>Platform Features</div>
          <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:"-1.5px", marginBottom:16 }}>Everything your team needs</h2>
          <p style={{ color:"var(--text2)", fontSize:16, maxWidth:480, margin:"0 auto" }}>Built for teams that move fast without sacrificing quality or security.</p>
        </div>
        <div className="grid-3" style={{ gap:20 }}>
          {features.map((f,i) => (
            <div key={f.title} className="glass" style={{ padding:28, borderRadius:20, animation:`slide-up 0.6s cubic-bezier(0.22,1,0.36,1) ${i*0.08}s both`, cursor:"default", transition:"all 0.2s" }}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.transform="translateY(-4px)"; (e.currentTarget as HTMLElement).style.borderColor="var(--border2)"; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.transform="none"; (e.currentTarget as HTMLElement).style.borderColor="var(--border)"; }}>
              <div style={{ width:44, height:44, borderRadius:12, background:f.color+"20", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>
                <I n={f.icon} s={20} c={f.color}/>
              </div>
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:8 }}>{f.title}</h3>
              <p style={{ color:"var(--text2)", fontSize:14, lineHeight:1.6 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Agents Showcase */}
      <section style={{ padding:"80px 32px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:60 }}>
          <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:"-1.5px", marginBottom:16 }}>Meet your AI team</h2>
          <p style={{ color:"var(--text2)", fontSize:16 }}>Specialized agents trained for every core business function.</p>
        </div>
        <div className="grid-3" style={{ gap:16 }}>
          {AGENTS.map((a,i) => (
            <div key={a.id} className="glass" style={{ padding:"22px 24px", borderRadius:20, display:"flex", alignItems:"center", gap:16, cursor:"pointer", transition:"all 0.2s", animation:`slide-up 0.6s cubic-bezier(0.22,1,0.36,1) ${i*0.08}s both` }}
              onClick={()=>onNav("auth")}
              onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background="var(--surface2)"; (e.currentTarget as HTMLElement).style.borderColor="var(--border2)"; (e.currentTarget as HTMLElement).style.transform="translateY(-2px)"; }}
              onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="var(--surface)"; (e.currentTarget as HTMLElement).style.borderColor="var(--border)"; (e.currentTarget as HTMLElement).style.transform="none"; }}>
              <div style={{ width:48, height:48, borderRadius:14, background:a.color+"20", border:`1px solid ${a.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0 }}>{a.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:600, marginBottom:2 }}>{a.name}</div>
                <div style={{ fontSize:12, color:"var(--text3)" }}>{a.desc}</div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:4 }}>
                <span className="status-dot online"/>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding:"80px 32px", maxWidth:1000, margin:"0 auto" }} id="pricing">
        <div style={{ textAlign:"center", marginBottom:60 }}>
          <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:"-1.5px", marginBottom:16 }}>Simple, transparent pricing</h2>
          <p style={{ color:"var(--text2)" }}>Start free. Scale as you grow. No hidden fees ever.</p>
        </div>
        <div className="grid-3" style={{ gap:20, alignItems:"stretch" }}>
          {plans.map((p,i) => (
            <div key={p.name} style={{ padding:32, borderRadius:r3, background:p.highlight?"linear-gradient(135deg, rgba(108,99,255,0.15), rgba(108,99,255,0.05))":"var(--surface)", border:p.highlight?"1px solid rgba(108,99,255,0.4)":"1px solid var(--border)", position:"relative", overflow:"hidden", boxShadow:p.highlight?"0 0 60px rgba(108,99,255,0.15)":"none", animation:`slide-up 0.6s cubic-bezier(0.22,1,0.36,1) ${i*0.1}s both`, display:"flex", flexDirection:"column" }}>
              {p.highlight && <div style={{ position:"absolute", top:16, right:16 }}><span className="tag" style={{ background:"var(--accent)", color:"#fff", fontSize:11 }}>Most Popular</span></div>}
              {p.highlight && <div style={{ position:"absolute", inset:0, pointerEvents:"none", background:"radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.2), transparent 60%)" }}/>}
              <div style={{ marginBottom:24 }}>
                <div style={{ fontSize:12, color:"var(--text2)", marginBottom:8, textTransform:"uppercase", letterSpacing:"1px", fontWeight:600 }}>{p.name}</div>
                <div style={{ display:"flex", alignItems:"baseline", gap:2 }}>
                  <span style={{ fontSize:16, color:"var(--text2)" }}>$</span>
                  <span style={{ fontSize:52, fontWeight:800, fontFamily:"Syne, sans-serif", letterSpacing:"-2px" }}>{p.price}</span>
                  <span style={{ fontSize:13, color:"var(--text3)", marginLeft:2 }}>{p.period}</span>
                </div>
              </div>
              <div style={{ flex:1, marginBottom:28 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                    <div style={{ width:18, height:18, borderRadius:"50%", background:p.highlight?"rgba(108,99,255,0.2)":"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <I n="check" s={10} c={p.highlight?"var(--accent)":"var(--text3)"}/>
                    </div>
                    <span style={{ fontSize:14, color:"var(--text2)" }}>{f}</span>
                  </div>
                ))}
              </div>
              <button className={`btn ${p.highlight?"btn-primary":"btn-ghost"}`} style={{ width:"100%", justifyContent:"center" }} onClick={()=>onNav("auth")}>{p.cta}</button>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding:"80px 32px", maxWidth:1000, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:60 }}>
          <h2 style={{ fontSize:"clamp(28px,4vw,48px)", fontWeight:800, letterSpacing:"-1.5px", marginBottom:16 }}>Loved by 12,000+ teams</h2>
        </div>
        <div className="grid-3" style={{ gap:20 }}>
          {testimonials.map((t,i) => (
            <div key={t.name} className="glass" style={{ padding:28, borderRadius:20, animation:`slide-up 0.6s cubic-bezier(0.22,1,0.36,1) ${i*0.1}s both` }}>
              <div style={{ display:"flex", marginBottom:12 }}>
                {[1,2,3,4,5].map(s => <I key={s} n="star" s={14} c="#f5a623"/>)}
              </div>
              <p style={{ fontSize:14, color:"var(--text2)", lineHeight:1.7, marginBottom:20, fontStyle:"italic" }}>"{t.text}"</p>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:"50%", background:"linear-gradient(135deg, var(--accent), var(--accent2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:700, color:"#fff" }}>{t.avatar}</div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600 }}>{t.name}</div>
                  <div style={{ fontSize:12, color:"var(--text3)" }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding:"80px 32px", maxWidth:700, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:48 }}>
          <h2 style={{ fontSize:"clamp(24px,3vw,40px)", fontWeight:800, letterSpacing:"-1px", marginBottom:16 }}>Frequently Asked Questions</h2>
        </div>
        {faqs.map((f,i) => (
          <div key={i} className="glass" style={{ marginBottom:12, borderRadius:16, overflow:"hidden" }}>
            <button style={{ width:"100%", padding:"18px 22px", background:"none", border:"none", color:"var(--text)", fontSize:15, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between", gap:12, fontFamily:"DM Sans, sans-serif", textAlign:"left" }} onClick={()=>setFaqOpen(faqOpen===i?null:i)}>
              {f.q}
              <div style={{ transform:faqOpen===i?"rotate(45deg)":"none", transition:"transform 0.2s", flexShrink:0 }}><I n="plus" s={18} c="var(--text3)"/></div>
            </button>
            {faqOpen===i && <div style={{ padding:"0 22px 20px", fontSize:14, color:"var(--text2)", lineHeight:1.7 }}>{f.a}</div>}
          </div>
        ))}
      </section>

      {/* CTA */}
      <section style={{ padding:"80px 32px", maxWidth:700, margin:"0 auto", textAlign:"center" }}>
        <div className="glass2" style={{ padding:"60px 48px", borderRadius:r3, position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", inset:0, background:"radial-gradient(ellipse at 50% 0%, rgba(108,99,255,0.2), transparent 60%)", pointerEvents:"none" }}/>
          <h2 style={{ fontSize:"clamp(28px,4vw,46px)", fontWeight:800, letterSpacing:"-1.5px", marginBottom:16, position:"relative" }}>Ready to scale with AI?</h2>
          <p style={{ color:"var(--text2)", fontSize:16, marginBottom:36, position:"relative" }}>Join 12,000+ teams automating their business with WHAT.</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", position:"relative" }}>
            <button className="btn btn-primary btn-lg" onClick={()=>onNav("auth")}>Get Started Free <I n="arrow" s={16}/></button>
            <button className="btn btn-ghost btn-lg">Book a Demo</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop:"1px solid var(--border)", padding:"40px 32px", maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:16 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:8, background:"linear-gradient(135deg, var(--accent), #9c63ff)", display:"flex", alignItems:"center", justifyContent:"center" }}><I n="brain" s={14} c="#fff"/></div>
          <span style={{ fontFamily:"Syne, sans-serif", fontWeight:700, fontSize:16 }}>WHAT</span>
        </div>
        <div style={{ fontSize:13, color:"var(--text3)" }}>© 2025 WHAT AI Platform. All rights reserved.</div>
        <div style={{ display:"flex", gap:16 }}>
          {["Privacy","Terms","Security","API"].map(l => <a key={l} href="#" style={{ fontSize:13, color:"var(--text3)", textDecoration:"none" }}>{l}</a>)}
        </div>
      </footer>
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({ mode, setMode, onLogin, onNav, toast }: { mode:"login"|"signup"; setMode:(m:"login"|"signup")=>void; onLogin:(u:User)=>void; onNav:(p:Page)=>void; toast:(m:string,t?:"success"|"error"|"info")=>void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("alex@acme.com");
  const [pass, setPass] = useState("password");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pass) { toast("Please fill all fields", "error"); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    onLogin({ ...MOCK_USER, name: name || MOCK_USER.name, email });
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", padding:24, position:"relative", zIndex:1 }}>
      <div style={{ width:"100%", maxWidth:420 }}>
        <div style={{ textAlign:"center", marginBottom:36 }}>
          <div style={{ display:"inline-flex", alignItems:"center", gap:10, marginBottom:24 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"linear-gradient(135deg, var(--accent), #9c63ff)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 16px var(--glow)" }}><I n="brain" s={20} c="#fff"/></div>
            <span style={{ fontFamily:"Syne, sans-serif", fontWeight:800, fontSize:20 }}>WHAT</span>
          </div>
          <h1 style={{ fontSize:28, fontWeight:800, letterSpacing:"-1px", marginBottom:8 }}>{mode==="login"?"Welcome back":"Create your account"}</h1>
          <p style={{ color:"var(--text2)", fontSize:14 }}>{mode==="login"?"Sign in to your workspace":"Start your 14-day free trial"}</p>
        </div>

        <div className="glass2" style={{ borderRadius:24, padding:"32px 28px" }}>
          {/* Social Buttons */}
          <div style={{ display:"flex", gap:10, marginBottom:24 }}>
            {["Continue with Google","Continue with GitHub"].map((label, i) => (
              <button key={label} className="btn btn-ghost" style={{ flex:1, justifyContent:"center", fontSize:13 }} onClick={()=>{ onLogin(MOCK_USER); }}>
                <span>{i===0?"G":"🐙"}</span> {label.replace("Continue with ","")}
              </button>
            ))}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:24 }}>
            <div className="divider" style={{ flex:1, margin:0 }}/><span style={{ fontSize:12, color:"var(--text3)" }}>or</span><div className="divider" style={{ flex:1, margin:0 }}/>
          </div>

          <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
            {mode==="signup" && (
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, marginBottom:6, color:"var(--text2)" }}>Full Name</label>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Alex Johnson" autoComplete="name"/>
              </div>
            )}
            <div>
              <label style={{ display:"block", fontSize:13, fontWeight:500, marginBottom:6, color:"var(--text2)" }}>Email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email"/>
            </div>
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <label style={{ fontSize:13, fontWeight:500, color:"var(--text2)" }}>Password</label>
                {mode==="login" && <a href="#" style={{ fontSize:12, color:"var(--accent)", textDecoration:"none" }}>Forgot password?</a>}
              </div>
              <div style={{ position:"relative" }}>
                <input type={showPass?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" autoComplete={mode==="login"?"current-password":"new-password"} style={{ paddingRight:44 }}/>
                <button type="button" style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text3)", padding:4 }} onClick={()=>setShowPass(!showPass)}>
                  <I n={showPass?"eyeoff":"eye"} s={16}/>
                </button>
              </div>
            </div>
            {mode==="signup" && (
              <div style={{ display:"flex", alignItems:"flex-start", gap:10, marginTop:4 }}>
                <input type="checkbox" style={{ width:16, height:16, marginTop:2, flex:"none" }} required/>
                <span style={{ fontSize:13, color:"var(--text2)", lineHeight:1.5 }}>I agree to the <a href="#" style={{ color:"var(--accent)" }}>Terms of Service</a> and <a href="#" style={{ color:"var(--accent)" }}>Privacy Policy</a></span>
              </div>
            )}
            <button className="btn btn-primary" type="submit" style={{ width:"100%", justifyContent:"center", marginTop:8, padding:"13px 22px", fontSize:15 }} disabled={loading}>
              {loading ? <span style={{ display:"flex", gap:4 }}>{[0,1,2].map(i=><span key={i} className="typing-dot" style={{ animationDelay:`${i*0.2}s` }}/>)}</span> : (mode==="login"?"Sign in":"Create account")}
            </button>
          </form>

          <div style={{ textAlign:"center", marginTop:20, fontSize:14, color:"var(--text2)" }}>
            {mode==="login"?"Don't have an account? ":"Already have an account? "}
            <button style={{ background:"none", border:"none", color:"var(--accent)", cursor:"pointer", fontWeight:600, fontFamily:"DM Sans, sans-serif" }} onClick={()=>setMode(mode==="login"?"signup":"login")}>
              {mode==="login"?"Sign up free":"Sign in"}
            </button>
          </div>
        </div>

        <p style={{ textAlign:"center", marginTop:20, fontSize:12, color:"var(--text3)" }}>
          Protected by enterprise-grade encryption · SOC2 compliant
        </p>
      </div>
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
function AppShell({ page, user, onNav, onLogout, sidebarOpen, setSidebarOpen, notifs, setNotifs, unreadCount, showNotifs, setShowNotifs, toast }: {
  page:Page; user:User; onNav:(p:Page)=>void; onLogout:()=>void;
  sidebarOpen:boolean; setSidebarOpen:(v:boolean)=>void;
  notifs:Notif[]; setNotifs:(n:Notif[])=>void;
  unreadCount:number; showNotifs:boolean; setShowNotifs:(v:boolean)=>void;
  toast:(m:string,t?:"success"|"error"|"info")=>void;
}) {
  const navItems = [
    { id:"dashboard", label:"Dashboard", icon:"home" },
    { id:"chat", label:"AI Chat", icon:"msg" },
    { id:"agents", label:"AI Agents", icon:"robot" },
    { id:"workflows", label:"Workflows", icon:"workflow" },
    { id:"crm", label:"CRM", icon:"crm" },
    { id:"analytics", label:"Analytics", icon:"analytics" },
    { id:"files", label:"Files", icon:"file" },
    { id:"team", label:"Team", icon:"users" },
  ];
  const bottomItems = [
    { id:"settings", label:"Settings", icon:"settings" },
    ...(user.role==="admin"?[{ id:"admin", label:"Admin", icon:"shield" }]:[]),
  ];

  const markAllRead = () => setNotifs(notifs.map(n=>({...n,read:true})));

  const SidebarContent = () => (
    <>
      <div style={{ padding:"20px 16px 12px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:24 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg, var(--accent), #9c63ff)", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px var(--glow)" }}><I n="brain" s={16} c="#fff"/></div>
          <span style={{ fontFamily:"Syne, sans-serif", fontWeight:800, fontSize:17 }}>WHAT</span>
          <span className="tag" style={{ background:"rgba(108,99,255,0.2)", color:"var(--accent)", border:"1px solid rgba(108,99,255,0.3)", fontSize:10, marginLeft:"auto" }}>{user.plan.toUpperCase()}</span>
        </div>
        <nav style={{ display:"flex", flexDirection:"column", gap:2 }}>
          {navItems.map(item => (
            <button key={item.id} className={`nav-item ${page===item.id?"active":""}`} style={{ width:"100%", border:"none", background:"none", textAlign:"left" }} onClick={()=>onNav(item.id as Page)}>
              <I n={item.icon} s={16}/> {item.label}
            </button>
          ))}
        </nav>
      </div>
      <div style={{ flex:1 }}/>
      <div style={{ padding:"12px 16px 20px", borderTop:"1px solid var(--border)" }}>
        <nav style={{ display:"flex", flexDirection:"column", gap:2, marginBottom:16 }}>
          {bottomItems.map(item => (
            <button key={item.id} className={`nav-item ${page===item.id?"active":""}`} style={{ width:"100%", border:"none", background:"none", textAlign:"left" }} onClick={()=>onNav(item.id as Page)}>
              <I n={item.icon} s={16}/> {item.label}
            </button>
          ))}
        </nav>
        <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", borderRadius:12, background:"var(--surface)" }}>
          <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg, var(--accent), var(--accent2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", flexShrink:0 }}>{user.avatar}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.name}</div>
            <div style={{ fontSize:11, color:"var(--text3)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.email}</div>
          </div>
          <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", padding:4, borderRadius:6, flexShrink:0 }} onClick={onLogout} title="Sign out"><I n="logout" s={15}/></button>
        </div>
      </div>
    </>
  );

  const pageTitle: Record<Page,string> = { landing:"", auth:"", dashboard:"Dashboard", chat:"AI Chat", agents:"AI Agents", workflows:"Workflows", crm:"CRM", analytics:"Analytics", files:"Files", team:"Team", settings:"Settings", admin:"Admin Panel" };

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className={`sidebar ${sidebarOpen?"open":""}`}><SidebarContent/></aside>

      {/* Mobile Drawer */}
      {sidebarOpen && (
        <>
          <div className="drawer-overlay" onClick={()=>setSidebarOpen(false)}/>
          <div className="drawer" style={{ display:"flex", flexDirection:"column" }}><SidebarContent/></div>
        </>
      )}

      {/* Main Content */}
      <div className="main-content">
        {/* Top Bar */}
        <header className="page-header">
          <button className="btn btn-ghost btn-icon" style={{ display:"none" }} id="menu-btn" onClick={()=>setSidebarOpen(true)}><I n="menu" s={18}/></button>
          <style>{`@media(max-width:1024px){#menu-btn{display:flex!important}}`}</style>
          <h2 style={{ fontSize:18, fontWeight:700, flex:1 }}>{pageTitle[page]}</h2>

          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ position:"relative" }}>
              <button className="btn btn-ghost btn-icon" onClick={()=>setShowNotifs(!showNotifs)} style={{ position:"relative" }}>
                <I n="bell" s={18}/>
                {unreadCount>0 && <span className="badge" style={{ position:"absolute", top:-4, right:-4, minWidth:16, height:16, fontSize:10 }}>{unreadCount}</span>}
              </button>
              {showNotifs && (
                <>
                  <div style={{ position:"fixed", inset:0, zIndex:149 }} onClick={()=>setShowNotifs(false)}/>
                  <div className="glass2" style={{ position:"absolute", right:0, top:"calc(100% + 8px)", width:320, borderRadius:16, zIndex:150, overflow:"hidden", boxShadow:"0 16px 48px rgba(0,0,0,0.4)" }}>
                    <div style={{ padding:"14px 16px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontSize:14, fontWeight:600 }}>Notifications</span>
                      <button style={{ background:"none", border:"none", fontSize:12, color:"var(--accent)", cursor:"pointer", fontFamily:"DM Sans, sans-serif" }} onClick={markAllRead}>Mark all read</button>
                    </div>
                    {notifs.map(n => (
                      <div key={n.id} style={{ padding:"12px 16px", borderBottom:"1px solid rgba(255,255,255,0.04)", background:n.read?"transparent":"rgba(108,99,255,0.05)", cursor:"pointer" }}>
                        <div style={{ display:"flex", gap:10 }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", background:n.type==="success"?"var(--accent2)":n.type==="error"?"var(--accent3)":"var(--accent)", marginTop:5, flexShrink:0, opacity:n.read?0.3:1 }}/>
                          <div>
                            <div style={{ fontSize:13, fontWeight:600, marginBottom:2 }}>{n.title}</div>
                            <div style={{ fontSize:12, color:"var(--text3)" }}>{n.body}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div style={{ width:34, height:34, borderRadius:"50%", background:"linear-gradient(135deg, var(--accent), var(--accent2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer" }} onClick={()=>onNav("settings")}>{user.avatar}</div>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          {page==="dashboard" && <DashboardPage user={user} onNav={onNav} toast={toast}/>}
          {page==="chat" && <ChatPage user={user} toast={toast}/>}
          {page==="agents" && <AgentsPage onNav={onNav} toast={toast}/>}
          {page==="workflows" && <WorkflowsPage toast={toast}/>}
          {page==="crm" && <CRMPage toast={toast}/>}
          {page==="analytics" && <AnalyticsPage/>}
          {page==="files" && <FilesPage toast={toast}/>}
          {page==="team" && <TeamPage toast={toast}/>}
          {page==="settings" && <SettingsPage user={user} toast={toast}/>}
          {page==="admin" && <AdminPage toast={toast}/>}
        </div>
      </div>

      {/* Bottom Nav (Mobile) */}
      <nav className="bottom-nav" style={{ display:"none" }} id="bottom-nav">
        <style>{`@media(max-width:1024px){#bottom-nav{display:flex!important}}`}</style>
        {[...navItems.slice(0,4), bottomItems[0]].map(item => (
          <button key={item.id} className="bottom-nav-item" style={{ background:"none", border:"none", cursor:"pointer", color:page===item.id?"var(--accent)":"var(--text3)" }} onClick={()=>onNav(item.id as Page)}>
            <I n={item.icon} s={20} c={page===item.id?"var(--accent)":"var(--text3)"}/>
            <span style={{ fontSize:10, fontFamily:"DM Sans, sans-serif" }}>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── DASHBOARD PAGE ───────────────────────────────────────────────────────────
function DashboardPage({ user, onNav, toast }: { user:User; onNav:(p:Page)=>void; toast:(m:string,t?:"success"|"error"|"info")=>void }) {
  const stats = [
    { label:"Monthly Revenue", value:"$38.4K", change:"+12.3%", up:true, icon:"dollar", color:"var(--accent2)" },
    { label:"AI Messages", value:"94.2K", change:"+28.1%", up:true, icon:"msg", color:"var(--accent)" },
    { label:"Active Agents", value:"12", change:"+2", up:true, icon:"robot", color:"#a78bfa" },
    { label:"Team Members", value:"8", change:"0", up:true, icon:"users", color:"var(--accent4)" },
  ];
  const activity = [
    { icon:"sparkles", text:"Marketing AI completed 3 campaigns", time:"2m ago", color:"var(--accent)" },
    { icon:"check", text:"Workflow 'Lead Capture' ran successfully", time:"15m ago", color:"var(--accent2)" },
    { icon:"users", text:"Sam Rivera joined your team", time:"1h ago", color:"#a78bfa" },
    { icon:"dollar", text:"Orbital Digital deal closed — $45K", time:"3h ago", color:"var(--accent2)" },
    { icon:"msg", text:"Support AI resolved 24 tickets", time:"5h ago", color:"var(--accent3)" },
    { icon:"trending", text:"Monthly revenue milestone: $38K", time:"1d ago", color:"var(--accent4)" },
  ];
  const quickActions = [
    { label:"New Chat", icon:"msg", page:"chat" as Page, color:"var(--accent)" },
    { label:"New Workflow", icon:"workflow", page:"workflows" as Page, color:"var(--accent2)" },
    { label:"Add Lead", icon:"crm", page:"crm" as Page, color:"#a78bfa" },
    { label:"Upload File", icon:"upload", page:"files" as Page, color:"var(--accent4)" },
  ];

  return (
    <div style={{ maxWidth:1200 }}>
      {/* Welcome */}
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:26, fontWeight:800, letterSpacing:"-0.5px", marginBottom:4 }}>Good morning, {user.name.split(" ")[0]} 👋</h1>
        <p style={{ color:"var(--text2)", fontSize:14 }}>Here's what's happening with your AI workspace today.</p>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {stats.map((s,i) => (
          <div key={s.label} className="stat-card" style={{ animation:`slide-up 0.5s cubic-bezier(0.22,1,0.36,1) ${i*0.08}s both` }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <span className="stat-label">{s.label}</span>
              <div style={{ width:36, height:36, borderRadius:10, background:s.color+"18", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <I n={s.icon} s={17} c={s.color}/>
              </div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className={`stat-change ${s.up?"up":"down"}`}>
              <I n={s.up?"trending":"arrow"} s={12}/> {s.change} this month
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap:20, marginBottom:24 }}>
        {/* Revenue Chart */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>Revenue</h3>
              <p style={{ fontSize:12, color:"var(--text3)" }}>Last 12 months</p>
            </div>
            <span className="tag" style={{ background:"rgba(0,212,170,0.15)", color:"var(--accent2)", border:"1px solid rgba(0,212,170,0.25)", fontSize:12 }}>+24.3% YoY</span>
          </div>
          <MiniLineChart data={REV_DATA} color="var(--accent)" height={100}/>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            {MONTHS.map(m => <span key={m} style={{ fontSize:10, color:"var(--text3)" }}>{m}</span>)}
          </div>
        </div>

        {/* AI Usage Chart */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>AI Message Volume</h3>
              <p style={{ fontSize:12, color:"var(--text3)" }}>Last 12 months</p>
            </div>
            <span className="tag" style={{ background:"rgba(108,99,255,0.15)", color:"var(--accent)", border:"1px solid rgba(108,99,255,0.3)", fontSize:12 }}>94.2K total</span>
          </div>
          <MiniLineChart data={USAGE_DATA} color="var(--accent2)" height={100}/>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:8 }}>
            {MONTHS.map(m => <span key={m} style={{ fontSize:10, color:"var(--text3)" }}>{m}</span>)}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap:20 }}>
        {/* Recent Activity */}
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"18px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h3 style={{ fontSize:15, fontWeight:700 }}>Recent Activity</h3>
            <button style={{ background:"none", border:"none", fontSize:12, color:"var(--accent)", cursor:"pointer", fontFamily:"DM Sans" }}>View all</button>
          </div>
          {activity.map((a,i) => (
            <div key={i} className="list-item" style={{ margin:"4px 8px", borderRadius:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:a.color+"18", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><I n={a.icon} s={14} c={a.color}/></div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, color:"var(--text)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{a.text}</div>
              </div>
              <span style={{ fontSize:11, color:"var(--text3)", flexShrink:0 }}>{a.time}</span>
            </div>
          ))}
        </div>

        {/* Quick Actions + Top Agents */}
        <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Quick Actions</h3>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {quickActions.map(a => (
                <button key={a.label} className="btn btn-ghost" style={{ justifyContent:"flex-start", gap:10, padding:"12px 14px" }} onClick={()=>onNav(a.page)}>
                  <div style={{ width:28, height:28, borderRadius:8, background:a.color+"18", display:"flex", alignItems:"center", justifyContent:"center" }}><I n={a.icon} s={14} c={a.color}/></div>
                  <span style={{ fontSize:13 }}>{a.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="card" style={{ padding:20 }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Top Agents</h3>
            {AGENTS.slice(0,4).map(a => (
              <div key={a.id} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
                <div style={{ fontSize:20 }}>{a.emoji}</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>{a.name}</span>
                    <span style={{ fontSize:12, color:"var(--text3)" }}>{a.msgs.toLocaleString()}</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width:`${(a.msgs/3201)*100}%`, background:a.color }}/></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CHAT PAGE ────────────────────────────────────────────────────────────────
function ChatPage({ user, toast }: { user:User; toast:(m:string,t?:"success"|"error"|"info")=>void }) {
  const [convs, setConvs] = useState<Conv[]>(MOCK_CONVS);
  const [activeConv, setActiveConv] = useState<Conv>(MOCK_CONVS[0]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("gpt-4o");
  const [showModels, setShowModels] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const MODELS = [
    { id:"gpt-4o", name:"GPT-4o", icon:"⚡", provider:"openai" },
    { id:"gpt-4o-mini", name:"GPT-4o Mini", icon:"⚡", provider:"openai" },
    { id:"claude-sonnet-4-6", name:"Claude 3.5 Sonnet", icon:"🧠", provider:"anthropic" },
    { id:"claude-haiku-4-5-20251001", name:"Claude 3.5 Haiku", icon:"🧠", provider:"anthropic" },
    { id:"gemini-1.5-pro", name:"Gemini 1.5 Pro", icon:"💎", provider:"google" },
    { id:"gemini-1.5-flash", name:"Gemini 1.5 Flash", icon:"💎", provider:"google" },
  ];

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [activeConv.messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Msg = { id:Math.random().toString(36).slice(2), role:"user", content:input.trim(), time:new Date(), model };
    const updatedConv = { ...activeConv, messages:[...activeConv.messages, userMsg], updatedAt:new Date() };
    setActiveConv(updatedConv);
    setConvs(c => c.map(cv => cv.id===activeConv.id?updatedConv:cv));
    setInput("");
    setLoading(true);

    await new Promise(r => setTimeout(r, 1500));

    const responses: Record<string, string> = {
      default: "I understand your request. Let me help you with that.\n\nBased on what you've shared, here are my recommendations:\n\n1. **Start with the fundamentals** — Ensure your core messaging is clear and compelling before scaling any campaigns.\n\n2. **Data-driven decisions** — Use analytics to identify which channels drive the highest ROI for your specific audience.\n\n3. **Iterative testing** — Run A/B tests on key elements (headlines, CTAs, offers) before committing budget.\n\nWould you like me to dive deeper into any of these areas?",
    };

    const aiMsg: Msg = { id:Math.random().toString(36).slice(2), role:"assistant", content:responses.default, time:new Date(), model };
    const finalConv = { ...updatedConv, messages:[...updatedConv.messages, aiMsg], updatedAt:new Date() };
    setActiveConv(finalConv);
    setConvs(c => c.map(cv => cv.id===activeConv.id?finalConv:cv));
    setLoading(false);
  };

  const newConv = () => {
    const c: Conv = { id:Math.random().toString(36).slice(2), title:"New conversation", model, messages:[], updatedAt:new Date() };
    setConvs(prev => [c, ...prev]);
    setActiveConv(c);
  };

  const filteredConvs = convs.filter(c => !searchQ || c.title.toLowerCase().includes(searchQ.toLowerCase()));

  const formatContent = (text: string) => {
    return text.split("\n").map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ fontWeight:700, margin:"8px 0 4px" }}>{line.slice(2,-2)}</p>;
      if (line.startsWith("# ")) return <h3 key={i} style={{ fontWeight:700, fontSize:16, margin:"12px 0 6px" }}>{line.slice(2)}</h3>;
      if (line.match(/^\d+\.\s/)) return <p key={i} style={{ paddingLeft:16, margin:"4px 0" }}>{line}</p>;
      if (line.startsWith("- ")) return <p key={i} style={{ paddingLeft:16, margin:"4px 0" }}>• {line.slice(2)}</p>;
      if (line === "") return <br key={i}/>;
      return <span key={i}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}<br/></span>;
    });
  };

  return (
    <div style={{ display:"flex", height:"calc(100vh - 120px)", gap:0, borderRadius:20, overflow:"hidden", border:"1px solid var(--border)" }}>
      {/* Conversation List */}
      <div style={{ width:280, flexShrink:0, background:"var(--bg2)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column" }} className="hide-mobile">
        <div style={{ padding:"16px 14px 12px" }}>
          <div style={{ display:"flex", gap:8, marginBottom:12 }}>
            <div style={{ flex:1, position:"relative" }}>
              <I n="search" s={14} c="var(--text3)"/><style>{`#conv-search{padding-left:32px!important}`}</style>
              <input id="conv-search" value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Search chats..." style={{ paddingLeft:32, fontSize:13, height:36 }}/>
              <div style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}><I n="search" s={14} c="var(--text3)"/></div>
            </div>
            <button className="btn btn-primary btn-icon" style={{ flexShrink:0 }} onClick={newConv}><I n="plus" s={16}/></button>
          </div>
        </div>
        <div style={{ flex:1, overflowY:"auto", padding:"0 8px 16px" }}>
          {filteredConvs.map(c => {
            const agent = AGENTS.find(a => a.type===c.agentType);
            return (
              <div key={c.id} onClick={()=>setActiveConv(c)} style={{ padding:"10px 12px", borderRadius:12, cursor:"pointer", background:activeConv.id===c.id?"rgba(108,99,255,0.12)":"transparent", border:`1px solid ${activeConv.id===c.id?"rgba(108,99,255,0.25)":"transparent"}`, marginBottom:4, transition:"all 0.15s" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <span style={{ fontSize:16 }}>{agent?.emoji||"💬"}</span>
                  <span style={{ fontSize:13, fontWeight:600, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</span>
                </div>
                <div style={{ fontSize:11, color:"var(--text3)", paddingLeft:24 }}>{c.messages.length} messages</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex:1, display:"flex", flexDirection:"column", background:"var(--bg)" }}>
        {/* Chat Header */}
        <div style={{ padding:"12px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:12 }}>
          {(() => { const agent = AGENTS.find(a=>a.type===activeConv.agentType); return agent ? (
            <>
              <div style={{ width:36, height:36, borderRadius:10, background:agent.color+"20", border:`1px solid ${agent.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18 }}>{agent.emoji}</div>
              <div><div style={{ fontSize:14, fontWeight:700 }}>{agent.name}</div><div style={{ fontSize:12, color:"var(--text3)" }}>Always online · {agent.msgs.toLocaleString()} conversations</div></div>
            </>
          ) : (
            <><div style={{ width:36, height:36, borderRadius:10, background:"rgba(108,99,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}><I n="sparkles" s={18} c="var(--accent)"/></div><div><div style={{ fontSize:14, fontWeight:700 }}>{activeConv.title}</div><div style={{ fontSize:12, color:"var(--text3)" }}>General AI Chat</div></div></>
          ); })()}
          <div style={{ marginLeft:"auto", position:"relative" }}>
            <button className="btn btn-ghost btn-sm" style={{ gap:6 }} onClick={()=>setShowModels(!showModels)}>
              {MODELS.find(m=>m.id===model)?.icon} {MODELS.find(m=>m.id===model)?.name} <I n="arrow" s={12}/>
            </button>
            {showModels && (
              <>
                <div style={{ position:"fixed", inset:0, zIndex:99 }} onClick={()=>setShowModels(false)}/>
                <div className="glass2" style={{ position:"absolute", right:0, top:"calc(100% + 6px)", width:240, borderRadius:14, zIndex:100, overflow:"hidden", boxShadow:"0 12px 40px rgba(0,0,0,0.4)" }}>
                  {["openai","anthropic","google"].map(provider => (
                    <div key={provider}>
                      <div style={{ padding:"8px 14px 4px", fontSize:11, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.8px" }}>{provider}</div>
                      {MODELS.filter(m=>m.provider===provider).map(m => (
                        <button key={m.id} style={{ width:"100%", padding:"9px 14px", background:model===m.id?"rgba(108,99,255,0.15)":"transparent", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:10, fontFamily:"DM Sans", fontSize:13, color:model===m.id?"var(--accent)":"var(--text)", transition:"background 0.15s" }} onClick={()=>{ setModel(m.id); setShowModels(false); }}>
                          <span>{m.icon}</span>{m.name}{model===m.id&&<I n="check" s={14} c="var(--accent)"/>}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:16 }}>
          {activeConv.messages.length===0 && (
            <div style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:16, padding:"60px 24px", textAlign:"center" }}>
              <div style={{ width:64, height:64, borderRadius:20, background:"rgba(108,99,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}><I n="sparkles" s={28} c="var(--accent)"/></div>
              <div>
                <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Start a conversation</h3>
                <p style={{ color:"var(--text2)", fontSize:14 }}>Ask anything. Your AI agent is ready to help.</p>
              </div>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8, justifyContent:"center", maxWidth:480 }}>
                {["Write a marketing email","Analyze my competitors","Create a sales script","Summarize key trends"].map(s => (
                  <button key={s} className="btn btn-ghost btn-sm" style={{ fontSize:13 }} onClick={()=>{ setInput(s); inputRef.current?.focus(); }}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {activeConv.messages.map(m => (
            <div key={m.id} style={{ display:"flex", flexDirection:"column", alignItems:m.role==="user"?"flex-end":"flex-start", gap:6 }}>
              <div className={`message-bubble ${m.role}`} style={{ maxWidth:"78%" }}>
                <div style={{ lineHeight:1.6 }}>{formatContent(m.content)}</div>
              </div>
              <div style={{ fontSize:11, color:"var(--text3)", paddingLeft:m.role==="assistant"?4:0, paddingRight:m.role==="user"?4:0 }}>
                {m.role==="assistant" && <span style={{ marginRight:6 }}>{MODELS.find(x=>x.id===m.model)?.name||m.model}</span>}
                {m.time.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
              </div>
            </div>
          ))}
          {loading && (
            <div style={{ display:"flex", alignItems:"flex-start", gap:6 }}>
              <div className="message-bubble assistant" style={{ padding:"12px 18px" }}>
                <div style={{ display:"flex", gap:5, alignItems:"center" }}>{[0,1,2].map(i=><span key={i} className="typing-dot" style={{ animationDelay:`${i*0.2}s` }}/>)}</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef}/>
        </div>

        {/* Input */}
        <div style={{ padding:"12px 20px 16px", borderTop:"1px solid var(--border)" }}>
          <div className="glass" style={{ borderRadius:18, padding:"10px 12px 10px 16px", display:"flex", alignItems:"flex-end", gap:8 }}>
            <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){ e.preventDefault(); sendMessage(); } }} placeholder="Message your AI agent... (Enter to send, Shift+Enter for new line)" style={{ flex:1, background:"none", border:"none", outline:"none", resize:"none", fontSize:14, color:"var(--text)", lineHeight:1.5, maxHeight:120, minHeight:24, fontFamily:"DM Sans, sans-serif", boxShadow:"none" }} rows={1}/>
            <div style={{ display:"flex", gap:6, alignItems:"center", flexShrink:0 }}>
              <input ref={fileRef} type="file" style={{ display:"none" }} onChange={()=>toast("File attached!", "success")}/>
              <button className="btn btn-ghost btn-icon" style={{ flexShrink:0 }} onClick={()=>fileRef.current?.click()} title="Attach file"><I n="upload" s={16}/></button>
              <button className="btn btn-ghost btn-icon" style={{ flexShrink:0 }} title="Voice input"><I n="mic" s={16}/></button>
              <button className="btn btn-primary btn-icon" style={{ flexShrink:0 }} onClick={sendMessage} disabled={!input.trim()||loading}><I n="send" s={16}/></button>
            </div>
          </div>
          <div style={{ fontSize:11, color:"var(--text3)", textAlign:"center", marginTop:8 }}>AI can make mistakes. Verify important info.</div>
        </div>
      </div>
    </div>
  );
}

// ─── AGENTS PAGE ──────────────────────────────────────────────────────────────
function AgentsPage({ onNav, toast }: { onNav:(p:Page)=>void; toast:(m:string,t?:"success"|"error"|"info")=>void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [agents, setAgents] = useState(AGENTS);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("custom");
  const [newPrompt, setNewPrompt] = useState("");

  const createAgent = () => {
    if (!newName) { toast("Please enter an agent name", "error"); return; }
    setAgents(prev => [...prev, { id:Math.random().toString(36).slice(2), name:newName, type:newType, emoji:"🤖", color:"#6c63ff", desc:"Custom AI agent", msgs:0, status:"online" }]);
    setShowCreate(false);
    setNewName(""); setNewPrompt("");
    toast("Agent created successfully!");
  };

  return (
    <div style={{ maxWidth:1100 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", marginBottom:4 }}>AI Agents</h1>
          <p style={{ color:"var(--text2)", fontSize:14 }}>Specialized AI models for every business function</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowCreate(true)}><I n="plus" s={16}/>Create Agent</button>
      </div>

      {/* Stats Row */}
      <div className="grid-4" style={{ marginBottom:28 }}>
        {[["6","Total Agents","robot","var(--accent)"],["7.7K","Conversations Today","msg","var(--accent2)"],["+24%","Avg. Success Rate","trending","#a78bfa"],["<2s","Avg. Response Time","zap","var(--accent4)"]].map(([v,l,ic,c]) => (
          <div key={l} className="stat-card" style={{ padding:"16px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span className="stat-label" style={{ fontSize:12 }}>{l}</span>
              <I n={ic as string} s={16} c={c as string}/>
            </div>
            <div className="stat-value" style={{ fontSize:26, marginTop:8 }}>{v}</div>
          </div>
        ))}
      </div>

      <div className="grid-3" style={{ gap:20 }}>
        {agents.map((a,i) => (
          <div key={a.id} className="agent-card" style={{ ["--agent-color" as string]:a.color, animation:`slide-up 0.5s cubic-bezier(0.22,1,0.36,1) ${i*0.07}s both` }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:14, marginBottom:16 }}>
              <div style={{ width:52, height:52, borderRadius:16, background:a.color+"20", border:`1px solid ${a.color}35`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24, flexShrink:0 }}>{a.emoji}</div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                  <h3 style={{ fontSize:15, fontWeight:700 }}>{a.name}</h3>
                  <span className="status-dot" style={{ background:a.status==="online"?"var(--accent2)":a.status==="busy"?"var(--accent4)":"var(--text3)", boxShadow:a.status==="online"?"0 0 8px var(--glow2)":"none" }}/>
                </div>
                <p style={{ fontSize:13, color:"var(--text3)", lineHeight:1.5 }}>{a.desc}</p>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:16 }}>
              <div style={{ textAlign:"center" }}>
                <div style={{ fontSize:16, fontWeight:700, color:a.color }}>{a.msgs.toLocaleString()}</div>
                <div style={{ fontSize:11, color:"var(--text3)" }}>Messages</div>
              </div>
              <div style={{ flex:1 }}>
                <div className="progress-bar"><div className="progress-fill" style={{ width:`${(a.msgs/3201*100).toFixed(0)}%`, background:`linear-gradient(90deg, ${a.color}, ${a.color}aa)` }}/></div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="btn btn-primary btn-sm" style={{ flex:1, justifyContent:"center", background:`linear-gradient(135deg, ${a.color}, ${a.color}cc)`, boxShadow:`0 4px 16px ${a.color}40` }} onClick={()=>onNav("chat")}><I n="msg" s={14}/>Chat Now</button>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>toast("Agent settings coming soon", "info")}><I n="settings" s={14}/></button>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={()=>toast("Agent cloned!", "success")}><I n="copy" s={14}/></button>
            </div>
          </div>
        ))}
      </div>

      {/* Create Agent Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowCreate(false)}>
          <div className="modal">
            <div className="modal-header">
              <h2 style={{ fontSize:18, fontWeight:700 }}>Create AI Agent</h2>
              <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)" }} onClick={()=>setShowCreate(false)}><I n="x" s={18}/></button>
            </div>
            <div className="modal-body" style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>Agent Name</label>
                <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="e.g. SEO Content AI"/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>Agent Type</label>
                <select value={newType} onChange={e=>setNewType(e.target.value)} style={{ height:44 }}>
                  {["marketing","sales","copywriting","research","support","social","custom"].map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>System Prompt</label>
                <textarea value={newPrompt} onChange={e=>setNewPrompt(e.target.value)} placeholder="You are an expert... Describe the agent's role, personality, and expertise." style={{ height:100 }}/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>AI Model</label>
                <select style={{ height:44 }}>
                  <option>GPT-4o Mini (Recommended)</option>
                  <option>GPT-4o</option>
                  <option>Claude 3.5 Sonnet</option>
                  <option>Gemini 1.5 Flash</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowCreate(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createAgent}><I n="plus" s={14}/>Create Agent</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── WORKFLOWS PAGE ───────────────────────────────────────────────────────────
function WorkflowsPage({ toast }: { toast:(m:string,t?:"success"|"error"|"info")=>void }) {
  const [workflows, setWorkflows] = useState<Workflow[]>(MOCK_WORKFLOWS);
  const [activeWF, setActiveWF] = useState<Workflow>(MOCK_WORKFLOWS[0]);
  const [tab, setTab] = useState<"builder"|"list">("builder");

  const NODE_TYPES = [
    { type:"trigger", label:"Webhook", color:"#6c63ff", icon:"link", cat:"Triggers" },
    { type:"trigger", label:"Form Submit", color:"#6c63ff", icon:"file", cat:"Triggers" },
    { type:"trigger", label:"Schedule", color:"#6c63ff", icon:"calendar", cat:"Triggers" },
    { type:"action", label:"AI Generate", color:"#f5a623", icon:"sparkles", cat:"AI Actions" },
    { type:"action", label:"AI Classify", color:"#f5a623", icon:"target", cat:"AI Actions" },
    { type:"action", label:"Send Email", color:"#00d4aa", icon:"mail", cat:"Integrations" },
    { type:"action", label:"Update CRM", color:"#a78bfa", icon:"database", cat:"Integrations" },
    { type:"action", label:"Webhook POST", color:"#ff6b6b", icon:"link", cat:"Integrations" },
  ];

  const toggleActive = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id===id?{...w,active:!w.active}:w));
    toast("Workflow " + (workflows.find(w=>w.id===id)?.active?"paused":"activated"));
  };

  const addNode = (type: typeof NODE_TYPES[0]) => {
    const newNode: WFNode = {
      id: Math.random().toString(36).slice(2),
      type: type.type, label: type.label,
      x: 100 + activeWF.nodes.length * 180, y: 80,
      color: type.color, icon: type.icon,
    };
    const updated = { ...activeWF, nodes:[...activeWF.nodes, newNode] };
    setActiveWF(updated);
    setWorkflows(prev => prev.map(w => w.id===activeWF.id?updated:w));
  };

  const cats = [...new Set(NODE_TYPES.map(n=>n.cat))];

  return (
    <div style={{ maxWidth:1200 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", marginBottom:4 }}>Workflow Automation</h1>
          <p style={{ color:"var(--text2)", fontSize:14 }}>Build powerful automations with triggers, AI, and integrations</p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <div className="segment">
            <button className={`segment-btn ${tab==="builder"?"active":""}`} onClick={()=>setTab("builder")}>Builder</button>
            <button className={`segment-btn ${tab==="list"?"active":""}`} onClick={()=>setTab("list")}>My Workflows</button>
          </div>
          <button className="btn btn-primary" onClick={()=>toast("New workflow created!")}><I n="plus" s={16}/>New Workflow</button>
        </div>
      </div>

      {tab==="builder" && (
        <div style={{ display:"flex", gap:0, height:"calc(100vh - 200px)", border:"1px solid var(--border)", borderRadius:20, overflow:"hidden" }}>
          {/* Node Palette */}
          <div style={{ width:220, flexShrink:0, background:"var(--bg2)", borderRight:"1px solid var(--border)", overflow:"auto", padding:"16px 12px" }}>
            <div style={{ fontSize:12, fontWeight:600, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:12, padding:"0 4px" }}>Add Blocks</div>
            {cats.map(cat => (
              <div key={cat} style={{ marginBottom:16 }}>
                <div style={{ fontSize:11, fontWeight:600, color:"var(--text3)", padding:"0 4px", marginBottom:6 }}>{cat}</div>
                {NODE_TYPES.filter(n=>n.cat===cat).map(n => (
                  <button key={n.label} style={{ width:"100%", display:"flex", alignItems:"center", gap:8, padding:"8px 10px", borderRadius:10, background:"transparent", border:`1px solid transparent`, cursor:"pointer", fontSize:13, color:"var(--text2)", fontFamily:"DM Sans", marginBottom:4, transition:"all 0.15s" }}
                    onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.background="var(--surface2)"; (e.currentTarget as HTMLElement).style.borderColor="var(--border2)"; }}
                    onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.background="transparent"; (e.currentTarget as HTMLElement).style.borderColor="transparent"; }}
                    onClick={()=>addNode(n)}>
                    <div style={{ width:28, height:28, borderRadius:8, background:n.color+"22", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><I n={n.icon} s={13} c={n.color}/></div>
                    {n.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          {/* Canvas */}
          <div style={{ flex:1, background:"var(--bg)", position:"relative", overflow:"hidden" }}>
            {/* Grid Background */}
            <div style={{ position:"absolute", inset:0, backgroundImage:"radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)", backgroundSize:"30px 30px" }}/>

            {/* Workflow Selector */}
            <div style={{ position:"absolute", top:16, left:16, zIndex:10 }}>
              <select value={activeWF.id} onChange={e=>setActiveWF(workflows.find(w=>w.id===e.target.value)||workflows[0])} style={{ width:200, height:38, fontSize:13, borderRadius:10 }}>
                {workflows.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>

            {/* Controls */}
            <div style={{ position:"absolute", top:16, right:16, display:"flex", gap:8, zIndex:10 }}>
              <button className="btn btn-ghost btn-sm" onClick={()=>toast("Workflow saved!")}><I n="check" s={14}/>Save</button>
              <button className="btn btn-secondary btn-sm" onClick={()=>toast("Running workflow...", "info")}><I n="play" s={14}/>Run Test</button>
            </div>

            {/* SVG connections */}
            <svg style={{ position:"absolute", inset:0, pointerEvents:"none" }} width="100%" height="100%">
              {activeWF.nodes.map((n,i) => {
                if(i===0) return null;
                const prev = activeWF.nodes[i-1];
                const x1 = prev.x + 90; const y1 = prev.y + 30;
                const x2 = n.x; const y2 = n.y + 30;
                return <path key={n.id} d={`M${x1},${y1} C${(x1+x2)/2},${y1} ${(x1+x2)/2},${y2} ${x2},${y2}`} fill="none" stroke="rgba(108,99,255,0.5)" strokeWidth="2" strokeDasharray="6,4"/>;
              })}
            </svg>

            {/* Nodes */}
            {activeWF.nodes.map((n,i) => (
              <div key={n.id} className="workflow-node" style={{ position:"absolute", left:n.x, top:n.y, minWidth:160 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:n.color+"22", display:"flex", alignItems:"center", justifyContent:"center" }}><I n={n.icon} s={13} c={n.color}/></div>
                  <div>
                    <div style={{ fontSize:12, fontWeight:600 }}>{n.label}</div>
                    <div style={{ fontSize:10, color:"var(--text3)" }}>{n.type.toUpperCase()}</div>
                  </div>
                </div>
                {i<activeWF.nodes.length-1 && (
                  <div style={{ position:"absolute", right:-12, top:"50%", transform:"translateY(-50%)", width:8, height:8, borderRadius:"50%", background:n.color, boxShadow:`0 0 8px ${n.color}` }}/>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==="list" && (
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {workflows.map(w => (
            <div key={w.id} className="card" style={{ padding:"20px 24px" }}>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:6 }}>
                    <h3 style={{ fontSize:15, fontWeight:700 }}>{w.name}</h3>
                    <span className="tag" style={{ background:w.active?"rgba(0,212,170,0.15)":"rgba(255,255,255,0.06)", color:w.active?"var(--accent2)":"var(--text3)", border:`1px solid ${w.active?"rgba(0,212,170,0.3)":"var(--border)"}`, fontSize:11 }}>{w.active?"Active":"Paused"}</span>
                  </div>
                  <p style={{ fontSize:13, color:"var(--text2)", marginBottom:12 }}>{w.description}</p>
                  <div style={{ display:"flex", gap:20 }}>
                    <span style={{ fontSize:12, color:"var(--text3)" }}><I n="play" s={12} c="var(--text3)"/> {w.runs} runs</span>
                    {w.lastRun && <span style={{ fontSize:12, color:"var(--text3)" }}><I n="refresh" s={12} c="var(--text3)"/> Last run {w.lastRun}</span>}
                    <span style={{ fontSize:12, color:"var(--text3)" }}>{w.nodes.length} nodes</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>{ setActiveWF(w); setTab("builder"); }}>Edit</button>
                  <button className={`btn btn-sm ${w.active?"btn-ghost":"btn-primary"}`} onClick={()=>toggleActive(w.id)}>{w.active?<><I n="pause" s={14}/>Pause</>:<><I n="play" s={14}/>Activate</>}</button>
                </div>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:16, flexWrap:"wrap" }}>
                {w.nodes.map(n => (
                  <div key={n.id} style={{ display:"flex", alignItems:"center", gap:5, padding:"4px 10px", borderRadius:100, background:n.color+"15", border:`1px solid ${n.color}25`, fontSize:11, color:n.color }}>
                    <I n={n.icon} s={11} c={n.color}/>{n.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── CRM PAGE ─────────────────────────────────────────────────────────────────
function CRMPage({ toast }: { toast:(m:string,t?:"success"|"error"|"info")=>void }) {
  const [tab, setTab] = useState<"pipeline"|"leads">("pipeline");
  const [deals, setDeals] = useState(MOCK_DEALS);
  const [leads] = useState<Lead[]>(MOCK_LEADS);
  const [dragging, setDragging] = useState<Deal|null>(null);
  const [showAddDeal, setShowAddDeal] = useState(false);

  const stages = [
    { id:"new", label:"New Lead", color:"var(--text3)" },
    { id:"contacted", label:"Contacted", color:"var(--accent)" },
    { id:"proposal", label:"Proposal", color:"var(--accent4)" },
    { id:"closed", label:"Closed Won", color:"var(--accent2)" },
  ];

  const statusColors: Record<string,string> = {
    new:"var(--text3)", contacted:"var(--accent)", qualified:"#a78bfa",
    proposal:"var(--accent4)", negotiation:"var(--accent4)", closed_won:"var(--accent2)", closed_lost:"var(--accent3)"
  };

  const totalPipelineValue = Object.values(deals).flat().reduce((acc,d)=>acc+d.value,0);

  return (
    <div style={{ maxWidth:1200 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", marginBottom:4 }}>CRM</h1>
          <p style={{ color:"var(--text2)", fontSize:14 }}>Track leads, contacts, and deals in one place</p>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <div className="segment">
            <button className={`segment-btn ${tab==="pipeline"?"active":""}`} onClick={()=>setTab("pipeline")}>Pipeline</button>
            <button className={`segment-btn ${tab==="leads"?"active":""}`} onClick={()=>setTab("leads")}>Leads</button>
          </div>
          <button className="btn btn-primary" onClick={()=>{ tab==="pipeline"?setShowAddDeal(true):toast("Add lead coming soon", "info") }}><I n="plus" s={16}/>{tab==="pipeline"?"Add Deal":"Add Lead"}</button>
        </div>
      </div>

      {/* Pipeline Stats */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {[
          { label:"Pipeline Value", value:`$${(totalPipelineValue/1000).toFixed(0)}K`, color:"var(--accent2)", icon:"dollar" },
          { label:"Total Deals", value:Object.values(deals).flat().length, color:"var(--accent)", icon:"target" },
          { label:"Avg Deal Size", value:`$${Math.round(totalPipelineValue/Object.values(deals).flat().length/1000)}K`, color:"#a78bfa", icon:"trending" },
          { label:"Win Rate", value:"68%", color:"var(--accent4)", icon:"chart" },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding:"16px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span className="stat-label" style={{ fontSize:12 }}>{s.label}</span>
              <I n={s.icon} s={16} c={s.color}/>
            </div>
            <div className="stat-value" style={{ fontSize:24, color:s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {tab==="pipeline" && (
        <div style={{ display:"flex", gap:16, overflowX:"auto", paddingBottom:16 }}>
          {stages.map(stage => (
            <div key={stage.id} className="pipeline-col" style={{ flexShrink:0 }}
              onDragOver={e=>e.preventDefault()}
              onDrop={e=>{ e.preventDefault(); if(dragging){ setDeals(prev=>{ const next={...prev}; for(const s of Object.keys(next)) next[s]=next[s].filter(d=>d.id!==dragging.id); next[stage.id]=[...next[stage.id],{...dragging,stage:stage.id}]; return next; }); toast("Deal moved to " + stage.label); setDragging(null); } }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:stage.color }}/>
                <span style={{ fontSize:13, fontWeight:700 }}>{stage.label}</span>
                <span style={{ marginLeft:"auto", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:100, padding:"1px 8px", fontSize:11, color:"var(--text3)" }}>{deals[stage.id]?.length||0}</span>
              </div>
              {deals[stage.id]?.map(d => (
                <div key={d.id} className="deal-card" draggable onDragStart={()=>setDragging(d)} onDragEnd={()=>setDragging(null)}>
                  <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{d.title}</div>
                  <div style={{ fontSize:12, color:"var(--text3)", marginBottom:10 }}>{d.company}</div>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                    <span style={{ fontSize:14, fontWeight:700, color:"var(--accent2)" }}>${d.value.toLocaleString()}</span>
                    <span className="tag" style={{ background:"rgba(108,99,255,0.15)", color:"var(--accent)", border:"1px solid rgba(108,99,255,0.25)", fontSize:10 }}>{d.probability}%</span>
                  </div>
                </div>
              ))}
              <button style={{ width:"100%", padding:"8px", borderRadius:10, background:"transparent", border:"1px dashed var(--border2)", cursor:"pointer", color:"var(--text3)", fontSize:12, fontFamily:"DM Sans", transition:"all 0.15s" }}
                onMouseEnter={e=>{ (e.currentTarget as HTMLElement).style.borderColor="var(--accent)"; (e.currentTarget as HTMLElement).style.color="var(--accent)"; }}
                onMouseLeave={e=>{ (e.currentTarget as HTMLElement).style.borderColor="var(--border2)"; (e.currentTarget as HTMLElement).style.color="var(--text3)"; }}
                onClick={()=>setShowAddDeal(true)}>+ Add deal</button>
            </div>
          ))}
        </div>
      )}

      {tab==="leads" && (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ flex:1, position:"relative" }}>
              <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}><I n="search" s={14} c="var(--text3)"/></div>
              <input placeholder="Search leads..." style={{ paddingLeft:36, height:38, fontSize:13, borderRadius:10 }}/>
            </div>
            <button className="btn btn-ghost btn-sm"><I n="filter" s={14}/>Filter</button>
          </div>
          <div style={{ overflowX:"auto" }}>
            <table>
              <thead><tr>
                <th>Company</th><th>Contact</th><th>Email</th><th>Status</th><th>Score</th><th>Value</th><th>Source</th>
              </tr></thead>
              <tbody>
                {leads.map(l => (
                  <tr key={l.id} style={{ cursor:"pointer" }}>
                    <td><span style={{ fontWeight:600, color:"var(--text)" }}>{l.company}</span></td>
                    <td>{l.name}</td>
                    <td>{l.email}</td>
                    <td><span className="tag" style={{ background:statusColors[l.status]+"18", color:statusColors[l.status], border:`1px solid ${statusColors[l.status]}30` }}>{l.status.replace("_"," ")}</span></td>
                    <td>
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div className="progress-bar" style={{ width:60 }}><div className="progress-fill" style={{ width:l.score+"%", background:l.score>80?"var(--accent2)":l.score>50?"var(--accent4)":"var(--accent3)" }}/></div>
                        <span style={{ fontSize:12 }}>{l.score}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight:600, color:"var(--accent2)" }}>${l.value.toLocaleString()}</td>
                    <td><span className="tag glass" style={{ fontSize:11 }}>{l.source}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAddDeal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowAddDeal(false)}>
          <div className="modal">
            <div className="modal-header"><h2 style={{ fontSize:18, fontWeight:700 }}>Add Deal</h2><button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)" }} onClick={()=>setShowAddDeal(false)}><I n="x" s={18}/></button></div>
            <div className="modal-body" style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div><label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>Deal Title</label><input placeholder="Enterprise License"/></div>
              <div><label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>Company</label><input placeholder="Acme Corp"/></div>
              <div className="grid-2" style={{ gap:12 }}>
                <div><label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>Value ($)</label><input type="number" placeholder="10000"/></div>
                <div><label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>Stage</label><select style={{ height:44 }}><option>New Lead</option><option>Contacted</option><option>Proposal</option><option>Closed</option></select></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowAddDeal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={()=>{ toast("Deal added!"); setShowAddDeal(false); }}><I n="check" s={14}/>Add Deal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ANALYTICS PAGE ───────────────────────────────────────────────────────────
function AnalyticsPage() {
  const [range, setRange] = useState("30d");

  const agentUsage = [
    { name:"Support AI", msgs:3201, color:"#ff6b6b", pct:35 },
    { name:"Copy AI", msgs:2105, color:"#34d399", pct:23 },
    { name:"Social AI", msgs:1544, color:"#a78bfa", pct:17 },
    { name:"Marketing AI", msgs:1240, color:"#6c63ff", pct:14 },
    { name:"Sales AI", msgs:893, color:"#00d4aa", pct:10 },
    { name:"Research AI", msgs:672, color:"#f5a623", pct:7 },
  ];

  const modelUsage = [
    { model:"GPT-4o Mini", tokens:"42.1M", cost:"$6.32", pct:55, color:"var(--accent)" },
    { model:"GPT-4o", tokens:"18.3M", cost:"$91.50", pct:24, color:"#a78bfa" },
    { model:"Claude 3.5 Sonnet", tokens:"14.8M", cost:"$44.40", pct:19, color:"var(--accent2)" },
    { model:"Gemini 1.5 Flash", tokens:"1.2M", cost:"$0.09", pct:2, color:"var(--accent4)" },
  ];

  const kpis = [
    { label:"Avg. Response Time", value:"1.4s", change:"-18%", up:true, icon:"zap", color:"var(--accent)" },
    { label:"AI Success Rate", value:"97.3%", change:"+2.1%", up:true, icon:"check", color:"var(--accent2)" },
    { label:"Total Cost (Month)", value:"$142", change:"+12%", up:false, icon:"dollar", color:"var(--accent4)" },
    { label:"Cost per Message", value:"$0.0015", change:"-8%", up:true, icon:"trending", color:"#a78bfa" },
  ];

  return (
    <div style={{ maxWidth:1100 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", marginBottom:4 }}>Analytics</h1>
          <p style={{ color:"var(--text2)", fontSize:14 }}>AI usage, performance, and cost insights</p>
        </div>
        <div className="segment">
          {["7d","30d","90d","1y"].map(r => <button key={r} className={`segment-btn ${range===r?"active":""}`} onClick={()=>setRange(r)}>{r}</button>)}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4" style={{ marginBottom:24 }}>
        {kpis.map((k,i) => (
          <div key={k.label} className="stat-card" style={{ animation:`slide-up 0.5s cubic-bezier(0.22,1,0.36,1) ${i*0.07}s both` }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}>
              <span className="stat-label">{k.label}</span>
              <div style={{ width:34, height:34, borderRadius:10, background:k.color+"18", display:"flex", alignItems:"center", justifyContent:"center" }}><I n={k.icon} s={16} c={k.color}/></div>
            </div>
            <div className="stat-value" style={{ fontSize:26 }}>{k.value}</div>
            <div className={`stat-change ${k.up?"up":"down"}`}><I n={k.up?"trending":"arrow"} s={12}/> {k.change} vs last period</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap:20, marginBottom:24 }}>
        {/* Revenue over time */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ marginBottom:20 }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>Revenue Over Time</h3>
            <p style={{ fontSize:12, color:"var(--text3)" }}>Monthly revenue in USD</p>
          </div>
          <MiniLineChart data={REV_DATA} color="var(--accent2)" height={120}/>
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
            {MONTHS.map(m=><span key={m} style={{ fontSize:10, color:"var(--text3)" }}>{m}</span>)}
          </div>
        </div>

        {/* AI Message Volume */}
        <div className="card" style={{ padding:24 }}>
          <div style={{ marginBottom:20 }}>
            <h3 style={{ fontSize:15, fontWeight:700, marginBottom:2 }}>AI Message Volume</h3>
            <p style={{ fontSize:12, color:"var(--text3)" }}>Messages per month</p>
          </div>
          <BarChart data={USAGE_DATA} labels={MONTHS} color="var(--accent)"/>
        </div>
      </div>

      <div className="grid-2" style={{ gap:20 }}>
        {/* Agent Usage Breakdown */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:20 }}>Agent Usage Breakdown</h3>
          {agentUsage.map((a,i) => (
            <div key={a.name} style={{ marginBottom:14, animation:`slide-in-right 0.5s cubic-bezier(0.22,1,0.36,1) ${i*0.06}s both` }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:10, height:10, borderRadius:"50%", background:a.color }}/>
                  <span style={{ fontSize:13, fontWeight:500 }}>{a.name}</span>
                </div>
                <div style={{ display:"flex", gap:12 }}>
                  <span style={{ fontSize:12, color:"var(--text3)" }}>{a.msgs.toLocaleString()} msgs</span>
                  <span style={{ fontSize:12, fontWeight:600, color:a.color, width:32, textAlign:"right" }}>{a.pct}%</span>
                </div>
              </div>
              <div className="progress-bar"><div className="progress-fill" style={{ width:a.pct+"%", background:a.color, transition:`width 1s cubic-bezier(0.22,1,0.36,1) ${i*0.08}s` }}/></div>
            </div>
          ))}
        </div>

        {/* Model Cost Breakdown */}
        <div className="card" style={{ padding:24 }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:20 }}>Model Cost Breakdown</h3>
          {modelUsage.map((m,i) => (
            <div key={m.model} style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14, padding:"12px 14px", borderRadius:12, background:"var(--surface)", border:"1px solid var(--border)", animation:`slide-up 0.5s cubic-bezier(0.22,1,0.36,1) ${i*0.07}s both` }}>
              <div style={{ width:36, height:36, borderRadius:10, background:m.color+"20", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><I n="brain" s={16} c={m.color}/></div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, fontWeight:600, marginBottom:4 }}>{m.model}</div>
                <div className="progress-bar"><div className="progress-fill" style={{ width:m.pct+"%", background:m.color }}/></div>
              </div>
              <div style={{ textAlign:"right", flexShrink:0 }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{m.cost}</div>
                <div style={{ fontSize:11, color:"var(--text3)" }}>{m.tokens}</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop:16, padding:"14px", borderRadius:12, background:"rgba(108,99,255,0.08)", border:"1px solid rgba(108,99,255,0.2)", display:"flex", justifyContent:"space-between" }}>
            <span style={{ fontSize:14, fontWeight:600 }}>Total Monthly Cost</span>
            <span style={{ fontSize:16, fontWeight:800, color:"var(--accent)" }}>$142.31</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FILES PAGE ───────────────────────────────────────────────────────────────
function FilesPage({ toast }: { toast:(m:string,t?:"success"|"error"|"info")=>void }) {
  const [files, setFiles] = useState<UpFile[]>(MOCK_FILES);
  const [selected, setSelected] = useState<UpFile|null>(MOCK_FILES[0]);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const getIcon = (type: string) => {
    if (type.includes("pdf")) return "📄";
    if (type.includes("image")) return "🖼️";
    if (type.includes("word") || type.includes("doc")) return "📝";
    if (type.includes("csv") || type.includes("spreadsheet")) return "📊";
    return "📁";
  };

  const formatSize = (bytes: number) => {
    if (bytes > 1048576) return (bytes/1048576).toFixed(1) + " MB";
    return (bytes/1024).toFixed(0) + " KB";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    const newFiles: UpFile[] = dropped.map(f => ({
      id: Math.random().toString(36).slice(2), name:f.name, type:f.type, size:f.size, uploadedAt:new Date().toISOString().split("T")[0]
    }));
    setFiles(prev => [...newFiles, ...prev]);
    toast(`${dropped.length} file${dropped.length>1?"s":""} uploaded!`);
  };

  const analyzeFile = async (f: UpFile) => {
    setAnalyzing(true);
    await new Promise(r=>setTimeout(r,2000));
    const summaries: Record<string,string> = {
      "Q4_Strategy_Deck.pdf": "Executive Q4 strategy deck. Key focus areas: product-led growth (40% of budget), enterprise expansion (3 target verticals), content marketing (12 planned case studies). Revenue target: $2.1M ARR by EOY.",
      "Sales_Data_April.csv": "156 transactions in April. Total revenue: $124,200 (+23% MoM). Top segments: Mid-market (62%), SMB (31%). Avg deal size: $797. Churn this month: 2 accounts (-$1,200 MRR).",
    };
    setFiles(prev => prev.map(fi => fi.id===f.id?{...fi, summary:summaries[f.name]||"AI analysis complete. Document contains key business information including metrics, goals, and strategic recommendations."}:fi));
    setSelected(prev => prev?.id===f.id?{...prev, summary:summaries[f.name]||"AI analysis complete."}:prev);
    setAnalyzing(false);
    toast("File analyzed by AI!");
  };

  return (
    <div style={{ maxWidth:1100 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", marginBottom:4 }}>Files</h1>
          <p style={{ color:"var(--text2)", fontSize:14 }}>Upload documents for AI analysis and RAG retrieval</p>
        </div>
        <button className="btn btn-primary" onClick={()=>fileRef.current?.click()}><I n="upload" s={16}/>Upload Files</button>
      </div>
      <input ref={fileRef} type="file" multiple style={{ display:"none" }} onChange={e=>{ if(e.target.files?.length){ const newFiles: UpFile[] = Array.from(e.target.files).map(f=>({ id:Math.random().toString(36).slice(2), name:f.name, type:f.type, size:f.size, uploadedAt:new Date().toISOString().split("T")[0] })); setFiles(prev=>[...newFiles,...prev]); toast(`${e.target.files!.length} file(s) uploaded!`); } }}/>

      {/* Upload Zone */}
      <div className={`upload-zone ${dragging?"drag-over":""}`} style={{ marginBottom:24 }}
        onDragOver={e=>{ e.preventDefault(); setDragging(true); }}
        onDragLeave={()=>setDragging(false)}
        onDrop={handleDrop}
        onClick={()=>fileRef.current?.click()}>
        <I n="upload" s={32} c={dragging?"var(--accent)":"var(--text3)"}/>
        <p style={{ fontSize:15, fontWeight:600, marginTop:12, color:dragging?"var(--accent)":"var(--text2)" }}>Drop files here or click to upload</p>
        <p style={{ fontSize:13, color:"var(--text3)", marginTop:4 }}>PDF, DOCX, PNG, JPG, CSV — up to 10MB each</p>
      </div>

      <div style={{ display:"flex", gap:20 }}>
        {/* File List */}
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {files.map(f => (
              <div key={f.id} onClick={()=>setSelected(f)} style={{ display:"flex", alignItems:"center", gap:14, padding:"14px 16px", borderRadius:14, background:"var(--surface)", border:`1px solid ${selected?.id===f.id?"rgba(108,99,255,0.4)":"var(--border)"}`, cursor:"pointer", transition:"all 0.15s", boxShadow:selected?.id===f.id?"0 0 0 1px rgba(108,99,255,0.2)":"none" }}>
                <span style={{ fontSize:28, flexShrink:0 }}>{getIcon(f.type)}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:14, fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{f.name}</div>
                  <div style={{ fontSize:12, color:"var(--text3)" }}>{formatSize(f.size)} · {f.uploadedAt}</div>
                </div>
                {f.summary && <div style={{ width:8, height:8, borderRadius:"50%", background:"var(--accent2)", flexShrink:0 }} title="AI analyzed"/>}
                <button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)", padding:4 }} onClick={e=>{ e.stopPropagation(); setFiles(prev=>prev.filter(fi=>fi.id!==f.id)); if(selected?.id===f.id) setSelected(null); toast("File deleted"); }}><I n="trash" s={14}/></button>
              </div>
            ))}
          </div>
        </div>

        {/* File Preview */}
        {selected && (
          <div style={{ width:320, flexShrink:0 }} className="hide-mobile">
            <div className="card" style={{ padding:24 }}>
              <div style={{ textAlign:"center", marginBottom:20 }}>
                <div style={{ fontSize:48, marginBottom:12 }}>{getIcon(selected.type)}</div>
                <h3 style={{ fontSize:14, fontWeight:700, marginBottom:4, wordBreak:"break-word" }}>{selected.name}</h3>
                <p style={{ fontSize:12, color:"var(--text3)" }}>{formatSize(selected.size)} · {selected.uploadedAt}</p>
              </div>
              {selected.summary ? (
                <div style={{ background:"rgba(0,212,170,0.08)", border:"1px solid rgba(0,212,170,0.2)", borderRadius:12, padding:16, marginBottom:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}>
                    <I n="sparkles" s={14} c="var(--accent2)"/>
                    <span style={{ fontSize:12, fontWeight:600, color:"var(--accent2)" }}>AI Summary</span>
                  </div>
                  <p style={{ fontSize:13, color:"var(--text2)", lineHeight:1.6 }}>{selected.summary}</p>
                </div>
              ) : (
                <button className="btn btn-primary" style={{ width:"100%", justifyContent:"center", marginBottom:16 }} onClick={()=>analyzeFile(selected)} disabled={analyzing}>
                  {analyzing?<span style={{ display:"flex", gap:4 }}>{[0,1,2].map(i=><span key={i} className="typing-dot" style={{ animationDelay:`${i*0.2}s` }}/>)}</span>:<><I n="sparkles" s={14}/>Analyze with AI</>}
                </button>
              )}
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:"center" }} onClick={()=>toast("Downloading...")}><I n="download" s={13}/>Download</button>
                <button className="btn btn-ghost btn-sm" style={{ flex:1, justifyContent:"center" }} onClick={()=>toast("Link copied!", "success")}><I n="link" s={13}/>Copy Link</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TEAM PAGE ────────────────────────────────────────────────────────────────
function TeamPage({ toast }: { toast:(m:string,t?:"success"|"error"|"info")=>void }) {
  const [members, setMembers] = useState<TeamMember[]>(MOCK_TEAM);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  const roleColors: Record<string,string> = { admin:"var(--accent)", member:"var(--accent2)", viewer:"var(--text3)" };
  const statusColors: Record<string,string> = { active:"var(--accent2)", invited:"var(--accent4)", offline:"var(--text3)" };

  const sendInvite = () => {
    if(!inviteEmail) { toast("Enter an email address", "error"); return; }
    setMembers(prev=>[...prev,{ id:Math.random().toString(36).slice(2), name:inviteEmail.split("@")[0], email:inviteEmail, role:inviteRole, status:"invited" }]);
    toast(`Invite sent to ${inviteEmail}!`);
    setShowInvite(false); setInviteEmail("");
  };

  return (
    <div style={{ maxWidth:900 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", marginBottom:4 }}>Team</h1>
          <p style={{ color:"var(--text2)", fontSize:14 }}>Manage team members and permissions</p>
        </div>
        <button className="btn btn-primary" onClick={()=>setShowInvite(true)}><I n="adduser" s={16}/>Invite Member</button>
      </div>

      {/* Stats */}
      <div className="grid-3" style={{ marginBottom:24 }}>
        {[["5","Members","users","var(--accent)"],["3","Active Now","zap","var(--accent2)"],["1","Pending Invite","mail","var(--accent4)"]].map(([v,l,ic,c])=>(
          <div key={l} className="stat-card" style={{ padding:"16px 20px" }}>
            <div style={{ display:"flex", justifyContent:"space-between" }}><span className="stat-label" style={{ fontSize:12 }}>{l}</span><I n={ic as string} s={16} c={c as string}/></div>
            <div className="stat-value" style={{ fontSize:28 }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Members Table */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)" }}>
          <h3 style={{ fontSize:14, fontWeight:700 }}>Team Members</h3>
        </div>
        <table>
          <thead><tr><th>Member</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background:"linear-gradient(135deg, var(--accent), var(--accent2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"#fff", flexShrink:0 }}>
                      {m.name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
                    </div>
                    <span style={{ fontWeight:600, color:"var(--text)" }}>{m.name}</span>
                  </div>
                </td>
                <td>{m.email}</td>
                <td>
                  <select value={m.role} onChange={e=>{ setMembers(prev=>prev.map(mem=>mem.id===m.id?{...mem,role:e.target.value}:mem)); toast("Role updated"); }} style={{ width:"auto", height:32, fontSize:12, padding:"4px 10px", borderRadius:8, color:roleColors[m.role] }}>
                    {["admin","member","viewer"].map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                  </select>
                </td>
                <td>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span className="status-dot" style={{ background:statusColors[m.status] }}/>
                    <span style={{ fontSize:13, color:statusColors[m.status] }}>{m.status.charAt(0).toUpperCase()+m.status.slice(1)}</span>
                  </div>
                </td>
                <td>
                  <div style={{ display:"flex", gap:6 }}>
                    <button className="btn btn-ghost btn-sm btn-icon" style={{ padding:"5px" }} onClick={()=>toast("Edit coming soon","info")}><I n="edit" s={13}/></button>
                    <button className="btn btn-danger btn-sm btn-icon" style={{ padding:"5px" }} onClick={()=>{ setMembers(prev=>prev.filter(mem=>mem.id!==m.id)); toast("Member removed"); }}><I n="trash" s={13}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowInvite(false)}>
          <div className="modal">
            <div className="modal-header"><h2 style={{ fontSize:18, fontWeight:700 }}>Invite Team Member</h2><button style={{ background:"none", border:"none", cursor:"pointer", color:"var(--text3)" }} onClick={()=>setShowInvite(false)}><I n="x" s={18}/></button></div>
            <div className="modal-body" style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>Email Address</label>
                <input type="email" value={inviteEmail} onChange={e=>setInviteEmail(e.target.value)} placeholder="teammate@company.com" autoFocus/>
              </div>
              <div>
                <label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>Role</label>
                <select value={inviteRole} onChange={e=>setInviteRole(e.target.value)} style={{ height:44 }}>
                  <option value="admin">Admin — Full access</option>
                  <option value="member">Member — Can use agents and chat</option>
                  <option value="viewer">Viewer — Read-only access</option>
                </select>
              </div>
              <p style={{ fontSize:12, color:"var(--text3)" }}>They'll receive an email with a link to join your workspace.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={()=>setShowInvite(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={sendInvite}><I n="mail" s={14}/>Send Invite</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
function SettingsPage({ user, toast }: { user:User; toast:(m:string,t?:"success"|"error"|"info")=>void }) {
  const [tab, setTab] = useState<"profile"|"api"|"billing"|"notifications"|"security">("profile");
  const [name, setName] = useState(user.name);
  const [company, setCompany] = useState(user.company);
  const [showKeys, setShowKeys] = useState<Record<string,boolean>>({});
  const [apiKeys, setApiKeys] = useState({ openai:"sk-proj-••••••••••••••••••••••••••••••••", anthropic:"sk-ant-••••••••••••••••••••••••", gemini:"AIza••••••••••••••••••••••••••••" });
  const [realKeys, setRealKeys] = useState({ openai:"", anthropic:"", gemini:"" });
  const [notifSettings, setNotifSettings] = useState({ email_workflows:true, email_billing:true, push_ai:false, push_team:true, weekly_report:true });
  const [twoFA, setTwoFA] = useState(false);

  const tabs = [
    { id:"profile", label:"Profile", icon:"users" },
    { id:"api", label:"API Keys", icon:"key" },
    { id:"billing", label:"Billing", icon:"dollar" },
    { id:"notifications", label:"Notifications", icon:"bell" },
    { id:"security", label:"Security", icon:"shield" },
  ];

  const planDetails = {
    free: { name:"Free", price:"$0", color:"var(--text3)", msgs:100, agentCount:3 },
    pro: { name:"Pro", price:"$49/mo", color:"var(--accent)", msgs:"Unlimited", agentCount:15 },
    agency: { name:"Agency", price:"$149/mo", color:"var(--accent4)", msgs:"Unlimited", agentCount:"Unlimited" },
  };
  const plan = planDetails[user.plan];
  const usagePercent = user.plan==="free"?68:24;

  return (
    <div style={{ maxWidth:800 }}>
      <div style={{ marginBottom:28 }}>
        <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", marginBottom:4 }}>Settings</h1>
        <p style={{ color:"var(--text2)", fontSize:14 }}>Manage your account, API keys, and preferences</p>
      </div>

      <div style={{ display:"flex", gap:20 }}>
        {/* Sidebar Tabs */}
        <div style={{ width:180, flexShrink:0 }}>
          <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
            {tabs.map(t => (
              <button key={t.id} className={`nav-item ${tab===t.id?"active":""}`} style={{ border:"none", background:"none", textAlign:"left", width:"100%" }} onClick={()=>setTab(t.id as typeof tab)}>
                <I n={t.icon} s={15}/>{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex:1 }}>
          {tab==="profile" && (
            <div className="card" style={{ padding:28 }}>
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:20 }}>Profile Information</h3>
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24, padding:"16px", borderRadius:14, background:"var(--surface)" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", background:"linear-gradient(135deg, var(--accent), var(--accent2))", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:700, color:"#fff", flexShrink:0 }}>{user.avatar}</div>
                <div>
                  <p style={{ fontSize:14, fontWeight:600, marginBottom:4 }}>{user.name}</p>
                  <p style={{ fontSize:13, color:"var(--text3)", marginBottom:8 }}>{user.email}</p>
                  <button className="btn btn-ghost btn-sm" onClick={()=>toast("Avatar upload coming soon","info")}>Change Avatar</button>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
                <div><label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>Full Name</label><input value={name} onChange={e=>setName(e.target.value)}/></div>
                <div><label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>Email</label><input value={user.email} disabled style={{ opacity:0.6 }}/></div>
                <div><label style={{ display:"block", fontSize:13, fontWeight:500, color:"var(--text2)", marginBottom:6 }}>Company</label><input value={company} onChange={e=>setCompany(e.target.value)} placeholder="Your company name"/></div>
                <button className="btn btn-primary" style={{ alignSelf:"flex-start" }} onClick={()=>toast("Profile saved!")}><I n="check" s={14}/>Save Changes</button>
              </div>
            </div>
          )}

          {tab==="api" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div className="card" style={{ padding:24 }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                  <I n="key" s={16} c="var(--accent)"/>
                  <h3 style={{ fontSize:15, fontWeight:700 }}>API Keys</h3>
                </div>
                <p style={{ fontSize:13, color:"var(--text3)", marginBottom:20 }}>Keys are stored in your browser only — never sent to our servers.</p>
                {([["openai","OpenAI","⚡"],["anthropic","Anthropic","🧠"],["gemini","Google Gemini","💎"]] as [string,string,string][]).map(([key,label,icon]) => (
                  <div key={key} style={{ marginBottom:16, padding:"16px", borderRadius:14, background:"var(--surface)", border:"1px solid var(--border)" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10 }}>
                      <span>{icon}</span>
                      <span style={{ fontSize:14, fontWeight:600 }}>{label}</span>
                      {realKeys[key as keyof typeof realKeys] && <span className="tag" style={{ background:"rgba(0,212,170,0.15)", color:"var(--accent2)", border:"1px solid rgba(0,212,170,0.3)", fontSize:11 }}>Connected</span>}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <div style={{ flex:1, position:"relative" }}>
                        <input type={showKeys[key]?"text":"password"} value={realKeys[key as keyof typeof realKeys]||apiKeys[key as keyof typeof apiKeys]} onChange={e=>setRealKeys(prev=>({...prev,[key]:e.target.value}))} placeholder={`Enter your ${label} API key`} style={{ paddingRight:40 }}/>
                        <button type="button" style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"var(--text3)", padding:4 }} onClick={()=>setShowKeys(p=>({...p,[key]:!p[key]}))}><I n={showKeys[key]?"eyeoff":"eye"} s={15}/></button>
                      </div>
                      <button className="btn btn-ghost btn-sm" onClick={()=>toast(`${label} key saved!`)}><I n="check" s={14}/>Save</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab==="billing" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div className="card" style={{ padding:24 }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Current Plan</h3>
                <div style={{ display:"flex", alignItems:"center", gap:16, padding:"20px", borderRadius:16, background:plan.color+"12", border:`1px solid ${plan.color}30`, marginBottom:16 }}>
                  <div style={{ width:48, height:48, borderRadius:14, background:plan.color+"20", display:"flex", alignItems:"center", justifyContent:"center" }}><I n="crown" s={22} c={plan.color}/></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:18, fontWeight:800, color:plan.color, marginBottom:2 }}>{plan.name} Plan</div>
                    <div style={{ fontSize:14, color:"var(--text2)" }}>{plan.price} · Renews May 1, 2026</div>
                  </div>
                  {user.plan!=="agency" && <button className="btn btn-primary btn-sm" onClick={()=>toast("Upgrade flow coming soon","info")}>Upgrade</button>}
                </div>
                <div style={{ marginBottom:20 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                    <span style={{ fontSize:13, color:"var(--text2)" }}>AI Messages Used</span>
                    <span style={{ fontSize:13, fontWeight:600 }}>{usagePercent}%</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width:usagePercent+"%", background:usagePercent>80?"var(--accent3)":"linear-gradient(90deg, var(--accent), var(--accent2))" }}/></div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                    <span style={{ fontSize:11, color:"var(--text3)" }}>{user.plan==="free"?"68 / 100 messages":"64,800 / unlimited"}</span>
                    <span style={{ fontSize:11, color:"var(--text3)" }}>Resets June 1</span>
                  </div>
                </div>
                <div style={{ display:"flex", gap:10 }}>
                  <button className="btn btn-ghost btn-sm" onClick={()=>toast("Billing portal opening...","info")}><I n="dollar" s={13}/>Billing Portal</button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>toast("Invoice downloaded!")}><I n="download" s={13}/>Download Invoice</button>
                </div>
              </div>
            </div>
          )}

          {tab==="notifications" && (
            <div className="card" style={{ padding:28 }}>
              <h3 style={{ fontSize:16, fontWeight:700, marginBottom:20 }}>Notification Preferences</h3>
              {[
                { key:"email_workflows", label:"Workflow completions", desc:"Get notified when automations finish running", icon:"workflow" },
                { key:"email_billing", label:"Billing alerts", desc:"Invoices, payment failures, plan changes", icon:"dollar" },
                { key:"push_ai", label:"AI agent updates", desc:"When agents complete long-running tasks", icon:"robot" },
                { key:"push_team", label:"Team activity", desc:"New members, role changes, shares", icon:"users" },
                { key:"weekly_report", label:"Weekly digest", desc:"Summary of AI usage and performance every Monday", icon:"analytics" },
              ].map(n => (
                <div key={n.key} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 0", borderBottom:"1px solid var(--border)" }}>
                  <div style={{ width:36, height:36, borderRadius:10, background:"rgba(108,99,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><I n={n.icon} s={16} c="var(--accent)"/></div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:14, fontWeight:600, marginBottom:2 }}>{n.label}</div>
                    <div style={{ fontSize:12, color:"var(--text3)" }}>{n.desc}</div>
                  </div>
                  <label className="switch" style={{ flexShrink:0, position:"relative", display:"inline-flex", cursor:"pointer", width:44, height:24 }}>
                    <input type="checkbox" checked={notifSettings[n.key as keyof typeof notifSettings]} onChange={()=>setNotifSettings(p=>({...p,[n.key]:!p[n.key as keyof typeof notifSettings]}))} style={{ opacity:0, width:0, height:0, position:"absolute" }}/>
                    <div style={{ position:"absolute", inset:0, borderRadius:100, background:notifSettings[n.key as keyof typeof notifSettings]?"var(--accent)":"var(--surface2)", border:`1px solid ${notifSettings[n.key as keyof typeof notifSettings]?"transparent":"var(--border2)"}`, transition:"background 0.2s" }}/>
                    <div style={{ position:"absolute", top:3, left:notifSettings[n.key as keyof typeof notifSettings]?23:3, width:16, height:16, borderRadius:"50%", background:"#fff", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.3)" }}/>
                  </label>
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop:20, alignSelf:"flex-start" }} onClick={()=>toast("Notification settings saved!")}><I n="check" s={14}/>Save Preferences</button>
            </div>
          )}

          {tab==="security" && (
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div className="card" style={{ padding:24 }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Two-Factor Authentication</h3>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px", borderRadius:14, background:"var(--surface)" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:12, background:twoFA?"rgba(0,212,170,0.15)":"rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center" }}><I n="shield" s={18} c={twoFA?"var(--accent2)":"var(--text3)"}/></div>
                    <div>
                      <div style={{ fontSize:14, fontWeight:600 }}>2FA {twoFA?"Enabled":"Disabled"}</div>
                      <div style={{ fontSize:12, color:"var(--text3)" }}>Authenticator app or SMS</div>
                    </div>
                  </div>
                  <button className={`btn btn-sm ${twoFA?"btn-ghost":"btn-primary"}`} onClick={()=>{ setTwoFA(!twoFA); toast(twoFA?"2FA disabled":"2FA enabled!",twoFA?"info":"success"); }}>{twoFA?"Disable":"Enable 2FA"}</button>
                </div>
              </div>
              <div className="card" style={{ padding:24 }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Active Sessions</h3>
                {[
                  { device:"MacBook Pro — Chrome", location:"San Francisco, US", time:"Now · Current session", current:true },
                  { device:"iPhone 15 Pro — Safari", location:"San Francisco, US", time:"2 hours ago", current:false },
                  { device:"Windows — Edge", location:"New York, US", time:"3 days ago", current:false },
                ].map((s,i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 0", borderBottom:i<2?"1px solid var(--border)":"none" }}>
                    <div style={{ width:36, height:36, borderRadius:10, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center" }}><I n="globe" s={16} c="var(--text3)"/></div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:600 }}>{s.device}</div>
                      <div style={{ fontSize:12, color:"var(--text3)" }}>{s.location} · {s.time}</div>
                    </div>
                    {s.current?<span className="tag" style={{ background:"rgba(0,212,170,0.15)", color:"var(--accent2)", border:"1px solid rgba(0,212,170,0.25)", fontSize:11 }}>Current</span>:<button className="btn btn-danger btn-sm" onClick={()=>toast("Session revoked")}>Revoke</button>}
                  </div>
                ))}
              </div>
              <div className="card" style={{ padding:24 }}>
                <h3 style={{ fontSize:15, fontWeight:700, marginBottom:8 }}>Change Password</h3>
                <p style={{ fontSize:13, color:"var(--text3)", marginBottom:16 }}>Last changed 30 days ago</p>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  <input type="password" placeholder="Current password"/>
                  <input type="password" placeholder="New password"/>
                  <input type="password" placeholder="Confirm new password"/>
                  <button className="btn btn-primary" style={{ alignSelf:"flex-start" }} onClick={()=>toast("Password updated!")}><I n="lock" s={14}/>Update Password</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN PAGE ───────────────────────────────────────────────────────────────
function AdminPage({ toast }: { toast:(m:string,t?:"success"|"error"|"info")=>void }) {
  const [activeTab, setActiveTab] = useState<"overview"|"users"|"logs">("overview");
  const adminUsers = [
    { id:"1", name:"Alex Johnson", email:"alex@acme.com", plan:"pro", msgs:1240, status:"active", joined:"Jan 2025" },
    { id:"2", name:"Maya Patel", email:"maya@techflow.com", plan:"agency", msgs:8920, status:"active", joined:"Dec 2024" },
    { id:"3", name:"Chris Lee", email:"chris@startup.io", plan:"free", msgs:87, status:"active", joined:"May 2025" },
    { id:"4", name:"Jordan Kim", email:"jordan@corp.com", plan:"pro", msgs:2341, status:"suspended", joined:"Feb 2025" },
  ];

  const logs = [
    { time:"09:12:34", level:"info", msg:"User alex@acme.com sent AI message via GPT-4o" },
    { time:"09:11:20", level:"info", msg:"Workflow 'Lead Capture' completed successfully (run #247)" },
    { time:"09:08:45", level:"warn", msg:"Rate limit approaching for user maya@techflow.com (90%)" },
    { time:"09:05:12", level:"info", msg:"Stripe webhook received: subscription.updated" },
    { time:"09:02:00", level:"error", msg:"OpenAI API timeout for request req_abc123 — retried successfully" },
    { time:"08:58:30", level:"info", msg:"New user registered: chris@startup.io" },
  ];

  const planColors: Record<string,string> = { free:"var(--text3)", pro:"var(--accent)", agency:"var(--accent4)" };
  const statusColors: Record<string,string> = { active:"var(--accent2)", suspended:"var(--accent3)" };
  const logColors: Record<string,string> = { info:"var(--accent2)", warn:"var(--accent4)", error:"var(--accent3)" };

  return (
    <div style={{ maxWidth:1100 }}>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
        <div style={{ width:40, height:40, borderRadius:12, background:"rgba(108,99,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}><I n="shield" s={20} c="var(--accent)"/></div>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.5px", marginBottom:2 }}>Admin Panel</h1>
          <p style={{ color:"var(--text2)", fontSize:14 }}>Platform management and monitoring</p>
        </div>
      </div>

      <div className="segment" style={{ marginBottom:24 }}>
        {[["overview","Overview"],["users","Users"],["logs","System Logs"]].map(([id,label]) => (
          <button key={id} className={`segment-btn ${activeTab===id?"active":""}`} onClick={()=>setActiveTab(id as typeof activeTab)}>{label}</button>
        ))}
      </div>

      {activeTab==="overview" && (
        <>
          <div className="grid-4" style={{ marginBottom:24 }}>
            {[["Total Users","4,821","users","var(--accent)"],["Monthly Revenue","$38.4K","dollar","var(--accent2)"],["AI Tokens Used","76.2M","zap","#a78bfa"],["Active Workflows","142","workflow","var(--accent4)"]].map(([l,v,ic,c])=>(
              <div key={l} className="stat-card">
                <div style={{ display:"flex", justifyContent:"space-between" }}><span className="stat-label">{l}</span><I n={ic as string} s={16} c={c as string}/></div>
                <div className="stat-value" style={{ fontSize:26 }}>{v}</div>
              </div>
            ))}
          </div>
          <div className="grid-2" style={{ gap:20 }}>
            <div className="card" style={{ padding:24 }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Plan Distribution</h3>
              {[["Free","3,240","67%","var(--text3)"],["Pro","1,410","29%","var(--accent)"],["Agency","171","4%","var(--accent4)"]].map(([plan,users,pct,color])=>(
                <div key={plan} style={{ marginBottom:14 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                      <div style={{ width:10, height:10, borderRadius:"50%", background:color as string }}/>
                      <span style={{ fontSize:13, fontWeight:600 }}>{plan}</span>
                      <span style={{ fontSize:12, color:"var(--text3)" }}>{users} users</span>
                    </div>
                    <span style={{ fontSize:13, fontWeight:700, color:color as string }}>{pct}</span>
                  </div>
                  <div className="progress-bar"><div className="progress-fill" style={{ width:pct, background:color as string }}/></div>
                </div>
              ))}
            </div>
            <div className="card" style={{ padding:24 }}>
              <h3 style={{ fontSize:15, fontWeight:700, marginBottom:16 }}>Revenue (Last 6 Months)</h3>
              <MiniLineChart data={REV_DATA.slice(6)} color="var(--accent2)" height={100}/>
              <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                {MONTHS.slice(6).map(m=><span key={m} style={{ fontSize:10, color:"var(--text3)" }}>{m}</span>)}
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab==="users" && (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", gap:12, alignItems:"center" }}>
            <div style={{ flex:1, position:"relative" }}>
              <div style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }}><I n="search" s={14} c="var(--text3)"/></div>
              <input placeholder="Search users..." style={{ paddingLeft:36, height:38, fontSize:13, borderRadius:10 }}/>
            </div>
            <button className="btn btn-ghost btn-sm"><I n="filter" s={14}/>Filter</button>
          </div>
          <table>
            <thead><tr><th>User</th><th>Plan</th><th>Messages</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
            <tbody>
              {adminUsers.map(u => (
                <tr key={u.id}>
                  <td><div><div style={{ fontWeight:600, color:"var(--text)", fontSize:14 }}>{u.name}</div><div style={{ fontSize:12, color:"var(--text3)" }}>{u.email}</div></div></td>
                  <td><span className="tag" style={{ background:planColors[u.plan]+"18", color:planColors[u.plan], border:`1px solid ${planColors[u.plan]}25`, textTransform:"capitalize" }}>{u.plan}</span></td>
                  <td style={{ fontWeight:600 }}>{u.msgs.toLocaleString()}</td>
                  <td><span style={{ fontSize:13, color:statusColors[u.status] }}>{u.status}</span></td>
                  <td style={{ color:"var(--text3)" }}>{u.joined}</td>
                  <td>
                    <div style={{ display:"flex", gap:6 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" style={{ padding:5 }} onClick={()=>toast("User details coming soon","info")}><I n="eye" s={13}/></button>
                      <button className="btn btn-danger btn-sm btn-icon" style={{ padding:5 }} onClick={()=>toast(`User ${u.status==="active"?"suspended":"reactivated"}`)}><I n={u.status==="active"?"lock":"check"} s={13}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab==="logs" && (
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <h3 style={{ fontSize:14, fontWeight:700 }}>System Logs</h3>
            <button className="btn btn-ghost btn-sm" onClick={()=>toast("Logs refreshed","info")}><I n="refresh" s={14}/>Refresh</button>
          </div>
          <div style={{ fontFamily:"monospace", fontSize:13 }}>
            {logs.map((l,i) => (
              <div key={i} style={{ display:"flex", gap:12, padding:"10px 20px", borderBottom:i<logs.length-1?"1px solid rgba(255,255,255,0.04)":"none", transition:"background 0.15s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background="var(--surface)"}
                onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background="transparent"}>
                <span style={{ color:"var(--text3)", flexShrink:0 }}>{l.time}</span>
                <span className="tag" style={{ background:logColors[l.level]+"18", color:logColors[l.level], border:`1px solid ${logColors[l.level]}25`, flexShrink:0, fontSize:10 }}>{l.level.toUpperCase()}</span>
                <span style={{ color:"var(--text2)" }}>{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
