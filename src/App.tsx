import React, { useEffect, useRef, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

const pad=(n:number)=>String(n).padStart(2,"0");
const fmt=(s:number)=>{s=Math.max(0,Math.floor(s));const m=Math.floor(s/60),r=s%60;return `${pad(m)}:${pad(r)}`;};

export default function App(){
  const [work,setWork]=useState(25);
  const [brk,setBrk]=useState(5);
  const [left,setLeft]=useState(work*60);
  const [mode,setMode]=useState<"work"|"break">("work");
  const [run,setRun]=useState(false);
  const t=useRef<any>(null);

  useEffect(()=>{ if(!run) return; t.current=setInterval(()=>{
    setLeft(p=>{ if(p<=1){ clearInterval(t.current); setRun(false); onDone(); return 0;} return p-1; });
  },1000); return ()=>clearInterval(t.current); },[run]);

  useEffect(()=>{ setLeft((mode==="work"?work:brk)*60); },[mode,work,brk]);

  useEffect(()=>{ (async()=>{ try{ if(Capacitor.isNativePlatform()){ await LocalNotifications.requestPermissions(); } else if("Notification" in window && (Notification as any).permission==="default"){ (Notification as any).requestPermission?.(); } }catch{} })(); },[]);

  const notify=async(title:string,body:string)=>{
    try{
      if(!Capacitor.isNativePlatform() && "Notification" in window && (Notification as any).permission==="granted"){ new Notification(title,{body}); return; }
      if(Capacitor.isNativePlatform()){ await LocalNotifications.schedule({notifications:[{id:Date.now()%100000|0,title,body,schedule:{at:new Date(Date.now()+200)}}]}); }
    }catch{}
  };

  const onDone=()=>{
    const to = mode==="work"?"break":"work";
    notify(mode==="work"?"番茄完成":"休息结束", to==="work"?"准备开始专注":"站起来活动一下～");
    setMode(to);
    setLeft((to==="work"?work:brk)*60);
    setRun(true);
  };

  return (
    <div style={{fontFamily:"system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial",padding:"24px",maxWidth:680,margin:"0 auto"}}>
      <h1>正能量打卡 · 纯云端构建</h1>
      <p style={{color:"#64748b"}}>无需本地命令，GitHub Actions 自动生成 APK</p>
      <div style={{display:"flex",gap:12,alignItems:"center",marginTop:12}}>
        <b>模式：</b>
        <button onClick={()=>{setMode("work"); setRun(false);}} disabled={mode==="work"}>专注</button>
        <button onClick={()=>{setMode("break"); setRun(false);}} disabled={mode==="break"}>休息</button>
      </div>
      <div style={{display:"flex",gap:12,alignItems:"center",marginTop:12}}>
        <label>专注(分)：<input type="number" value={work} onChange={e=>setWork(Math.max(1,Number(e.target.value)||25))}/></label>
        <label>休息(分)：<input type="number" value={brk} onChange={e=>setBrk(Math.max(1,Number(e.target.value)||5))}/></label>
      </div>
      <div style={{margin:"24px 0", fontSize:72, fontWeight:700}}>{fmt(left)}</div>
      <div style={{display:"flex",gap:12}}>
        <button onClick={()=>setRun(r=>!r)}>{run?"暂停":"开始"}</button>
        <button onClick={()=>{ setRun(false); setLeft((mode==="work"?work:brk)*60); }}>重置</button>
        <button onClick={()=>{ setRun(false); onDone(); }}>跳过</button>
      </div>
    </div>
  );
}