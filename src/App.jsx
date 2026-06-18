import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { supabase } from "./lib/supabase";
import Auth from "./Auth";
import {
  Home, Users, FileText, Map, Brain, Settings, Plus, ChevronRight, ChevronLeft,
  TrendingUp, Mail, Phone, Globe, Eye, Target, BarChart3, ExternalLink,
  Copy, Check, DollarSign, Award, MapPin, Sparkles, Menu, X,
  Calendar, Clock, MessageSquare, RefreshCw, Search, Tag, Bell, Activity, Inbox,
  Layers, GripVertical, ArrowUpDown, ChevronDown, CalendarPlus, Trash2, CheckCircle2,
  CalendarDays, Building2, BedDouble, Bath, AlertCircle, CheckCheck, ChevronUp,
  Filter as FilterIcon, Bookmark, Lightbulb, LogOut, Loader2,
  Send, UserPlus, AtSign, Hash, Bot, Lock
} from "lucide-react";

// Luxury palette: cream/ivory canvas, deep charcoal text, muted gold signature.
// Brand colors deepened from their tech-pastel originals into sophisticated
// editorial hues. The original bright versions are kept as *Bright suffixes
// for use on dark surfaces (sidebar, hero overlays, the logo).
const C = {
  // Brand – deep luxury (used everywhere on light surfaces)
  teal: "#0d8b75",           tealDark: "#075d4e",         tealBright: "#5eead4",
  blue: "#3a4f7a",           blueDark: "#1f2e4a",         blueBright: "#818cf8",
  purple: "#6e4470",         purpleDark: "#4b2d4e",       purpleBright: "#a78bfa",

  // Signature accent
  gold:       "#9c7f43",
  goldSoft:   "#c2a76e",

  // Status
  green: "#0d8b75",
  amber: "#b8924a",
  red:    "#b9404a",

  // Light surface system
  bg:        "#f9f6f0",   // cream page
  bgCard:    "#ffffff",   // white card
  bgHover:   "#f3eee2",   // subtle warm hover
  bgInset:   "#fafafd",   // very subtle inset

  // Dark surface system (sidebar + hero chrome)
  bgDark:    "#1a1a22",
  bgDark2:   "#26262e",

  // Borders
  border:       "#e8e2d4",
  borderLight:  "#d4cdb9",

  // Text on light bg
  text:      "#1a1a22",
  textMuted: "#5a5a65",
  textDim:   "#9a9a95",

  // Text on dark bg
  textInv:       "#f5f1e6",
  textInvMuted:  "#9c8f7a",
};

// Editorial serif used for major page titles and editorial numbers
const SERIF_FONT = `"Cormorant Garamond", "Cormorant", Georgia, "Hoefler Text", serif`;

// Icon registry for activity types
const ICONS = { Eye, FileText, Mail, Phone, MessageSquare, MapPin, Calendar, Activity, Tag };

// Format a timestamp as a relative "time ago" string (e.g., "2h ago")
function timeAgo(input) {
  if (!input) return "";
  const d = typeof input === "string" ? new Date(input) : input;
  const seconds = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (seconds < 60)     return seconds + "s ago";
  if (seconds < 3600)   return Math.floor(seconds / 60) + "m ago";
  if (seconds < 86400)  return Math.floor(seconds / 3600) + "h ago";
  if (seconds < 604800) return Math.floor(seconds / 86400) + "d ago";
  if (seconds < 2592000)return Math.floor(seconds / 604800) + "w ago";
  return d.toLocaleDateString();
}

const TriskopeLogo = ({ size = 36, light = true }) => {
  // `light=true` means logo sits on a DARK surface (sidebar / dark hero) so it
  // uses the bright brand colors. light=false means it sits on a light surface
  // (printable doc footers, etc.) and uses the deep brand colors.
  const r = size * 0.22;
  const cx = size / 2, cy = size / 2;
  const t = light ? C.tealBright   : C.teal;
  const b = light ? C.blueBright   : C.blue;
  const p = light ? C.purpleBright : C.purple;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy - r * 0.7} r={r} fill="none" stroke={t} strokeWidth={1.5} opacity={0.95} />
      <circle cx={cx - r * 0.65} cy={cy + r * 0.45} r={r} fill="none" stroke={b} strokeWidth={1.5} opacity={0.95} />
      <circle cx={cx + r * 0.65} cy={cy + r * 0.45} r={r} fill="none" stroke={p} strokeWidth={1.5} opacity={0.95} />
    </svg>
  );
};

// ============================================================
// DATA
// ============================================================

const AGENTS = [
  { id: 1, name: "Sarah Mitchell",  plan: "Pro",        leads: 47, closings: 12, revenue: 284000, website: "sarahmitchell.triskope.io", reports: 8,  communities: 5,
    email: "sarah@triskope.io",   phone: "(843) 555-0142", address: "1700 Ocean Blvd, Suite 200, Myrtle Beach, SC 29577",
    signupDate: "2025-08-14", license: "SC RE #94821",  brokerage: "Coastal Premier Real Estate",
    paymentMethod: { brand: "Visa",        last4: "4242", expMonth: 8, expYear: 28 },
    monthlyCost: 99, status: "active", nextBillingDays: 12,
  },
  { id: 2, name: "James Parker",    plan: "Enterprise", leads: 63, closings: 18, revenue: 412000, website: "jamesparker.triskope.io",   reports: 12, communities: 8,
    email: "james@triskope.io",  phone: "(843) 555-0287", address: "44 Beach Bridge Rd, North Myrtle Beach, SC 29582",
    signupDate: "2025-04-22", license: "SC RE #88102",  brokerage: "Parker & Associates Realty",
    paymentMethod: { brand: "Mastercard", last4: "8814", expMonth: 4, expYear: 27 },
    monthlyCost: 199, status: "active", nextBillingDays: 6,
  },
  { id: 3, name: "Lisa Chen",       plan: "Starter",    leads: 22, closings: 5,  revenue: 98000,  website: "lisachen.triskope.io",       reports: 3,  communities: 2,
    email: "lisa@triskope.io",    phone: "(843) 555-0319", address: "207 Boardwalk Drive, Market Common, Myrtle Beach, SC 29577",
    signupDate: "2025-11-03", license: "SC RE #99417",  brokerage: "Independent",
    paymentMethod: { brand: "Visa",        last4: "1183", expMonth: 11, expYear: 26 },
    monthlyCost: 49,  status: "active", nextBillingDays: 19,
  },
  { id: 4, name: "Marcus Johnson",  plan: "Pro",        leads: 38, closings: 9,  revenue: 195000, website: "marcusjohnson.triskope.io", reports: 6,  communities: 4,
    email: "marcus@triskope.io",  phone: "(843) 555-0451", address: "415 Cypress Way, Carolina Forest, Myrtle Beach, SC 29579",
    signupDate: "2025-09-09", license: "SC RE #87623",  brokerage: "Grand Strand Properties",
    paymentMethod: { brand: "Amex",        last4: "1006", expMonth: 7,  expYear: 27 },
    monthlyCost: 99,  status: "active", nextBillingDays: 3,
  },
  { id: 5, name: "Amy Rodriguez",   plan: "Pro",        leads: 15, closings: 2,  revenue: 45000,  website: "amyrodriguez.triskope.io",   reports: 4,  communities: 3,
    email: "amy@triskope.io",     phone: "(843) 555-0598", address: "92 Plantation Dr, Murrells Inlet, SC 29576",
    signupDate: "2026-02-18", license: "SC RE #102558", brokerage: "Murrells Inlet Realty Group",
    paymentMethod: { brand: "Visa",        last4: "9020", expMonth: 2,  expYear: 28 },
    monthlyCost: 99,  status: "past_due", nextBillingDays: -4,
  },
];

// Leads are fetched from Supabase at runtime; see useEffect in App below.


const REPORTS = [
  { id: 1, title: "Myrtle Beach", slug: "myrtle-beach", agent: "Sarah Mitchell", views: 1247, leads: 18, avgPrice: 425000, topCommunity: "Grande Dunes", email_opens: 34, ctr: 2.1, conversions: 3 },
  { id: 2, title: "North Myrtle Beach", slug: "nmb", agent: "James Parker", views: 892, leads: 12, avgPrice: 512000, topCommunity: "Barefoot Resort", email_opens: 28, ctr: 1.8, conversions: 2 },
  { id: 3, title: "Pawleys Island", slug: "pawleys-island", agent: "Sarah Mitchell", views: 634, leads: 9, avgPrice: 725000, topCommunity: "Litchfield Beach", email_opens: 22, ctr: 3.5, conversions: 4 },
  { id: 4, title: "Carolina Forest", slug: "carolina-forest", agent: "Marcus Johnson", views: 1089, leads: 14, avgPrice: 385000, topCommunity: "Carolina Forest", email_opens: 31, ctr: 1.9, conversions: 2 },
];

const COMMUNITIES = [
  { id: 1, slug: "grande-dunes", name: "Grande Dunes", area: "Myrtle Beach", avgPrice: 525000, listings: 87, salesLastYear: 342, icon: "🏖️" },
  { id: 2, slug: "barefoot-resort", name: "Barefoot Resort & Golf", area: "North Myrtle Beach", avgPrice: 485000, listings: 112, salesLastYear: 418, icon: "⛳" },
  { id: 3, slug: "carolina-forest", name: "Carolina Forest", area: "Myrtle Beach", avgPrice: 355000, listings: 156, salesLastYear: 512, icon: "🌲" },
  { id: 4, slug: "litchfield-beach", name: "Litchfield Beach", area: "Pawleys Island", avgPrice: 645000, listings: 64, salesLastYear: 218, icon: "🏝️" },
  { id: 5, slug: "market-common", name: "The Market Common", area: "Myrtle Beach", avgPrice: 415000, listings: 82, salesLastYear: 287, icon: "🏙️" },
];

// ============================================================
// COMPONENTS
// ============================================================

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

const Badge = ({ children, color = C.teal }) => (
  <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 10px", borderRadius: 9999, fontSize: 12, fontWeight: 600, background: color + "18", color }}>{children}</span>
);

const Avatar = ({ name, size = 36, color = C.teal }) => (
  <div style={{ width: size, height: size, borderRadius: 9999, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", color, fontSize: size / 2.5, fontWeight: 700 }}>
    {name.split(" ").map(w => w[0]).join("")}
  </div>
);

const StatCard = ({ icon: Icon, label, value, change, color = C.teal, subtitle, isMobile, sparkline }) => (
  <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, flex: 1, minWidth: 160 }}>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: C.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</span>
      <Icon size={18} color={color} />
    </div>
    <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 700, color: C.text, marginBottom: 4 }}>{value}</div>
    {change && <div style={{ fontSize: 12, color: change > 0 ? C.green : C.red }}>
      {change > 0 ? "↑" : "↓"} {Math.abs(change)}% from last month
    </div>}
    {subtitle && <div style={{ fontSize: 11, color: C.textDim, marginTop: 8 }}>{subtitle}</div>}
  </div>
);

const EmptyState = ({ icon: Icon = Inbox, title, message, action }) => (
  <div style={{ textAlign: "center", padding: "60px 24px", color: C.textMuted }}>
    <Icon size={48} style={{ marginBottom: 16, opacity: 0.4 }} />
    <h3 style={{ fontSize: 18, fontWeight: 600, color: C.text, marginBottom: 8 }}>{title}</h3>
    <p style={{ fontSize: 14, marginBottom: 24 }}>{message}</p>
    {action}
  </div>
);

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 768);
  const [view, setView] = useState("dashboard");
  const [toast, setToast] = useState(null);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadDraft, setLeadDraft] = useState({ name: "", email: "", phone: "", source: "Website", status: "new", stage: "new", score: 50 });
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [notifReads, setNotifReads] = useState({});
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [hoveredListing, setHoveredListing] = useState(null);
  const [draggedLead, setDraggedLead] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [leadsChart, setLeadsChart] = useState([]);

  // Check user auth status and fetch leads
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
      if (!session?.user) {
        setLoading(false);
        return;
      }
      // Fetch leads for this user
      setLeadsLoading(true);
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .limit(100);
      if (!error && data) {
        setLeads(data);
        // Generate chart data
        const stages = ["new", "contacted", "qualified", "showing", "offer", "closed"];
        const chartData = stages.map(s => ({
          stage: s,
          count: data.filter(l => l.stage === s).length,
        }));
        setLeadsChart(chartData);
      }
      setLeadsLoading(false);
      setLoading(false);
    }
    checkAuth();
  }, []);

  // Responsive sidebar
  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setSidebarOpen(true);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const signOut = async () => { await supabase.auth.signOut(); };

  if (loading) return <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: C.textMuted }}><Loader2 size={48} style={{ animation: "spin 1s linear infinite" }} /></div>;

  if (!user) return <Auth />;

  // Status badges and lead stages
  const leadsFiltered = leads.filter(l => {
    const matchesQuery = l.name.toLowerCase().includes(searchQuery.toLowerCase()) || (l.email && l.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesFilter = filter === "all" || l.status === filter;
    return matchesQuery && matchesFilter;
  });

  const submitNewLead = async () => {
    if (!leadDraft.name.trim()) { setToast({ message: "Name is required", kind: "error" }); return; }
    const { data, error } = await supabase.from("leads").insert([{
      name: leadDraft.name,
      email: leadDraft.email || null,
      phone: leadDraft.phone || null,
      source: leadDraft.source,
      status: leadDraft.status,
      stage: leadDraft.stage,
      score: leadDraft.score,
    }]).select();
    if (error) { setToast({ message: "Error creating lead: " + error.message, kind: "error" }); return; }
    setLeads([...leads, ...data]);
    setLeadDraft({ name: "", email: "", phone: "", source: "Website", status: "new", stage: "new", score: 50 });
    setToast({ message: "Lead created!", kind: "success" });
  };

  const markNotifRead = (id) => setNotifReads(prev => ({ ...prev, [id]: true }));

  const formatPrice = (p) => "$" + (p / 1000).toFixed(0) + "K";
  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // ========== VIEWS ==========

  const DashboardView = () => {
    const stats = [
      { label: "Total Leads", value: leadsChart.reduce((s, r) => s + r.count, 0), icon: Users, color: C.teal, change: 12, subtitle: `${leads.filter(l => l.status === "hot").length} hot leads` },
      { label: "This Month", value: AGENTS.reduce((s, a) => s + a.closings, 0), icon: TrendingUp, color: C.blue, change: 8, subtitle: "from all agents" },
      { label: "Revenue", value: "$" + (AGENTS.reduce((s, a) => s + a.revenue, 0) / 1000000).toFixed(1) + "M", icon: DollarSign, color: C.gold, change: -3, subtitle: "gross brokerage fees" },
      { label: "Reports", value: REPORTS.length, icon: FileText, color: C.purple, change: 2 },
    ];
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, marginBottom: 8, fontFamily: SERIF_FONT }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: C.textMuted, marginBottom: 32 }}>Real estate CRM for coastal agents</p>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16, marginBottom: 32 }}>
          {stats.map((s, i) => <StatCard key={i} {...s} isMobile={isMobile} />)}
        </div>
        {/* Leads by stage chart */}
        <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 32 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: C.text }}>Leads by Stage</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leadsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
              <XAxis dataKey="stage" stroke={C.textMuted} />
              <YAxis stroke={C.textMuted} />
              <Tooltip contentStyle={{ background: C.bgCard, border: `1px solid ${C.border}` }} />
              <Bar dataKey="count" fill={C.teal} radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const LeadsView = () => {
    const stageLeads = (stageId) => leadsFiltered.filter(l => l.stage === stageId);
    const stages = [
      { id: "new", label: "New" },
      { id: "contacted", label: "Contacted" },
      { id: "qualified", label: "Qualified" },
      { id: "showing", label: "Showing" },
      { id: "offer", label: "Offer" },
      { id: "closed", label: "Closed" },
    ];
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, marginBottom: 8, fontFamily: SERIF_FONT }}>Leads</h1>
        {/* Search + Add Lead */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: 10, color: C.textMuted }} />
            <input type="text" placeholder="Search leads..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{
              width: "100%", padding: "8px 12px 8px 36px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13,
              background: C.bg, color: C.text, outline: "none"
            }} />
          </div>
          <button onClick={() => setView("add-lead")} style={{
            padding: "8px 16px", background: C.teal, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 6
          }}>
            <Plus size={16} /> Add Lead
          </button>
        </div>

        {/* Kanban */}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(stages.length, isMobile ? 2 : 3)}, 1fr)`, gap: 16 }}>
          {stages.map(s => (
            <div key={s.id} style={{
              background: C.bg, border: `2px solid ${dragOverStage === s.id ? C.teal : C.border}`, borderRadius: 12, padding: 12,
              minHeight: 400, display: "flex", flexDirection: "column",
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOverStage(s.id); }}
            onDragLeave={() => setDragOverStage(prev => prev === s.id ? null : prev)}
            onDrop={async (e) => {
              e.preventDefault();
              const leadId = e.dataTransfer.getData("leadId");
              const { error } = await supabase.from("leads").update({ stage: s.id }).eq("id", leadId);
              if (!error) {
                setLeads(leads.map(l => l.id === leadId ? { ...l, stage: s.id } : l));
              }
              setDragOverStage(null);
            }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>{s.label} ({stageLeads(s.id).length})</h4>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
                {stageLeads(s.id).length === 0 ? <div style={{ fontSize: 12, color: C.textDim, textAlign: "center", padding: "24px 0" }}>No leads</div> : stageLeads(s.id).map(lead => (
                  <div key={lead.id} draggable
                    onDragStart={(e) => { setDraggingId(lead.id); e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("leadId", lead.id); }}
                    onDragEnd={() => { setDraggingId(null); setDragOverStage(null); }}
                    onClick={() => { setSelectedLead(lead); setView("leads"); if (isMobile) setSidebarOpen(false); }}
                    style={{
                      background: C.bgCard, border: `1px solid ${draggingId === lead.id ? C.teal : C.border}`, borderRadius: 8, padding: 12, cursor: "pointer",
                      opacity: draggingId === lead.id ? 0.5 : 1, transition: "all 0.15s"
                    }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.teal; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 6 }}>{lead.name}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 8 }}>{lead.email || "no email"}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <Badge color={lead.status === "hot" ? C.red : C.teal}>{lead.status || "new"}</Badge>
                      {lead.score && <Badge color={C.gold}>{lead.score}pts</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AgentsView = () => {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, marginBottom: 32, fontFamily: SERIF_FONT }}>Agents</h1>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          {AGENTS.map(a => (
            <div key={a.id} onClick={() => setSelectedAgent(a)} style={{
              background: C.bgCard, border: `1px solid ${selectedAgent?.id === a.id ? C.teal : C.border}`, borderRadius: 12, padding: 20, cursor: "pointer",
              transition: "all 0.2s"
            }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.teal; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = selectedAgent?.id === a.id ? C.teal : C.border; }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <Avatar name={a.name} size={40} />
                <Badge color={a.plan === "Enterprise" ? C.purple : a.plan === "Pro" ? C.blue : C.teal}>{a.plan}</Badge>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 }}>{a.name}</h3>
              <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>{a.email}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <StatCard icon={Users} label="Leads" value={a.leads} color={C.teal} />
                <StatCard icon={CheckCheck} label="Closed" value={a.closings} color={C.green} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 12 }}>Status: <span style={{ color: a.status === "active" ? C.green : C.red }}>{a.status}</span></div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const CommunitiesView = () => {
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, marginBottom: 32, fontFamily: SERIF_FONT }}>Communities</h1>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 20 }}>
          {COMMUNITIES.map(c => (
            <div key={c.id} onClick={() => setSelectedCommunity(c)} style={{
              background: C.bgCard, border: `1px solid ${selectedCommunity?.id === c.id ? C.teal : C.border}`, borderRadius: 12, padding: 20, cursor: "pointer",
              transition: "all 0.2s"
            }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.teal; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>{c.icon}</div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 4 }}>{c.name}</h3>
              <p style={{ fontSize: 12, color: C.textMuted, marginBottom: 16 }}>{c.area}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Avg Price</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{formatPrice(c.avgPrice)}</p>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: C.textMuted, marginBottom: 4 }}>Listings</p>
                  <p style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{c.listings}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const AddLeadView = () => {
    const setField = (key, val) => setLeadDraft(prev => ({ ...prev, [key]: val }));
    return (
      <div style={{ flex: 1, overflowY: "auto", padding: isMobile ? 16 : 32 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: C.text, marginBottom: 32, fontFamily: SERIF_FONT }}>Add Lead</h1>
        <div style={{ maxWidth: 500, background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Name *</label>
            <input type="text" value={leadDraft.name} onChange={e => setField("name", e.target.value)} style={{
              width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.bg, color: C.text, outline: "none"
            }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Email</label>
            <input type="email" value={leadDraft.email} onChange={e => setField("email", e.target.value)} style={{
              width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.bg, color: C.text, outline: "none"
            }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Phone</label>
            <input type="tel" value={leadDraft.phone} onChange={e => setField("phone", e.target.value)} style={{
              width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.bg, color: C.text, outline: "none"
            }} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Source</label>
            <select value={leadDraft.source} onChange={e => setField("source", e.target.value)} style={{
              width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.bg, color: C.text, outline: "none"
            }}>
              <option>Website</option>
              <option>Referral</option>
              <option>Phone</option>
              <option>Social Media</option>
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Status</label>
            <select value={leadDraft.status} onChange={e => setField("status", e.target.value)} style={{
              width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 13, background: C.bg, color: C.text, outline: "none"
            }}>
              <option value="new">New</option>
              <option value="nurture">Nurture</option>
              <option value="hot">Hot</option>
            </select>
          </div>
          <button onClick={submitNewLead} style={{
            width: "100%", padding: "12px 16px", background: C.teal, color: "white", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600
          }}>Create Lead</button>
        </div>
        {toast && <div style={{
          position: "fixed", bottom: 16, left: 16, right: 16, padding: "12px 16px", background: toast.kind === "error" ? C.red : C.green, color: "white", borderRadius: 8, fontSize: 13, fontWeight: 600
        }}>{toast.message}</div>}
      </div>
    );
  };

  // ========== MAIN LAYOUT ==========

  return (
    <div style={{ display: "flex", height: "100vh", background: C.bg, fontFamily: "-apple-system, system-ui, sans-serif", color: C.text }}>
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: ${C.bg}; color: ${C.text}; }
      `}</style>

      {/* Sidebar */}
      <div style={{
        width: isMobile && !sidebarOpen ? 0 : isMobile ? "100%" : 240, background: C.bgDark, borderRight: `1px solid ${C.bgDark2}`, color: C.textInv,
        display: "flex", flexDirection: "column", overflow: "hidden", transition: "width 0.3s", zIndex: 100
      }}>
        {isMobile && <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 16 }}>
          <TriskopeLogo size={32} light />
          <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", color: C.textInv, cursor: "pointer", padding: 0 }}>
            <X size={24} />
          </button>
        </div>}
        {!isMobile && <div style={{ padding: 20, borderBottom: `1px solid ${C.bgDark2}`, display: "flex", alignItems: "center", gap: 12 }}>
          <TriskopeLogo size={32} light />
          <h1 style={{ fontSize: 16, fontWeight: 700, letterSpacing: 0.15 }}>triskope</h1>
        </div>}
        <nav style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {[
            { id: "dashboard", label: "Dashboard", icon: Home },
            { id: "leads", label: "Leads", icon: Users },
            { id: "agents", label: "Agents", icon: Award },
            { id: "communities", label: "Communities", icon: MapPin },
            { id: "settings", label: "Settings", icon: Settings },
          ].map(item => (
            <button key={item.id} onClick={() => { setView(item.id); if (isMobile) setSidebarOpen(false); }} style={{
              width: "100%", padding: "12px 16px", marginBottom: 8, background: view === item.id ? `rgba(94, 234, 212, 0.1)` : "transparent",
              border: "none", color: view === item.id ? C.tealBright : C.textInvMuted, cursor: "pointer", textAlign: "left", borderRadius: 8,
              display: "flex", alignItems: "center", gap: 12, fontSize: 14, fontWeight: view === item.id ? 600 : 500, transition: "all 0.15s"
            }}>
              <item.icon size={18} />
              {item.label}
            </button>
          ))}
        </nav>
        <div style={{ borderTop: `1px solid ${C.bgDark2}`, padding: 16 }}>
          <button onClick={signOut} style={{
            width: "100%", padding: "12px 16px", background: `rgba(185, 64, 74, 0.1)`, border: "none", color: C.red, cursor: "pointer", borderRadius: 8,
            display: "flex", alignItems: "center", gap: 12, fontSize: 13, fontWeight: 500
          }}>
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Top bar */}
        <div style={{
          background: C.bgCard, borderBottom: `1px solid ${C.border}`, padding: isMobile ? 12 : 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16
        }}>
          {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ background: "none", border: "none", color: C.text, cursor: "pointer", padding: 0 }}>
            <Menu size={24} />
          </button>}
          <div style={{ flex: 1, maxWidth: 400, display: isMobile ? "none" : "block" }}>
            {/* Reserved for quick search */}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button style={{ background: "none", border: "none", color: C.textMuted, cursor: "pointer", padding: 8 }}>
              <Bell size={20} />
            </button>
            <Avatar name={user?.email || "User"} size={32} />
          </div>
        </div>

        {/* View container */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {view === "dashboard" && <DashboardView />}
          {view === "leads" && <LeadsView />}
          {view === "agents" && <AgentsView />}
          {view === "communities" && <CommunitiesView />}
          {view === "add-lead" && <AddLeadView />}
          {!["dashboard", "leads", "agents", "communities", "add-lead"].includes(view) && <EmptyState title="Coming Soon" message="This view is under development." />}
        </div>
      </div>
    </div>
  );
}
