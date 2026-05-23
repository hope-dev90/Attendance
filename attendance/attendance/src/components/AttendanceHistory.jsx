import { useState, useRef } from 'react';
import {
  History, ChevronDown, ChevronUp,
  Download, FileText, X,
  CheckCircle2, Clock, UserX,
} from 'lucide-react';



const STATUS_META = {
  present: { label: 'Present', pillClass: 'bg-emerald-50 text-emerald-700', headerClass: 'bg-emerald-600', textClass: 'text-emerald-600', shortLabel: 'P' },
  late:    { label: 'Late',    pillClass: 'bg-amber-50 text-amber-700',     headerClass: 'bg-amber-500',   textClass: 'text-amber-600',   shortLabel: 'L' },
  absent:  { label: 'Absent',  pillClass: 'bg-red-50 text-red-700',         headerClass: 'bg-red-600',     textClass: 'text-red-600',     shortLabel: 'A' },
};

/* ─── helpers ───────────────────────────────────────── */
const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

const fmtShort = (iso) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0] || '').join('').slice(0, 2).toUpperCase();

const StatusIcon = ({ status }) => {
  if (status === 'present') return <CheckCircle2 size={11} />;
  if (status === 'late')    return <Clock size={11} />;
  return <UserX size={11} />;
};

/* ─── StatusPopover ─────────────────────────────────── */
const StatusPopover = ({ status, count, records }) => {
  const [open, setOpen] = useState(false);
  const timerRef        = useRef(null);
  const meta            = STATUS_META[status];

  const students = (records || []).filter((r) => r.status === status);

  // Only computed for absent
  const withReason = status === 'absent' ? students.filter((s) => s.note)  : [];
  const noReason   = status === 'absent' ? students.filter((s) => !s.note) : [];

  const show = () => { clearTimeout(timerRef.current); setOpen(true); };
  const hide = () => { timerRef.current = setTimeout(() => setOpen(false), 150); };

  return (
    <div className="relative" onMouseEnter={show} onMouseLeave={hide}>
      <span className={`cursor-default select-none inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${meta.pillClass}`}>
        {meta.shortLabel} {count ?? 0}
      </span>

      {/* Present: plain count hint only */}
      {status === 'present' && open && count > 0 && (
        <div className="absolute z-50 bottom-full mb-2 left-0 bg-white border border-slate-200 rounded-xl shadow-lg px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">
          {count} student{count !== 1 ? 's' : ''} present
        </div>
      )}

      {/* Late: names only — only render when records exist */}
      {status === 'late' && open && count > 0 && students.length > 0 && (
        <div
          className="absolute z-50 bottom-full mb-2 right-0 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
          onMouseEnter={show} onMouseLeave={hide}
        >
          <div className={`px-4 py-2.5 ${meta.headerClass}`}>
            <span className="text-xs font-semibold text-white uppercase tracking-widest">Late · {students.length}</span>
          </div>
          <div className="max-h-60 overflow-y-auto">
              {students.map((r) => (
                <div key={r.student_id} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-50 last:border-0">
                  <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                    {getInitials(r.student_name)}
                  </div>
                  <p className="text-xs font-semibold text-slate-700 truncate">{r.student_name}</p>
                </div>
              ))}
            </div>
        </div>
      )}

      {/* Absent: names grouped by reason — only render when records exist */}
      {status === 'absent' && open && count > 0 && students.length > 0 && (
        <div
          className="absolute z-50 bottom-full mb-2 right-0 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
          onMouseEnter={show} onMouseLeave={hide}
        >
          <div className={`px-4 py-2.5 ${meta.headerClass}`}>
            <span className="text-xs font-semibold text-white uppercase tracking-widest">Absent · {students.length}</span>
          </div>
          <div className="max-h-60 overflow-y-auto">
              {/* With reason section */}
              {withReason.length > 0 && (
                <>
                  {noReason.length > 0 && (
                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">
                      With reason
                    </p>
                  )}
                  {withReason.map((r) => (
                    <div key={r.student_id} className="flex items-start gap-2.5 px-4 py-2.5 border-b border-slate-50 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-semibold flex-shrink-0 mt-0.5">
                        {getInitials(r.student_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-700 truncate">{r.student_name}</p>
                        <p className="text-[11px] text-slate-400 truncate">{r.note}</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {/* No reason section */}
              {noReason.length > 0 && (
                <>
                  {withReason.length > 0 && (
                    <p className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-100">
                      No reason given
                    </p>
                  )}
                  {noReason.map((r) => (
                    <div key={r.student_id} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-slate-50 last:border-0">
                      <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
                        {getInitials(r.student_name)}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 truncate">{r.student_name}</p>
                    </div>
                  ))}
                </>
              )}
            </div>
        </div>
      )}
    </div>
  );
};

/* ─── CSV / PDF export ── */
const exportCSV = (session, monitorClass) => {
  const rows = [
    ['Date', 'Class', 'Student', 'Status', 'Note'],
    ...(session.records || []).map((r) => [
      fmtShort(session.session_date), monitorClass,
      r.student_name || r.student_id, r.status, r.note || '',
    ]),
  ];
  const csv = rows.map((row) =>
    row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url;
  a.download = `attendance_${monitorClass}_${fmtShort(session.session_date).replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const exportPDF = (session, monitorClass) => {
  const records = session.records || [];
  const colors  = { present: '#059669', late: '#d97706', absent: '#dc2626' };
  const rows = records.map((r) => {
    const st = STATUS_META[r.status] || STATUS_META.present;
    return `<tr><td>${r.student_name || r.student_id}</td><td style="color:${colors[r.status]||'#374151'};font-weight:600">${st.label}</td><td>${r.note||'—'}</td></tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Attendance – ${monitorClass}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:system-ui,sans-serif;color:#111827;padding:2rem}
  header{margin-bottom:2rem;border-bottom:2px solid #e5e7eb;padding-bottom:1rem}header h1{font-size:1.4rem;font-weight:700}
  header p{font-size:.85rem;color:#6b7280;margin-top:4px}.stats{display:flex;gap:1.5rem;margin:1rem 0 2rem}
  .stat{text-align:center;padding:.6rem 1.2rem;border-radius:8px;background:#f9fafb;border:1px solid #e5e7eb}
  .stat .num{font-size:1.5rem;font-weight:700}.stat .lbl{font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:#9ca3af;margin-top:2px}
  .p .num{color:#059669}.l .num{color:#d97706}.a .num{color:#dc2626}
  table{width:100%;border-collapse:collapse;font-size:.9rem}
  th{text-align:left;padding:8px 12px;background:#f3f4f6;font-weight:600;font-size:.75rem;text-transform:uppercase;letter-spacing:.05em;color:#6b7280}
  td{padding:10px 12px;border-bottom:1px solid #f3f4f6}tr:last-child td{border-bottom:none}
  footer{margin-top:2rem;font-size:.75rem;color:#9ca3af;text-align:right}</style></head><body>
  <header><h1>Attendance — Class ${monitorClass}</h1><p>${fmtDate(session.session_date)}${session.is_delayed?' · Delayed':''}</p></header>
  <div class="stats">
    <div class="stat p"><div class="num">${session.present_count||0}</div><div class="lbl">Present</div></div>
    <div class="stat l"><div class="num">${session.late_count||0}</div><div class="lbl">Late</div></div>
    <div class="stat a"><div class="num">${session.absent_count||0}</div><div class="lbl">Absent</div></div>
  </div>
  <table><thead><tr><th>Student</th><th>Status</th><th>Note</th></tr></thead>
  <tbody>${rows||'<tr><td colspan="3" style="color:#9ca3af;text-align:center;padding:2rem">No records</td></tr>'}</tbody></table>
  <footer>Exported ${new Date().toLocaleString()}</footer></body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
};

/* ─── SessionRow ── */
const SessionRow = ({ session, monitorClass }) => {
  const [expanded, setExpanded] = useState(false);
  const records   = session.records || [];
  const hasDetail = records.length > 0;

  return (
    <div className="border border-slate-100 rounded-2xl bg-white overflow-visible">
      <div
        className="flex flex-wrap items-center gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50/60 transition-all rounded-2xl"
        onClick={() => hasDetail && setExpanded((v) => !v)}
      >
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700">{fmtDate(session.session_date)}</p>
          <p className="text-xs mt-0.5">
            {session.is_delayed
              ? <span className="text-amber-500 font-medium">Delayed submission</span>
              : <span className="text-slate-400">Submitted on time</span>}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <StatusPopover status="present" count={session.present_count} records={records} />
          <StatusPopover status="late"    count={session.late_count}    records={records} />
          <StatusPopover status="absent"  count={session.absent_count}  records={records} />
        </div>

        <div className="flex gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => exportCSV(session, monitorClass)}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all">
            <Download size={12} /> CSV
          </button>
          <button onClick={() => exportPDF(session, monitorClass)}
            className="flex items-center gap-1 text-xs font-medium text-slate-500 border border-slate-200 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-all">
            <FileText size={12} /> PDF
          </button>
        </div>

        {hasDetail && (
          <div className="text-slate-300 flex-shrink-0">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        )}
      </div>

      {expanded && hasDetail && (
        <div className="border-t border-slate-100">
          <div className="grid grid-cols-12 px-5 py-2 bg-slate-50">
            <span className="col-span-6 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Student</span>
            <span className="col-span-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Status</span>
            <span className="col-span-3 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Note</span>
          </div>
          {records.map((r, i) => {
            const meta = STATUS_META[r.status] || STATUS_META.present;
            return (
              <div key={r.student_id ?? i} className="grid grid-cols-12 items-center px-5 py-3 border-t border-slate-50 hover:bg-slate-50/50 transition-all">
                <div className="col-span-6 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
                    {getInitials(r.student_name)}
                  </div>
                  <span className="text-sm text-slate-700 font-medium truncate">{r.student_name || r.student_id}</span>
                </div>
                <div className="col-span-3">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${meta.textClass}`}>
                    <StatusIcon status={r.status} /> {meta.label}
                  </span>
                </div>
                <div className="col-span-3 text-xs text-slate-400 truncate">
                  {r.note || <span className="text-slate-200">—</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ─── Main export ── */
const AttendanceHistory = ({ history = [], monitorClass = 'Y1A', onClose }) => (
  <div className="bg-white border border-slate-100 rounded-2xl overflow-visible mb-6">
    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
      <div className="flex items-center gap-2">
        <History size={16} className="text-slate-400" />
        <p className="text-sm font-semibold text-slate-700">Attendance history</p>
        {history.length > 0 && (
          <span className="text-xs bg-slate-100 text-slate-500 font-medium px-2 py-0.5 rounded-full">
            {history.length} session{history.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      {onClose && (
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
          <X size={14} />
        </button>
      )}
    </div>

    {history.length === 0 ? (
      <div className="py-16 text-center px-6">
        <History size={36} className="mx-auto text-slate-200 mb-3" />
        <p className="text-sm font-semibold text-slate-400">No history yet</p>
        <p className="text-xs text-slate-300 mt-1">Submitted sessions will appear here.</p>
      </div>
    ) : (
      <div className="p-4 space-y-3 overflow-visible">
        {history.map((session) => (
          <SessionRow key={session.session_id} session={session} monitorClass={monitorClass} />
        ))}
      </div>
    )}
  </div>
);

export default AttendanceHistory;
