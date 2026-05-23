import { useState, useEffect } from "react";
import {
  ArrowLeft, Send, Search, CheckCircle2, Download, FileText,
  Plus, History, LogOut, UserCheck, LayoutDashboard, Menu, X
} from "lucide-react";
import LogoImg from "../assets/logo.jpg";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { api } from "../api";
import AttendanceHistoryPanel from "./AttendanceHistory";

const NAVY      = "#2e5a88";
const NAVY_DARK = "#1e3f63";
const SLATE_BG  = "#f4f6f9";

const NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",  icon: LayoutDashboard },
  { id: "attendance", label: "Attendance", icon: UserCheck },
  { id: "history",    label: "History",    icon: History },
];

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

const todayLabel = () =>
  new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

const initials = (name = "") =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

/* ── Status button ── */
const StatusBtn = ({ active, onClick, colorClass, label }) => (
  <button
    onClick={onClick}
    className={`w-11 h-9 rounded-lg text-xs font-black tracking-wider transition-all duration-150 ${
      active ? `${colorClass} text-white shadow` : "text-slate-400 hover:text-slate-600"
    }`}
  >
    {label}
  </button>
);


const Sidebar = ({ activePage, onNavigate, onBack, onLogout, mobileOpen, onMobileClose }) => (
  <>
    <style>{`
      .sn-sa-sidebar {
        width:260px; min-height:100vh; background:#fff;
        border-right:1px solid #e8edf4; display:flex; flex-direction:column;
        position:fixed; left:0; top:0; bottom:0; z-index:200;
        box-shadow:2px 0 16px rgba(46,90,136,.07);
        font-family:'DM Sans',sans-serif; transition:transform .25s ease;
      }
      .sn-sa-logo { display:flex; align-items:center; gap:12px; padding:26px 20px 22px; border-bottom:1px solid #f1f5f9; }
      .sn-sa-logo-icon { width:38px; height:38px; background:${NAVY}; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
      .sn-sa-logo h1 { font-size:17px; font-weight:900; color:#1e293b; letter-spacing:-.3px; line-height:1; }
      .sn-sa-logo p  { font-size:9px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#94a3b8; margin-top:3px; }
      .sn-sa-nav { flex:1; padding:18px 12px; display:flex; flex-direction:column; gap:3px; }
      .sn-sa-nav-item { display:flex; align-items:center; gap:11px; padding:11px 13px; border-radius:12px; font-size:14px; font-weight:700; color:#64748b; cursor:pointer; transition:all .15s; border:none; background:transparent; width:100%; text-align:left; font-family:'DM Sans',sans-serif; }
      .sn-sa-nav-item:hover { background:#f1f5f9; color:#1e293b; }
      .sn-sa-nav-active { background:${NAVY} !important; color:#fff !important; }
      .sn-sa-nav-item svg { opacity:.65; flex-shrink:0; }
      .sn-sa-nav-active svg { opacity:1; }
      .sn-sa-footer { padding:12px; border-top:1px solid #f1f5f9; display:flex; flex-direction:column; gap:2px; }
      .sn-sa-footer-btn { display:flex; align-items:center; gap:11px; padding:11px 13px; border-radius:12px; font-size:14px; font-weight:700; cursor:pointer; transition:all .15s; border:none; background:transparent; width:100%; text-align:left; font-family:'DM Sans',sans-serif; }
      .sn-sa-back   { color:#64748b; } .sn-sa-back:hover   { background:#f1f5f9; color:#1e293b; }
      .sn-sa-logout { color:#ef4444; } .sn-sa-logout:hover { background:#fff5f5; }
      @media(max-width:768px){
        .sn-sa-sidebar { transform:translateX(-100%); }
        .sn-sa-sidebar.open { transform:translateX(0); }
      }
    `}</style>
    <aside className={`sn-sa-sidebar ${mobileOpen ? "open" : ""}`}>
      <div className="sn-sa-logo">
        <div className="sn-sa-logo-icon" style={{ background:"#fff", border:"1px solid #e8edf4", overflow:"hidden" }}>
          <img src={LogoImg} alt="logo" style={{ width:"100%", height:"100%", objectFit:"contain" }} />
        </div>
        <div>
          <h1>StaffNet</h1>
          <p>Attendance Section</p>
          <p>Beyond 8:30 a.m submission will be delayed</p>
        </div>
        <button onClick={onMobileClose} style={{ marginLeft:"auto", background:"none", border:"none", color:"#94a3b8", cursor:"pointer", display:"none" }} className="sn-sa-close"><X size={18} /></button>
      </div>
      <nav className="sn-sa-nav">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`sn-sa-nav-item ${activePage === id ? "sn-sa-nav-active" : ""}`}
            onClick={() => { onNavigate(id); onMobileClose(); }}>
            <Icon size={18} />{label}
          </button>
        ))}
      </nav>
      <div className="sn-sa-footer">
        <button className="sn-sa-footer-btn sn-sa-back" onClick={onBack}><ArrowLeft size={16} /> Back</button>
        <button className="sn-sa-footer-btn sn-sa-logout" onClick={onLogout}><LogOut size={16} /> Logout</button>
      </div>
    </aside>
  </>
);

/* ── Main component ── */
const StudentAttendance = ({ onBack, monitorClass = "Y1A" }) => {
  const [students,       setStudents]       = useState([]);
  const [attendance,     setAttendance]     = useState({});
  const [notes,          setNotes]          = useState({});
  const [searchTerm,     setSearchTerm]     = useState("");
  const [showHistory,    setShowHistory]    = useState(false);
  const [isSubmitted,    setIsSubmitted]    = useState(false);
  const [isSubmitting,   setIsSubmitting]   = useState(false);
  const [isLoading,      setIsLoading]      = useState(true);
  const [history,        setHistory]        = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [apiError,       setApiError]       = useState("");
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [activePage,     setActivePage]     = useState("attendance");

  /* Load students from backend */
  useEffect(() => {
    setIsLoading(true);
    setApiError("");
    api.getMyStudents()
      .then((data) => {
        const normalized = data.map((s) => ({
          id: s.id, name: s.full_name, studentNumber: s.student_number, class: monitorClass,
        }));
        setStudents(normalized);
        const init = {};
        normalized.forEach((st) => (init[st.id] = "present"));
        setAttendance(init);
      })
      .catch((err) => setApiError(err.message))
      .finally(() => setIsLoading(false));
  }, [monitorClass]);

  /* Load history when tab opens */
  useEffect(() => {
    if (activePage !== "history") return;
    setHistoryLoading(true);
    api.getAttendanceHistory()
      .then((data) => {
        
        setHistory(data);
      })
      .catch((err) => setApiError(err.message))
      .finally(() => setHistoryLoading(false));
  }, [activePage, monitorClass]);

  const toggleStatus = (id, status) => {
    setAttendance((prev) => ({ ...prev, [id]: status }));
    if (status !== "absent") setNotes((prev) => { const n = { ...prev }; delete n[id]; return n; });
  };

  const filteredStudents = students.filter((s) =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    present: Object.values(attendance).filter((v) => v === "present").length,
    late:    Object.values(attendance).filter((v) => v === "late").length,
    absent:  Object.values(attendance).filter((v) => v === "absent").length,
  };

  const pieData = [
    { name: "Present", value: stats.present, color: "#10b981" },
    { name: "Late",    value: stats.late,    color: "#f59e0b" },
    { name: "Absent",  value: stats.absent,  color: "#ef4444" },
  ];

  const classSummary = [{ class: monitorClass, Present: stats.present, Absent: stats.absent }];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setApiError("");
    try {
      const today = new Date().toISOString().split("T")[0];
      await api.submitAttendance({
        session_date: today,
        records: students.map((s) => ({
          student_id: s.id,
          status: attendance[s.id] || "present",
          note: notes[s.id] || null,
        })),
      });
      setIsSubmitted(true);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigate = (id) => {
    setActivePage(id);
    if (id === "dashboard") onBack?.();
    setSidebarOpen(false);
  };

  /* Success screen */
  if (isSubmitted) {
    return (
      <div style={{ minHeight:"100vh", background:SLATE_BG, fontFamily:"'DM Sans',sans-serif" }}
        className="flex items-center justify-center">
        <div className="text-center" style={{ animation:"fadeIn .3s ease" }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background:"#d1fae5", color:"#10b981" }}>
            <CheckCircle2 size={40} />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-1">Attendance Submitted!</h2>
          <p className="text-slate-500 mb-6">Record saved for Class {monitorClass}</p>
          <button onClick={() => { setIsSubmitted(false); onBack?.(); }}
            className="text-white font-bold px-8 py-3 rounded-xl transition-all"
            style={{ background:NAVY }}>
            Return Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;900&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes logoFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
        .sa-root { font-family:'DM Sans',sans-serif; background:${SLATE_BG}; min-height:100vh; display:flex; }
        .sa-main { margin-left:260px; flex:1; padding:0 24px 40px; }
        .card { background:#fff; border-radius:16px; border:1px solid #e8edf4; box-shadow:0 2px 12px rgba(46,90,136,.06); }
        .stat-card-active { background:${NAVY}; color:#fff; border-radius:12px; }
        .stat-card { background:#fff; border-radius:12px; border:1px solid #e8edf4; }
        .nav-btn { display:flex; align-items:center; gap:8px; padding:10px 18px; border-radius:12px; font-weight:700; font-size:14px; transition:all .15s; border:1px solid #e8edf4; background:#fff; color:#64748b; cursor:pointer; }
        .nav-btn:hover { background:#f1f5f9; }
        .nav-btn-primary { background:${NAVY}; color:#fff; border-color:${NAVY}; }
        .nav-btn-primary:hover { background:${NAVY_DARK}; }
        .submit-btn { background:${NAVY}; color:#fff; border:none; padding:12px 32px; border-radius:12px; font-weight:800; font-size:14px; letter-spacing:.05em; text-transform:uppercase; cursor:pointer; display:flex; align-items:center; gap:8px; transition:all .15s; box-shadow:0 4px 14px rgba(46,90,136,.25); }
        .submit-btn:hover:not(:disabled) { background:${NAVY_DARK}; transform:translateY(-1px); }
        .submit-btn:disabled { opacity:.6; cursor:not-allowed; }
        .loader { width:20px; height:20px; border:3px solid rgba(255,255,255,.3); border-top-color:#fff; border-radius:50%; animation:spin .7s linear infinite; }
        .logo-float { animation:logoFloat 3s ease-in-out infinite; }
        .sa-topbar { display:none; align-items:center; gap:14px; padding:14px 20px; background:#fff; border-bottom:1px solid #e8edf4; position:sticky; top:0; z-index:99; }
        .sa-overlay { display:none; position:fixed; inset:0; background:rgba(0,0,0,.35); z-index:150; }
        input:focus { outline:none; }
        @media(max-width:768px){
          .sa-main { margin-left:0; }
          .sa-topbar { display:flex; }
          .sa-overlay { display:block; }
          .sn-sa-close { display:block !important; }
        }
      `}</style>

      {sidebarOpen && <div className="sa-overlay" onClick={() => setSidebarOpen(false)} />}

      <Sidebar
        activePage={activePage}
        onNavigate={handleNavigate}
        onBack={onBack}
        onLogout={onBack}
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />

      <div className="sa-root">
        <div className="sa-main">
          {/* Mobile topbar */}
          <div className="sa-topbar">
            <button onClick={() => setSidebarOpen(true)} style={{ background:"none", border:"none", cursor:"pointer", color:"#475569" }}>
              <Menu size={22} />
            </button>
            <span style={{ fontWeight:900, fontSize:16, color:"#1e293b", fontFamily:"'DM Sans',sans-serif" }}>StaffNet</span>
          </div>

          {/* Animated logo */}
          <div style={{ display:"flex", justifyContent:"center", paddingTop:32, paddingBottom:8 }}>
         
          </div>

          <div style={{ maxWidth:1100, margin:"0 auto", padding:"24px 0" }}>

            {/* Header */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:32, flexWrap:"wrap", gap:16 }}>
              <div>
                <h1 style={{ fontSize:28, fontWeight:900, color:"#1e293b", letterSpacing:"-.5px" }}>Attendance</h1>
                <p style={{ color:"#94a3b8", fontWeight:600, marginTop:2, fontSize:14 }}>
                  {todayLabel()} — <span style={{ color:NAVY }}>Class {monitorClass}</span>
                </p>
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button className="nav-btn" onClick={() => handleNavigate(activePage === "history" ? "attendance" : "history")}>
                  <History size={16} />
                  {activePage === "history" ? "Close History" : "View History"}
                </button>
                <button className="nav-btn nav-btn-primary" onClick={onBack}>
                  <ArrowLeft size={16} /> Back
                </button>
              </div>
            </div>

            {apiError && (
              <div style={{ background:"#fff5f5", border:"1px solid #fecaca", color:"#dc2626", padding:"12px 18px", borderRadius:12, marginBottom:20, fontWeight:700, fontSize:13 }}>
                {apiError}
              </div>
            )}

            {activePage === "history" ? (
              historyLoading ? (
                <div style={{ padding:48, textAlign:"center", color:"#94a3b8", fontWeight:900, fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase" }}>
                  Loading History…
                </div>
              ) : (
                <AttendanceHistoryPanel history={history} monitorClass={monitorClass} />
              )
            ) : (
              <>
                {/* Stat cards */}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:28 }}>
                  {[
                    { label:"Total",   value:students.length, active:true },
                    { label:"Present", value:stats.present,   color:"#10b981" },
                    { label:"Late",    value:stats.late,       color:"#f59e0b" },
                    { label:"Absent",  value:stats.absent,     color:"#ef4444" },
                  ].map(({ label, value, active, color }) => (
                    <div key={label} className={active ? "stat-card-active" : "stat-card"} style={{ padding:"20px 24px" }}>
                      <p style={{ fontSize:32, fontWeight:900, color:active ? "#fff" : (color || "#1e293b") }}>{value}</p>
                      <p style={{ fontSize:10, fontWeight:900, letterSpacing:"0.1em", textTransform:"uppercase", color:active ? "rgba(255,255,255,.65)" : (color ? color+"99" : "#94a3b8"), marginTop:2 }}>{label}</p>
                    </div>
                  ))}
                </div>

                {/* Charts */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, marginBottom:28 }}>
                  <div className="card" style={{ padding:24 }}>
                    <p style={{ fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:"#94a3b8", marginBottom:16 }}>Status Distribution</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={4} dataKey="value">
                          {pieData.map((e) => <Cell key={e.name} fill={e.color} />)}
                        </Pie>
                        <Tooltip /><Legend iconType="circle" iconSize={9} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card" style={{ padding:24 }}>
                    <p style={{ fontSize:11, fontWeight:900, textTransform:"uppercase", letterSpacing:"0.1em", color:"#94a3b8", marginBottom:16 }}>Attendance by Class</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={classSummary} barSize={14}>
                        <XAxis dataKey="class" tick={{ fontSize:11, fontWeight:700 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize:11 }} axisLine={false} tickLine={false} />
                        <Tooltip cursor={{ fill:"#f1f5f9" }} />
                        <Bar dataKey="Present" fill={NAVY}    radius={[4,4,0,0]} />
                        <Bar dataKey="Absent"  fill="#cbd5e1" radius={[4,4,0,0]} />
                        <Legend iconType="circle" iconSize={9} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Student list */}
                <div className="card" style={{ overflow:"hidden" }}>
                  <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"18px 24px", borderBottom:"1px solid #f1f5f9", flexWrap:"wrap", gap:12 }}>
                    <p style={{ fontWeight:900, fontSize:18, color:"#1e293b" }}>Activity Log</p>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <div style={{ position:"relative" }}>
                        <Search size={15} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", color:"#94a3b8" }} />
                        <input type="text" placeholder="Search..." value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{ paddingLeft:36, paddingRight:14, paddingTop:8, paddingBottom:8, border:"1px solid #e2e8f0", borderRadius:10, fontSize:13, fontWeight:600, color:"#475569", background:"#f8fafc", width:180 }} />
                      </div>
                      <button className="nav-btn" style={{ padding:"8px 12px" }}><Download size={15} /></button>
                      <button className="nav-btn" style={{ padding:"8px 12px" }}><FileText size={15} /></button>
                    </div>
                  </div>

                  <div style={{ maxHeight:460, overflowY:"auto" }}>
                    {isLoading ? (
                      <div style={{ padding:48, textAlign:"center", color:"#94a3b8", fontWeight:900, fontSize:12, letterSpacing:"0.1em", textTransform:"uppercase" }}>Loading Students…</div>
                    ) : filteredStudents.length === 0 ? (
                      <div style={{ padding:48, textAlign:"center", color:"#94a3b8", fontWeight:700 }}>No students found</div>
                    ) : filteredStudents.map((student, idx) => (
                      <div key={student.id} style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:12, padding:"14px 24px", borderBottom:"1px solid #f8fafc", background:attendance[student.id] === "absent" ? "#fff5f5" : idx % 2 === 0 ? "#fff" : "#fafbfc", transition:"background .15s" }}>
                        <div style={{ width:38, height:38, borderRadius:"50%", background:NAVY, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:11, flexShrink:0 }}>
                          {initials(student.name)}
                        </div>
                        <div style={{ flex:1, minWidth:140 }}>
                          <p style={{ fontWeight:700, color:"#1e293b", fontSize:14 }}>{student.name}</p>
                          <p style={{ fontSize:11, color:"#94a3b8", fontWeight:600 }}>{student.studentNumber}</p>
                        </div>
                        <span style={{ background:"#eff6ff", color:NAVY, padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:800 }}>{student.class}</span>
                        <div style={{ display:"flex", background:"#f1f5f9", borderRadius:10, padding:3, gap:2 }}>
                          <StatusBtn active={attendance[student.id] === "present"} onClick={() => toggleStatus(student.id, "present")} colorClass="bg-emerald-500" label="P" />
                          <StatusBtn active={attendance[student.id] === "late"}    onClick={() => toggleStatus(student.id, "late")}    colorClass="bg-amber-400"   label="L" />
                          <StatusBtn active={attendance[student.id] === "absent"}  onClick={() => toggleStatus(student.id, "absent")}  colorClass="bg-red-500"     label="A" />
                        </div>
                        {attendance[student.id] === "absent" && (
                          <input type="text" value={notes[student.id] || ""}
                            onChange={(e) => setNotes((prev) => ({ ...prev, [student.id]: e.target.value }))}
                            placeholder="Reason for absence (optional)…"
                            style={{ width:"100%", marginTop:4, padding:"8px 14px", border:"1px solid #fecaca", borderRadius:10, fontSize:13, color:"#64748b", background:"#fff" }} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:24 }}>
                  <button className="submit-btn" onClick={handleSubmit}
                    disabled={isSubmitting || isLoading || students.length === 0}>
                    {isSubmitting ? <div className="loader" /> : <Send size={16} />}
                    {isSubmitting ? "Submitting…" : "Submit Attendance"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default StudentAttendance;
