export interface Asset {
  tag: string; name: string; serial: string; model: string; cat: string;
  status: 'deployed' | 'ready' | 'investigating' | 'archived';
  assignee: string | null; location: string; cost: string; value: string;
  audit: { due: boolean; date: string };
  cf: { tnum: string; star: string; sample: string; sw: string; variant: string; market: string };
  warrantyExpiry?: string;  // ISO date
  eolDate?: string;         // ISO date — end of manufacturer support
  purchaseDate?: string;
}

export interface DUT {
  id: string; name: string; type: string; bed: string;
  status: string; statusLabel: string;
  uptime: number; temp: number; fw: string; owner: string; cal: string;
}

export const ASSETS_INITIAL: Asset[] = [
  {tag:"00197",name:"7413",serial:"0435565",model:"CIVIC",cat:"CIVIC",status:"deployed",assignee:"HWM / Cross-domain",location:"Lab 2 · Rack A",cost:"€1,820",value:"€910",audit:{due:true,date:"2026-06-28"},cf:{tnum:"T-2207",star:"I2",sample:"D21",sw:"none",variant:"Premiumplus",market:"USA"},warrantyExpiry:"2026-08-15",eolDate:"2027-12-31",purchaseDate:"2023-08-15"},
  {tag:"00499",name:"9187",serial:"1019",model:"Umlaut",cat:"Test bench",status:"ready",assignee:null,location:"Lab 2 · Rack B",cost:"€4,500",value:"€3,100",audit:{due:false,date:"2026-09-01"},cf:{tnum:"—",star:"—",sample:"—",sw:"none",variant:"—",market:"—"},warrantyExpiry:"2027-03-01",eolDate:"2030-01-01",purchaseDate:"2024-03-01"},
  {tag:"00500",name:"9197",serial:"1011",model:"Umlaut",cat:"Test bench",status:"ready",assignee:null,location:"Lab 2 · Rack B",cost:"€4,500",value:"€3,050",audit:{due:true,date:"2026-06-30"},cf:{tnum:"—",star:"—",sample:"—",sw:"none",variant:"—",market:"—"}},
  {tag:"00502",name:"8507",serial:"—",model:"Artemis",cat:"General Device",status:"ready",assignee:null,location:"Lab 1 · HiL Bay",cost:"€2,200",value:"€1,400",audit:{due:false,date:"2026-10-12"},cf:{tnum:"—",star:"—",sample:"—",sw:"v2.1",variant:"—",market:"EU"}},
  {tag:"00506",name:"6473",serial:"—",model:"Ramses",cat:"General Device",status:"ready",assignee:null,location:"Lab 1 · HiL Bay",cost:"€2,200",value:"€1,300",audit:{due:false,date:"2026-10-12"},cf:{tnum:"—",star:"—",sample:"—",sw:"v2.1",variant:"—",market:"EU"}},
  {tag:"00510",name:"6",serial:"—",model:"display super screen",cat:"Video Hardware",status:"ready",assignee:null,location:"Storage · Shelf 4",cost:"€980",value:"€640",audit:{due:false,date:"2026-11-20"},cf:{tnum:"—",star:"—",sample:"—",sw:"none",variant:"—",market:"—"}},
  {tag:"00516",name:"9158",serial:"15101",model:"Audio Amplifier MB",cat:"Audio Equipment",status:"ready",assignee:null,location:"Storage · Shelf 4",cost:"€560",value:"€380",audit:{due:false,date:"2026-12-01"},cf:{tnum:"—",star:"—",sample:"—",sw:"none",variant:"—",market:"—"}},
  {tag:"00517",name:"FK: 006",serial:"207163128",model:"Flashing Kit",cat:"Test Hardware",status:"deployed",assignee:"HWM / Cross-domain",location:"Lab 2 · Rack A",cost:"€3,400",value:"€2,600",audit:{due:false,date:"2026-08-15"},cf:{tnum:"T-5106",star:"I1",sample:"—",sw:"v3.1.2",variant:"—",market:"USA"}},
  {tag:"00518",name:"FK: 007",serial:"207163127",model:"Flashing Kit",cat:"Test Hardware",status:"deployed",assignee:"HWM / Cross-domain",location:"Lab 2 · Rack A",cost:"€3,400",value:"€2,600",audit:{due:false,date:"2026-08-15"},cf:{tnum:"T-5107",star:"I1",sample:"—",sw:"v3.1.2",variant:"—",market:"USA"}},
  {tag:"00522",name:"7964",serial:"0770969",model:"CIVIC",cat:"CIVIC",status:"deployed",assignee:"Driving Functions",location:"Lab 1 · HiL Bay",cost:"€1,820",value:"€880",audit:{due:false,date:"2026-09-30"},cf:{tnum:"T-2310",star:"I2",sample:"D19",sw:"none",variant:"Base",market:"USA"}},
  {tag:"00524",name:"—",serial:"0001038",model:"Audio Amplifier MB",cat:"Audio Equipment",status:"deployed",assignee:"Driving Functions",location:"Lab 1 · HiL Bay",cost:"€560",value:"€360",audit:{due:false,date:"2026-12-01"},cf:{tnum:"—",star:"—",sample:"—",sw:"none",variant:"—",market:"—"}},
  {tag:"00527",name:"—",serial:"0027118",model:"CIVIC",cat:"CIVIC",status:"deployed",assignee:"Vehicle Abstraction",location:"Lab 1 · HiL Bay",cost:"€1,820",value:"€900",audit:{due:false,date:"2026-09-30"},cf:{tnum:"T-2415",star:"I2",sample:"D21",sw:"none",variant:"Premiumplus",market:"CHN"}},
  {tag:"00095",name:"7208",serial:"0410233",model:"CIVIC",cat:"CIVIC",status:"investigating",assignee:null,location:"Lab 2 · Rack C",cost:"€1,820",value:"€820",audit:{due:true,date:"2026-06-26"},cf:{tnum:"T-2118",star:"I1",sample:"D17",sw:"none",variant:"Base",market:"USA"},warrantyExpiry:"2026-07-01",eolDate:"2026-12-31",purchaseDate:"2021-07-01"},
  {tag:"00478",name:"8977",serial:"—",model:"AV.io 4K",cat:"Video Hardware",status:"ready",assignee:null,location:"Storage · Shelf 4",cost:"€420",value:"€300",audit:{due:false,date:"2026-11-01"},cf:{tnum:"—",star:"—",sample:"—",sw:"none",variant:"—",market:"—"}},
  {tag:"00240",name:"FK: 004",serial:"207163099",model:"Flashing Kit",cat:"Test Hardware",status:"ready",assignee:null,location:"Lab 2 · Rack A",cost:"€3,400",value:"€2,700",audit:{due:false,date:"2026-08-15"},cf:{tnum:"T-5104",star:"I1",sample:"—",sw:"v3.1.2",variant:"—",market:"USA"}},
  {tag:"00466",name:"8984",serial:"—",model:"Video Converter TZ",cat:"Video Hardware",status:"archived",assignee:null,location:"Storage · Shelf 4",cost:"€210",value:"€0",audit:{due:false,date:"—"},cf:{tnum:"—",star:"—",sample:"—",sw:"none",variant:"—",market:"—"}},
];

export const DATA = {
  models: [
    {name:"Umlaut",no:"—",cat:"Test bench",assets:24,assigned:3,remaining:21},
    {name:"Areus",no:"—",cat:"Test bench",assets:0,assigned:0,remaining:0},
    {name:"Flashing Kit",no:"—",cat:"Test Hardware",assets:13,assigned:12,remaining:1},
    {name:"Debugboard",no:"—",cat:"Test Hardware",assets:0,assigned:0,remaining:0},
    {name:"Artemis",no:"—",cat:"General Device",assets:8,assigned:2,remaining:6},
    {name:"Ramses",no:"—",cat:"General Device",assets:6,assigned:1,remaining:5},
    {name:"display super screen",no:"—",cat:"Video Hardware",assets:5,assigned:2,remaining:3},
    {name:"Audio Amplifier MB",no:"—",cat:"Audio Equipment",assets:6,assigned:3,remaining:3},
    {name:"CIVIC",no:"—",cat:"CIVIC",assets:132,assigned:110,remaining:22},
    {name:"iPhone 15 pro",no:"A1688",cat:"Smartphone",assets:0,assigned:0,remaining:0},
  ],
  categories: [
    {name:"Test bench",type:"Asset",qty:88,accept:false},
    {name:"Test Hardware",type:"Asset",qty:45,accept:true},
    {name:"Video Hardware",type:"Asset",qty:52,accept:false},
    {name:"Audio Equipment",type:"Asset",qty:10,accept:false},
    {name:"PC / Workstation",type:"Asset",qty:64,accept:true},
    {name:"Network / Interface Hardware",type:"Asset",qty:72,accept:false},
    {name:"CIVIC",type:"Asset",qty:132,accept:false},
    {name:"General Device",type:"Asset",qty:27,accept:false},
    {name:"Phone",type:"Asset",qty:19,accept:false},
    {name:"Smartphone",type:"Asset",qty:0,accept:false},
  ],
  assignees: {
    teams: ["HWM / Cross-domain","Driving Functions","Vehicle Abstraction","Infotainment / IVI"],
    people: ["A. Kovalenko","S. Marek","L. Wójcik","K. Nowak","P. Bakun","W. Pikulski"],
  },
  locations: ["Lab 2 · Rack A","Lab 2 · Rack B","Lab 2 · Rack C","Lab 1 · HiL Bay","Storage · Shelf 4"],
  kpis: [
    {lab:"Bench Availability",val:"97.4",unit:"%",delta:"+1.2% vs last month",dir:"up",sub:"test benches Up right now"},
    {lab:"Bed Utilization",val:"73",unit:"%",delta:"+5% vs last month",dir:"up",sub:"test beds in active campaigns"},
    {lab:"Active Campaigns",val:"8",unit:"/12",delta:"4 queued",dir:"flat",sub:"running · 4 scheduled"},
    {lab:"DUTs Online",val:"41",unit:"/48",delta:"7 offline / maint.",dir:"down",sub:"devices connected & reachable"},
  ],
  beds: [
    {id:"TB-01",load:94,status:"high"},{id:"TB-02",load:88,status:"high"},{id:"TB-03",load:61,status:"mid"},
    {id:"TB-04",load:0,status:"error",label:"ERR"},{id:"TB-05",load:91,status:"high"},{id:"TB-06",load:70,status:"mid"},
    {id:"TB-07",load:28,status:"low"},{id:"TB-08",load:85,status:"high"},{id:"TB-09",load:0,status:"maint",label:"MAINT"},
    {id:"TB-10",load:55,status:"mid"},{id:"TB-11",load:92,status:"high"},{id:"TB-12",load:12,status:"low"},
  ],
  activeCampaigns: [
    {nm:"CAN-Stack Regression v2.4",beds:"TB-01,02",pct:78,dot:"ok"},
    {nm:"OTA Firmware Update Suite",beds:"TB-05,06",pct:45,dot:"mid"},
    {nm:"ECU Boot Stress Test",beds:"TB-08",pct:91,dot:"brand"},
    {nm:"HW-in-loop Validation Q2",beds:"TB-11",pct:33,dot:"warn"},
    {nm:"Power Cycle Endurance",beds:"TB-03",pct:62,dot:"ok"},
  ],
  phases: [
    {nm:"Smoke",pct:20,c:"var(--low)"},{nm:"Regression",pct:58,c:"var(--brand)"},
    {nm:"Unit",pct:65,c:"var(--ok)"},{nm:"Integration",pct:86,c:"var(--mid)"},
    {nm:"System",pct:71,c:"var(--warn)"},{nm:"Endurance",pct:44,c:"var(--accent)"},
  ],
  events: [
    {dot:"warn",ttl:"TB-09 maintenance — campaign delayed",when:"6m"},
    {dot:"bad",ttl:"TB-04 CPU temp 89°C — threshold exceeded",when:"14m"},
    {dot:"mid",ttl:"Firmware v3.1.2 deployed to DUT-14,15",when:"38m"},
    {dot:"ok",ttl:'Campaign "CAN-Stack" milestone — 75%',when:"1h"},
    {dot:"mid",ttl:"DUT-22 booked by K. Nowak (17 Jun)",when:"2h"},
  ],
  aiInsights: [
    {l:"TB-07, TB-12",r:"underutilized",c:"var(--warn)"},
    {l:"TB-01, TB-02",r:"near capacity",c:"var(--bad)"},
    {l:"Utilization forecast (30d)",r:"↑ 78%",c:"var(--ok)"},
    {l:"Overload risk",r:"TB-05 (+14d)",c:"var(--bad)"},
  ],
  duts: [
    {id:"DUT-04",name:"ECU-A2 Boot Controller",type:"Device under test",bed:"TB-04",status:"bad",statusLabel:"Error",uptime:84.3,temp:89,fw:"v3.1.0",owner:"S. Marek",cal:"2026-09-02"},
    {id:"DUT-14",name:"CAN Gateway Node",type:"Device under test",bed:"TB-01",status:"ok",statusLabel:"Online",uptime:99.2,temp:44,fw:"v3.1.2",owner:"L. Wójcik",cal:"2026-11-20"},
    {id:"DUT-15",name:"CAN Gateway Node",type:"Device under test",bed:"TB-02",status:"ok",statusLabel:"Online",uptime:98.7,temp:46,fw:"v3.1.2",owner:"L. Wójcik",cal:"2026-11-20"},
    {id:"DUT-22",name:"HiL Simulator Rack",type:"HiL simulator",bed:"TB-11",status:"ok",statusLabel:"Online",uptime:96.4,temp:51,fw:"v7.2.1",owner:"K. Nowak",cal:"2026-08-11"},
    {id:"DUT-31",name:"Vector VN1640A",type:"CAN/LIN interface",bed:"TB-03",status:"warn",statusLabel:"Calibrate",uptime:99.1,temp:42,fw:"v4.9.0",owner:"S. Marek",cal:"2026-06-18"},
    {id:"DUT-37",name:"OTA Flash Bench",type:"Test bench host",bed:"TB-05",status:"ok",statusLabel:"Online",uptime:99.5,temp:40,fw:"v3.1.2",owner:"A. Kovalenko",cal:"—"},
    {id:"DUT-40",name:"Power Cycle Rig",type:"Lab resource",bed:"TB-03",status:"warn",statusLabel:"Calibrate",uptime:99.0,temp:35,fw:"v2.0.4",owner:"System",cal:"2026-06-20"},
    {id:"DUT-42",name:"BMS Master Pack",type:"Device under test",bed:"TB-08",status:"ok",statusLabel:"Online",uptime:88.6,temp:48,fw:"v3.1.2",owner:"K. Nowak",cal:"2026-07-30"},
    {id:"DUT-45",name:"dSPACE SCALEXIO #2",type:"HiL simulator",bed:"TB-10",status:"bad",statusLabel:"Degraded",uptime:84.9,temp:71,fw:"v7.2.1",owner:"A. Kovalenko",cal:"2026-09-02"},
    {id:"DUT-48",name:"CANoe Bench Host #1",type:"Test bench host",bed:"TB-06",status:"ok",statusLabel:"Online",uptime:99.6,temp:39,fw:"v16.0",owner:"A. Kovalenko",cal:"—"},
  ] as DUT[],
  campaigns: {
    planned: [
      {id:"CMP-220",title:"Thermal Endurance Q3",owner:"KN",beds:1,duts:4,due:"Starts Jun 22",integ:"Jenkins",prog:0,risk:false},
      {id:"CMP-221",title:"ADAS Sensor Fusion v1",owner:"AK",beds:2,duts:6,due:"Queued · waiting TB-09",integ:"Polarion",prog:0,risk:true},
    ],
    progress: [
      {id:"CMP-201",title:"CAN-Stack Regression v2.4",owner:"LW",beds:2,duts:6,due:"Due Jun 18",integ:"Jira",prog:78,risk:false},
      {id:"CMP-205",title:"OTA Firmware Update Suite",owner:"AK",beds:2,duts:8,due:"Due Jun 20",integ:"GitLab CI",prog:45,risk:false},
      {id:"CMP-208",title:"ECU Boot Stress Test",owner:"SM",beds:1,duts:5,due:"Due Jun 19",integ:"TestRail",prog:91,risk:false},
      {id:"CMP-210",title:"HW-in-loop Validation Q2",owner:"KN",beds:1,duts:4,due:"Due Jun 24",integ:"Jenkins",prog:33,risk:false},
      {id:"CMP-212",title:"Power Cycle Endurance",owner:"SM",beds:1,duts:6,due:"Due Jun 21",integ:"Jira",prog:62,risk:false},
    ],
    completed: [{id:"CMP-197",title:"CAN Gateway Smoke v2.3",owner:"SM",beds:1,duts:6,due:"Done Jun 12",integ:"Jenkins",prog:100,risk:false}],
    report: [{id:"CMP-190",title:"Power Cycle Endurance — May",owner:"AK",beds:2,duts:7,due:"Report ready",integ:"Jira",prog:100,risk:false}],
  },
  fte: {value:81.2},
  recs: [
    {kind:"invest",title:"Add one HiL bed to relieve TB-01 / TB-05",desc:"Integration phase runs at 86% and CAN-Stack + ECU Boot are queued behind it. One more HiL bed clears the recurring queue without delaying campaigns.",impact:[["Throughput","+14%"],["Payback","~4 mo"]] as [string,string][]},
    {kind:"cut",title:"Reclaim TB-07 and TB-12 — underutilized",desc:"Both beds have averaged under 30% for 6 weeks. Reallocating load from TB-05 onto TB-07 reduces overload risk and frees a license seat.",impact:[["Savings","€1.8k/mo"],["Risk","Low"]] as [string,string][]},
    {kind:"risk",title:"Service the TB-04 ECU node before Jun 22",desc:"CPU temperature breached 89°C with 2 unexpected restarts in 14 days — the same signature seen before the dSPACE #2 fault last quarter.",impact:[["Failure prob.","78% / 14d"],["Beds affected","TB-04"]] as [string,string][]},
  ],
  forecast: {hist:[68,70,69,71,72,72.5,73,73],fc:[73,74.8,76.4,77.2,78]},
  reports: [
    {name:"Weekly operations digest",period:"Jun 8–14, 2026",owner:"Auto · Mondays 07:00",fmt:["PDF","XLSX"]},
    {name:"Monthly management report",period:"May 2026",owner:"Auto · 1st of month",fmt:["PDF","PPTX"]},
    {name:"Cost per campaign — Q2",period:"Apr–Jun 2026",owner:"A. Kovalenko",fmt:["XLSX"]},
    {name:"DUT utilization & lifecycle",period:"Rolling 90 days",owner:"Auto · weekly",fmt:["PDF","XLSX"]},
  ],
  costs: [
    {cc:"ADAS Platform",cost:"€48,200",pct:31},{cc:"Powertrain & BMS",cost:"€39,600",pct:25},
    {cc:"Connectivity / CAN",cost:"€27,300",pct:18},{cc:"Infotainment / OTA",cost:"€24,900",pct:16},
    {cc:"Shared / overhead",cost:"€15,400",pct:10},
  ],
  auditLog: [
    {who:"K. Nowak",role:"Tester",act:"Booked DUT-22 to CMP-210 (17 Jun)",when:"Today 09:42"},
    {who:"S. Marek",role:"Tester",act:"Triggered remote reset on TB-04 node",when:"Today 09:18"},
    {who:"System",role:"Edge",act:"Firmware v3.1.2 pushed to DUT-14, DUT-15",when:"Today 07:55"},
    {who:"L. Wójcik",role:"Tester",act:"Created campaign CMP-201",when:"Yesterday 16:30"},
    {who:"A. Kovalenko",role:"Test Manager",act:"Changed S. Marek role → Tester",when:"Yesterday 11:02"},
  ],
  roles: [
    {name:"Admin",who:1,desc:"Full control — settings, integrations, users, billing"},
    {name:"Test Manager",who:2,desc:"Campaigns, bookings, reports, edge control"},
    {name:"Tester",who:5,desc:"Run assigned campaigns, edge control on booked DUTs"},
    {name:"Read-only",who:8,desc:"Dashboards and reports — no changes"},
  ],
  future: [
    {t:"Load Balancing",d:"Automatic test-bed assignment with campaign queuing and prioritization — keep every bed productive without manual juggling."},
    {t:"Campaign Simulation",d:"Estimate duration, cost, and the minimum vs optimal resource count before a campaign is ever scheduled."},
    {t:"Test Feasibility Analysis",d:"Verify a campaign can run on available equipment, flag missing components (e.g. CANoe modules), and estimate completion time."},
    {t:"Digital Twin Farm",d:"A virtual representation of the physical farm for what-if planning, capacity simulation, and onboarding."},
  ],
};

export const NL_QUERIES: Record<string, {summary: string; filterDuts?: boolean}> = {
  "show DUTs with uptime < 90% this quarter": {
    summary: "Found <b>3 devices</b> below the 90% uptime threshold this quarter. The <b>TB-04 ECU node</b> is the worst and is also flagged for predicted failure — recommend pulling it before the ECU Boot Stress deadline.",
    filterDuts: true,
  },
  "which campaigns are at risk this week": {
    summary: "<b>1 campaign</b> is at risk: <b>ADAS Sensor Fusion v1 (CMP-221)</b> is queued behind <b>TB-09 maintenance</b> and will slip unless the bed returns a day early. CAN-Stack Regression is on track at 78%.",
  },
  "where should i cut cost": {
    summary: '<b>TB-07</b> and <b>TB-12</b> have averaged under 30% utilization for 6 weeks. Reallocating load from the overloaded TB-05 onto TB-07 reduces overload risk and frees roughly <b>€1,800/month</b>.',
  },
  "forecast utilization for next month": {
    summary: "Utilization is forecast to rise from <b>73%</b> to <b>78%</b> over the next 30 days (±2pt), assuming current campaign load and no hardware changes. Adding one HiL bed would lift the ceiling another ~14%.",
  },
};

export const STATUS_MAP: Record<string, {c: string; l: string}> = {
  ready: {c:"ok", l:"Ready to Deploy"},
  deployed: {c:"brand", l:"Deployed"},
  investigating: {c:"warn", l:"Investigating"},
  archived: {c:"mute", l:"Archived"},
};

export interface BenchAsset {
  assetTag: string;
  role: string;
  where: string;
  isPrimaryDUT: boolean;
  state: 'active' | 'idle' | 'fault';
}

export interface TestBench {
  id: string;
  name: string;
  description: string;
  owner: string;
  createdAt: string;
  location: string;
  hosts: { hostId: string; platform: 'RichOS' | 'Windows'; rdpLink?: string }[];
  status: 'Up' | 'Down' | 'Degraded' | 'Maintenance';
  richosState: string;
  lastChange: string;
  lastPingValue: number;
  recentDown: boolean;
  build?: {
    distro: string; distroVersion: string; buildTrack: string;
    imageBasename: string; machine: string; buildNumber: string;
    buildUrl: string; gitCommit: string;
  };
  composition: BenchAsset[];
  telemetry: {
    cpuPct: number; memPct: number; diskPct: number;
    memUsedGb: number; memTotalGb: number; memAvailGb: number;
    collectorUp: boolean; lastSeen?: string;
  };
  dfTable: { fs: string; size: string; used: string; avail: string; usePct: number; mount: string }[];
  coredumps: { name: string; timestamp: string; size: string }[];
}

export const BENCHES_INITIAL: TestBench[] = [
  {
    id: "TB-178", name: "CAN-Stack Regression", description: "Primary CAN-Stack regression bench for cross-domain validation. Runs nightly smoke and weekly full regression campaigns.", owner: "A. Kovalenko", createdAt: "2025-03-12", location: "Lab 2 Rack A",
    hosts: [{ hostId: "x178", platform: "RichOS" }, { hostId: "x231", platform: "Windows", rdpLink: "rdp://x231.lab.local" }],
    status: "Up", richosState: "running", lastChange: "2026-06-18 08:14", lastPingValue: 36.6, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "release", imageBasename: "apricot-image-ui", machine: "binz", buildNumber: "4821", buildUrl: "https://ci.internal/builds/4821", gitCommit: "a3f8c12" },
    composition: [
      { assetTag: "00197", role: "Primary DUT", where: "Rack A · Slot 1", isPrimaryDUT: true, state: "active" },
      { assetTag: "00517", role: "Flash Station", where: "Rack A · USB-A port 1", isPrimaryDUT: false, state: "active" },
      { assetTag: "00516", role: "Audio Monitor", where: "Rack A · AUX in", isPrimaryDUT: false, state: "idle" },
    ],
    telemetry: { cpuPct: 42, memPct: 61, diskPct: 45, memUsedGb: 8.2, memTotalGb: 14, memAvailGb: 5.8, collectorUp: true },
    dfTable: [
      { fs: "/dev/root", size: "14G", used: "6.3G", avail: "7.7G", usePct: 45, mount: "/" },
      { fs: "/dev/mmcblk0p1", size: "256M", used: "52M", avail: "204M", usePct: 21, mount: "/boot" },
      { fs: "tmpfs", size: "7.0G", used: "1.2G", avail: "5.8G", usePct: 18, mount: "/run/user" },
    ],
    coredumps: [],
  },
  {
    id: "TB-146", name: "Boot Stress Test", description: "Dedicated boot cycle stress testing — runs continuous boot/shutdown sequences to detect firmware regressions.", owner: "S. Marek", createdAt: "2025-01-20", location: "Lab 2 Rack B",
    hosts: [{ hostId: "x146", platform: "RichOS" }],
    status: "Down", richosState: "unreachable", lastChange: "2026-06-18 04:12", lastPingValue: 4320, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.1.8", buildTrack: "release", imageBasename: "apricot-image-ui", machine: "binz", buildNumber: "4780", buildUrl: "https://ci.internal/builds/4780", gitCommit: "c7d2e45" },
    composition: [
      { assetTag: "00095", role: "Boot Test DUT", where: "Rack B · Slot 1", isPrimaryDUT: true, state: "fault" },
      { assetTag: "00499", role: "Measurement Host", where: "Rack B · Slot 2", isPrimaryDUT: false, state: "idle" },
    ],
    telemetry: { cpuPct: 0, memPct: 0, diskPct: 99, memUsedGb: 0, memTotalGb: 14, memAvailGb: 0, collectorUp: false, lastSeen: "4h 12m ago" },
    dfTable: [
      { fs: "/dev/root", size: "14G", used: "13.9G", avail: "0", usePct: 99, mount: "/" },
      { fs: "/dev/mmcblk0p1", size: "256M", used: "234M", avail: "22M", usePct: 92, mount: "/boot" },
    ],
    coredumps: [
      { name: "trigger_ECU_COREDUMP_20260618_0412", timestamp: "2026-06-18 04:12:09", size: "2.3 MB" },
      { name: "trigger_NET_COREDUMP_20260617_2358", timestamp: "2026-06-17 23:58:44", size: "1.1 MB" },
    ],
  },
  {
    id: "TB-205", name: "OTA Update Validation", description: "Over-the-air firmware update validation bench — validates OTA packages across all supported hardware variants.", owner: "L. Wójcik", createdAt: "2025-06-08", location: "Lab 1 HiL Bay",
    hosts: [{ hostId: "x205", platform: "RichOS" }],
    status: "Up", richosState: "running", lastChange: "2026-06-17 14:30", lastPingValue: 12, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "nightly", imageBasename: "apricot-image-ota", machine: "binz", buildNumber: "4820", buildUrl: "https://ci.internal/builds/4820", gitCommit: "f1b3c99" },
    composition: [
      { assetTag: "00522", role: "Primary DUT", where: "HiL Bay · Slot 3", isPrimaryDUT: true, state: "active" },
      { assetTag: "00240", role: "Flash Station", where: "HiL Bay · USB-A port 2", isPrimaryDUT: false, state: "active" },
    ],
    telemetry: { cpuPct: 28, memPct: 44, diskPct: 31, memUsedGb: 6.2, memTotalGb: 14, memAvailGb: 7.8, collectorUp: true },
    dfTable: [
      { fs: "/dev/root", size: "14G", used: "4.3G", avail: "9.7G", usePct: 31, mount: "/" },
      { fs: "/dev/mmcblk0p1", size: "256M", used: "48M", avail: "208M", usePct: 19, mount: "/boot" },
      { fs: "tmpfs", size: "7.0G", used: "0.8G", avail: "6.2G", usePct: 12, mount: "/run/user" },
    ],
    coredumps: [],
  },
  {
    id: "TB-112", name: "Power Cycle Endurance", description: "Long-running power cycle endurance bench for detecting wear-related failures across power on/off sequences.", owner: "K. Nowak", createdAt: "2024-11-15", location: "Lab 2 Rack C",
    hosts: [{ hostId: "x112", platform: "RichOS" }, { hostId: "x232", platform: "Windows", rdpLink: "rdp://x232.lab.local" }],
    status: "Degraded", richosState: "degraded", lastChange: "2026-06-18 06:44", lastPingValue: 18, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.0", buildTrack: "release", imageBasename: "apricot-image-ui", machine: "binz", buildNumber: "4795", buildUrl: "https://ci.internal/builds/4795", gitCommit: "b8e1f34" },
    composition: [
      { assetTag: "00527", role: "Primary DUT", where: "Rack C · Slot 1", isPrimaryDUT: true, state: "active" },
      { assetTag: "00518", role: "Flash Station", where: "Rack C · USB-A port 1", isPrimaryDUT: false, state: "active" },
    ],
    telemetry: { cpuPct: 89, memPct: 78, diskPct: 67, memUsedGb: 10.9, memTotalGb: 14, memAvailGb: 3.1, collectorUp: true },
    dfTable: [
      { fs: "/dev/root", size: "14G", used: "9.4G", avail: "4.6G", usePct: 67, mount: "/" },
      { fs: "/dev/mmcblk0p1", size: "256M", used: "88M", avail: "168M", usePct: 35, mount: "/boot" },
      { fs: "tmpfs", size: "7.0G", used: "2.9G", avail: "4.1G", usePct: 42, mount: "/run/user" },
    ],
    coredumps: [],
  },
  {
    id: "TB-093", name: "Infotainment IVI", description: "Infotainment and IVI system integration bench — screen, audio, and connectivity validation.", owner: "A. Kovalenko", createdAt: "2025-02-18", location: "Lab 1 HiL Bay",
    hosts: [{ hostId: "x093", platform: "RichOS" }],
    status: "Maintenance", richosState: "maintenance", lastChange: "2026-06-16 09:00", lastPingValue: 0, recentDown: false,
    build: undefined,
    composition: [
      { assetTag: "00524", role: "Primary DUT", where: "HiL Bay · Slot 5", isPrimaryDUT: true, state: "idle" },
      { assetTag: "00510", role: "Display Monitor", where: "HiL Bay · Display rack", isPrimaryDUT: false, state: "idle" },
    ],
    telemetry: { cpuPct: 0, memPct: 0, diskPct: 0, memUsedGb: 0, memTotalGb: 14, memAvailGb: 14, collectorUp: false, lastSeen: "2d 14h ago" },
    dfTable: [
      { fs: "/dev/root", size: "14G", used: "5.1G", avail: "8.9G", usePct: 37, mount: "/" },
    ],
    coredumps: [],
  },
  {
    id: "TB-047", name: "HiL Validation", description: "Hardware-in-the-loop validation bench with dSPACE integration for closed-loop ECU testing.", owner: "K. Nowak", createdAt: "2024-09-04", location: "Lab 1 HiL Bay",
    hosts: [{ hostId: "x047", platform: "RichOS" }],
    status: "Up", richosState: "running", lastChange: "2026-06-18 07:02", lastPingValue: 8, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "release", imageBasename: "apricot-image-hil", machine: "binz", buildNumber: "4821", buildUrl: "https://ci.internal/builds/4821", gitCommit: "a3f8c12" },
    composition: [
      { assetTag: "00506", role: "Primary DUT", where: "HiL Bay · Slot 2", isPrimaryDUT: true, state: "active" },
    ],
    telemetry: { cpuPct: 55, memPct: 52, diskPct: 28, memUsedGb: 7.3, memTotalGb: 14, memAvailGb: 6.7, collectorUp: true },
    dfTable: [
      { fs: "/dev/root", size: "14G", used: "3.9G", avail: "10.1G", usePct: 28, mount: "/" },
      { fs: "/dev/mmcblk0p1", size: "256M", used: "61M", avail: "195M", usePct: 24, mount: "/boot" },
      { fs: "tmpfs", size: "7.0G", used: "1.4G", avail: "5.6G", usePct: 21, mount: "/run/user" },
    ],
    coredumps: [],
  },
  {
    id: "TB-156", name: "Audio Stack", description: "Audio subsystem integration and regression bench — speaker arrays, amplifier chains, and codec validation.", owner: "S. Marek", createdAt: "2025-04-22", location: "Lab 2 Rack B",
    hosts: [{ hostId: "x156", platform: "RichOS" }],
    status: "Down", richosState: "unreachable", lastChange: "2026-06-18 07:13", lastPingValue: 3847, recentDown: true,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "nightly", imageBasename: "apricot-image-audio", machine: "binz", buildNumber: "4818", buildUrl: "https://ci.internal/builds/4818", gitCommit: "d9f0a77" },
    composition: [
      { assetTag: "00516", role: "Audio Monitor", where: "Rack B · AUX in", isPrimaryDUT: false, state: "fault" },
    ],
    telemetry: { cpuPct: 0, memPct: 0, diskPct: 0, memUsedGb: 0, memTotalGb: 14, memAvailGb: 14, collectorUp: false, lastSeen: "47m ago" },
    dfTable: [
      { fs: "/dev/root", size: "14G", used: "4.8G", avail: "9.2G", usePct: 34, mount: "/" },
    ],
    coredumps: [],
  },
  {
    id: "TB-199", name: "ECU Boot Controller", description: "ECU boot sequence validation bench with power sequencing control and reset injection capabilities.", owner: "L. Wójcik", createdAt: "2025-07-14", location: "Lab 2 Rack A",
    hosts: [{ hostId: "x199", platform: "RichOS" }],
    status: "Up", richosState: "running", lastChange: "2026-06-17 22:10", lastPingValue: 22, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "release", imageBasename: "apricot-image-ecu", machine: "binz", buildNumber: "4821", buildUrl: "https://ci.internal/builds/4821", gitCommit: "a3f8c12" },
    composition: [
      { assetTag: "00502", role: "Primary DUT", where: "Rack A · Slot 3", isPrimaryDUT: true, state: "active" },
    ],
    telemetry: { cpuPct: 31, memPct: 38, diskPct: 19, memUsedGb: 5.3, memTotalGb: 14, memAvailGb: 8.7, collectorUp: true },
    dfTable: [
      { fs: "/dev/root", size: "14G", used: "2.7G", avail: "11.3G", usePct: 19, mount: "/" },
      { fs: "/dev/mmcblk0p1", size: "256M", used: "44M", avail: "212M", usePct: 17, mount: "/boot" },
    ],
    coredumps: [],
  },
  {
    id: "TB-084", name: "CAN Gateway", description: "CAN gateway and protocol bridge validation — full CAN/CAN-FD matrix with fault injection.", owner: "S. Marek", createdAt: "2024-12-01", location: "Lab 2 Rack C",
    hosts: [{ hostId: "x084", platform: "RichOS" }],
    status: "Degraded", richosState: "degraded", lastChange: "2026-06-18 05:55", lastPingValue: 14, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.0", buildTrack: "release", imageBasename: "apricot-image-can", machine: "binz", buildNumber: "4800", buildUrl: "https://ci.internal/builds/4800", gitCommit: "e2c4d81" },
    composition: [
      { assetTag: "00478", role: "Video Capture", where: "Rack C · Capture card slot", isPrimaryDUT: false, state: "idle" },
    ],
    telemetry: { cpuPct: 74, memPct: 82, diskPct: 58, memUsedGb: 11.5, memTotalGb: 14, memAvailGb: 2.5, collectorUp: true },
    dfTable: [
      { fs: "/dev/root", size: "14G", used: "8.1G", avail: "5.9G", usePct: 58, mount: "/" },
      { fs: "/dev/mmcblk0p1", size: "256M", used: "79M", avail: "177M", usePct: 31, mount: "/boot" },
    ],
    coredumps: [],
  },
  {
    id: "TB-231", name: "Automation Worker", description: "Windows-based test automation worker for executing CANoe scripts and PyTest suites via Jenkins CI.", owner: "A. Kovalenko", createdAt: "2025-09-03", location: "Lab 2 Rack A",
    hosts: [{ hostId: "x231", platform: "Windows", rdpLink: "rdp://x231.lab.local" }],
    status: "Up", richosState: "n/a", lastChange: "2026-06-18 07:58", lastPingValue: 5, recentDown: false,
    build: undefined,
    composition: [
      { assetTag: "00466", role: "Legacy Converter", where: "Rack A · USB-B port", isPrimaryDUT: false, state: "idle" },
    ],
    telemetry: { cpuPct: 23, memPct: 45, diskPct: 55, memUsedGb: 14.4, memTotalGb: 32, memAvailGb: 17.6, collectorUp: true },
    dfTable: [
      { fs: "C:\\", size: "500G", used: "275G", avail: "225G", usePct: 55, mount: "C:\\" },
      { fs: "D:\\", size: "2.0T", used: "1.1T", avail: "0.9T", usePct: 55, mount: "D:\\data" },
    ],
    coredumps: [],
  },
  {
    id: "TB-067", name: "Vector Interface", description: "Vector network interface validation bench — VN1640A, VH6501 and CANalyzer integration testing.", owner: "K. Nowak", createdAt: "2025-01-07", location: "Lab 1 HiL Bay",
    hosts: [{ hostId: "x067", platform: "RichOS" }],
    status: "Up", richosState: "running", lastChange: "2026-06-17 19:45", lastPingValue: 41, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "release", imageBasename: "apricot-image-vec", machine: "binz", buildNumber: "4821", buildUrl: "https://ci.internal/builds/4821", gitCommit: "a3f8c12" },
    composition: [
      { assetTag: "00500", role: "Measurement DUT", where: "HiL Bay · Slot 1", isPrimaryDUT: true, state: "active" },
    ],
    telemetry: { cpuPct: 18, memPct: 29, diskPct: 22, memUsedGb: 4.1, memTotalGb: 14, memAvailGb: 9.9, collectorUp: true },
    dfTable: [
      { fs: "/dev/root", size: "14G", used: "3.1G", avail: "10.9G", usePct: 22, mount: "/" },
      { fs: "/dev/mmcblk0p1", size: "256M", used: "39M", avail: "217M", usePct: 15, mount: "/boot" },
    ],
    coredumps: [],
  },
  {
    id: "TB-033", name: "Thermal Endurance", description: "Thermal stress and endurance bench — temperature cycling, thermal shock, and sustained high-load testing.", owner: "A. Kovalenko", createdAt: "2024-08-19", location: "Lab 2 Rack C",
    hosts: [{ hostId: "x033", platform: "RichOS" }],
    status: "Maintenance", richosState: "maintenance", lastChange: "2026-06-15 11:30", lastPingValue: 0, recentDown: false,
    build: undefined,
    composition: [
      { assetTag: "00522", role: "Thermal DUT", where: "Rack C · Thermal chamber", isPrimaryDUT: true, state: "idle" },
    ],
    telemetry: { cpuPct: 0, memPct: 0, diskPct: 0, memUsedGb: 0, memTotalGb: 14, memAvailGb: 14, collectorUp: false, lastSeen: "3d 2h ago" },
    dfTable: [
      { fs: "/dev/root", size: "14G", used: "4.2G", avail: "9.8G", usePct: 30, mount: "/" },
    ],
    coredumps: [],
  },
  {
    id: "TB-014", name: "Diagnostics UDS", description: "UDS/OBD-II diagnostics stack validation bench — full DTC coverage, session management and security access flows.", owner: "L. Wójcik", createdAt: "2025-05-10", location: "Lab 2 Rack B",
    hosts: [{ hostId: "x014", platform: "RichOS" }],
    status: "Up", richosState: "running", lastChange: "2026-06-18 06:30", lastPingValue: 11, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "release", imageBasename: "apricot-image-diag", machine: "binz", buildNumber: "4821", buildUrl: "https://ci.internal/builds/4821", gitCommit: "a3f8c12" },
    composition: [{ assetTag: "00502", role: "Primary DUT", where: "Rack B · Slot 3", isPrimaryDUT: true, state: "active" }],
    telemetry: { cpuPct: 37, memPct: 48, diskPct: 33, memUsedGb: 6.7, memTotalGb: 14, memAvailGb: 7.3, collectorUp: true },
    dfTable: [{ fs: "/dev/root", size: "14G", used: "4.6G", avail: "9.4G", usePct: 33, mount: "/" }, { fs: "tmpfs", size: "7.0G", used: "1.1G", avail: "5.9G", usePct: 16, mount: "/run/user" }],
    coredumps: [],
  },
  {
    id: "TB-022", name: "LIN Bus Testing", description: "LIN protocol stack regression bench — master/slave scheduling, sleep/wake cycles and checksum validation.", owner: "P. Bakun", createdAt: "2025-08-14", location: "Lab 2 Rack C",
    hosts: [{ hostId: "x022", platform: "RichOS" }],
    status: "Down", richosState: "unreachable", lastChange: "2026-06-18 08:51", lastPingValue: 540, recentDown: true,
    build: { distro: "mbient", distroVersion: "v3.2.0", buildTrack: "nightly", imageBasename: "apricot-image-lin", machine: "binz", buildNumber: "4819", buildUrl: "https://ci.internal/builds/4819", gitCommit: "b2d9f10" },
    composition: [{ assetTag: "00506", role: "LIN Master DUT", where: "Rack C · Slot 3", isPrimaryDUT: true, state: "fault" }],
    telemetry: { cpuPct: 0, memPct: 0, diskPct: 0, memUsedGb: 0, memTotalGb: 14, memAvailGb: 14, collectorUp: false, lastSeen: "9m ago" },
    dfTable: [{ fs: "/dev/root", size: "14G", used: "5.2G", avail: "8.8G", usePct: 37, mount: "/" }],
    coredumps: [{ name: "trigger_LIN_COREDUMP_20260618_0851", timestamp: "2026-06-18 08:51:22", size: "0.8 MB" }],
  },
  {
    id: "TB-038", name: "ADAS Sensor Fusion", description: "ADAS sensor fusion and object detection validation — camera, radar and LiDAR data path testing.", owner: "K. Nowak", createdAt: "2025-11-02", location: "Lab 1 HiL Bay",
    hosts: [{ hostId: "x038", platform: "RichOS" }, { hostId: "x233", platform: "Windows", rdpLink: "rdp://x233.lab.local" }],
    status: "Up", richosState: "running", lastChange: "2026-06-18 07:44", lastPingValue: 19, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "release", imageBasename: "apricot-image-adas", machine: "binz", buildNumber: "4821", buildUrl: "https://ci.internal/builds/4821", gitCommit: "a3f8c12" },
    composition: [{ assetTag: "00522", role: "ADAS DUT", where: "HiL Bay · Slot 4", isPrimaryDUT: true, state: "active" }, { assetTag: "00478", role: "Video Capture", where: "HiL Bay · PCIe x4", isPrimaryDUT: false, state: "active" }],
    telemetry: { cpuPct: 61, memPct: 71, diskPct: 44, memUsedGb: 9.9, memTotalGb: 14, memAvailGb: 4.1, collectorUp: true },
    dfTable: [{ fs: "/dev/root", size: "14G", used: "6.2G", avail: "7.8G", usePct: 44, mount: "/" }, { fs: "tmpfs", size: "7.0G", used: "2.1G", avail: "4.9G", usePct: 30, mount: "/run/user" }],
    coredumps: [],
  },
  {
    id: "TB-055", name: "Ethernet AVB", description: "Automotive Ethernet AVB/TSN stack validation — gPTP synchronisation, credit-based shaper and 100BASE-T1.", owner: "W. Pikulski", createdAt: "2025-03-28", location: "Lab 2 Rack A",
    hosts: [{ hostId: "x055", platform: "RichOS" }],
    status: "Degraded", richosState: "degraded", lastChange: "2026-06-18 04:10", lastPingValue: 29, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.0", buildTrack: "release", imageBasename: "apricot-image-eth", machine: "binz", buildNumber: "4812", buildUrl: "https://ci.internal/builds/4812", gitCommit: "c1e5a22" },
    composition: [{ assetTag: "00499", role: "Switch DUT", where: "Rack A · Slot 4", isPrimaryDUT: true, state: "active" }],
    telemetry: { cpuPct: 78, memPct: 68, diskPct: 52, memUsedGb: 9.5, memTotalGb: 14, memAvailGb: 4.5, collectorUp: true },
    dfTable: [{ fs: "/dev/root", size: "14G", used: "7.3G", avail: "6.7G", usePct: 52, mount: "/" }, { fs: "/dev/mmcblk0p1", size: "256M", used: "91M", avail: "165M", usePct: 36, mount: "/boot" }],
    coredumps: [],
  },
  {
    id: "TB-071", name: "Powertrain ECU", description: "Powertrain ECU integration bench — torque control, regenerative braking and drivetrain calibration loops.", owner: "S. Marek", createdAt: "2024-10-22", location: "Lab 1 HiL Bay",
    hosts: [{ hostId: "x071", platform: "RichOS" }],
    status: "Up", richosState: "running", lastChange: "2026-06-17 23:55", lastPingValue: 7, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "release", imageBasename: "apricot-image-pt", machine: "binz", buildNumber: "4821", buildUrl: "https://ci.internal/builds/4821", gitCommit: "a3f8c12" },
    composition: [{ assetTag: "00527", role: "Powertrain DUT", where: "HiL Bay · Slot 6", isPrimaryDUT: true, state: "active" }],
    telemetry: { cpuPct: 49, memPct: 55, diskPct: 27, memUsedGb: 7.7, memTotalGb: 14, memAvailGb: 6.3, collectorUp: true },
    dfTable: [{ fs: "/dev/root", size: "14G", used: "3.8G", avail: "10.2G", usePct: 27, mount: "/" }, { fs: "tmpfs", size: "7.0G", used: "1.5G", avail: "5.5G", usePct: 22, mount: "/run/user" }],
    coredumps: [],
  },
  {
    id: "TB-088", name: "BMS Integration", description: "Battery Management System integration bench — cell balancing, SOC estimation and thermal derating validation.", owner: "P. Bakun", createdAt: "2025-02-03", location: "Lab 2 Rack B",
    hosts: [{ hostId: "x088", platform: "RichOS" }],
    status: "Down", richosState: "unreachable", lastChange: "2026-06-17 14:22", lastPingValue: 67320, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.1.9", buildTrack: "release", imageBasename: "apricot-image-bms", machine: "binz", buildNumber: "4801", buildUrl: "https://ci.internal/builds/4801", gitCommit: "d4b8c90" },
    composition: [{ assetTag: "00500", role: "BMS DUT", where: "Rack B · Slot 4", isPrimaryDUT: true, state: "fault" }],
    telemetry: { cpuPct: 0, memPct: 0, diskPct: 0, memUsedGb: 0, memTotalGb: 14, memAvailGb: 14, collectorUp: false, lastSeen: "18h 42m ago" },
    dfTable: [{ fs: "/dev/root", size: "14G", used: "4.4G", avail: "9.6G", usePct: 32, mount: "/" }],
    coredumps: [],
  },
  {
    id: "TB-102", name: "AUTOSAR Stack", description: "AUTOSAR Classic and Adaptive stack integration — BSW configuration, OS scheduling and inter-ECU RTE flows.", owner: "L. Wójcik", createdAt: "2025-06-30", location: "Lab 2 Rack C",
    hosts: [{ hostId: "x102", platform: "RichOS" }],
    status: "Up", richosState: "running", lastChange: "2026-06-18 08:01", lastPingValue: 14, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "nightly", imageBasename: "apricot-image-asr", machine: "binz", buildNumber: "4822", buildUrl: "https://ci.internal/builds/4822", gitCommit: "f7c1e09" },
    composition: [{ assetTag: "00502", role: "AUTOSAR DUT", where: "Rack C · Slot 2", isPrimaryDUT: true, state: "active" }],
    telemetry: { cpuPct: 34, memPct: 41, diskPct: 25, memUsedGb: 5.7, memTotalGb: 14, memAvailGb: 8.3, collectorUp: true },
    dfTable: [{ fs: "/dev/root", size: "14G", used: "3.5G", avail: "10.5G", usePct: 25, mount: "/" }, { fs: "/dev/mmcblk0p1", size: "256M", used: "55G", avail: "201M", usePct: 21, mount: "/boot" }],
    coredumps: [],
  },
  {
    id: "TB-119", name: "RF & Antenna", description: "RF and antenna system bench — Bluetooth, Wi-Fi, GNSS and V2X RF performance under conducted and radiated conditions.", owner: "W. Pikulski", createdAt: "2025-09-18", location: "Lab 1 HiL Bay",
    hosts: [{ hostId: "x119", platform: "RichOS" }],
    status: "Maintenance", richosState: "maintenance", lastChange: "2026-06-17 16:00", lastPingValue: 0, recentDown: false,
    build: undefined,
    composition: [{ assetTag: "00510", role: "Display Ref", where: "HiL Bay · Display arm", isPrimaryDUT: false, state: "idle" }],
    telemetry: { cpuPct: 0, memPct: 0, diskPct: 0, memUsedGb: 0, memTotalGb: 14, memAvailGb: 14, collectorUp: false, lastSeen: "16h ago" },
    dfTable: [{ fs: "/dev/root", size: "14G", used: "3.9G", avail: "10.1G", usePct: 28, mount: "/" }],
    coredumps: [],
  },
  {
    id: "TB-134", name: "ADAS Validation", description: "End-to-end ADAS feature validation bench — NCAP scenarios, AEB, LKA and ACC closed-loop with traffic simulation.", owner: "K. Nowak", createdAt: "2025-12-01", location: "Lab 1 HiL Bay",
    hosts: [{ hostId: "x134", platform: "RichOS" }, { hostId: "x234", platform: "Windows", rdpLink: "rdp://x234.lab.local" }],
    status: "Up", richosState: "running", lastChange: "2026-06-18 08:20", lastPingValue: 25, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "release", imageBasename: "apricot-image-adas", machine: "binz", buildNumber: "4821", buildUrl: "https://ci.internal/builds/4821", gitCommit: "a3f8c12" },
    composition: [{ assetTag: "00197", role: "ADAS DUT", where: "HiL Bay · Slot 7", isPrimaryDUT: true, state: "active" }, { assetTag: "00517", role: "Scenario Injector", where: "HiL Bay · USB-A port 3", isPrimaryDUT: false, state: "active" }],
    telemetry: { cpuPct: 66, memPct: 74, diskPct: 38, memUsedGb: 10.4, memTotalGb: 14, memAvailGb: 3.6, collectorUp: true },
    dfTable: [{ fs: "/dev/root", size: "14G", used: "5.3G", avail: "8.7G", usePct: 38, mount: "/" }, { fs: "tmpfs", size: "7.0G", used: "2.4G", avail: "4.6G", usePct: 34, mount: "/run/user" }],
    coredumps: [],
  },
  {
    id: "TB-162", name: "Connectivity Stack", description: "Wireless connectivity regression bench — Bluetooth HFP/A2DP, Wi-Fi roaming, and USB tethering end-to-end flows.", owner: "S. Marek", createdAt: "2025-10-07", location: "Lab 2 Rack A",
    hosts: [{ hostId: "x162", platform: "RichOS" }],
    status: "Degraded", richosState: "degraded", lastChange: "2026-06-18 03:38", lastPingValue: 33, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "nightly", imageBasename: "apricot-image-conn", machine: "binz", buildNumber: "4820", buildUrl: "https://ci.internal/builds/4820", gitCommit: "f1b3c99" },
    composition: [{ assetTag: "00524", role: "Connectivity DUT", where: "Rack A · Slot 5", isPrimaryDUT: true, state: "active" }],
    telemetry: { cpuPct: 82, memPct: 77, diskPct: 61, memUsedGb: 10.8, memTotalGb: 14, memAvailGb: 3.2, collectorUp: true },
    dfTable: [{ fs: "/dev/root", size: "14G", used: "8.5G", avail: "5.5G", usePct: 61, mount: "/" }, { fs: "/dev/mmcblk0p1", size: "256M", used: "102M", avail: "154M", usePct: 40, mount: "/boot" }],
    coredumps: [],
  },
  {
    id: "TB-177", name: "Vehicle Abstraction", description: "Vehicle abstraction layer (VAL) bench — signal routing, network management and gateway cross-domain message mapping.", owner: "A. Kovalenko", createdAt: "2025-07-22", location: "Lab 2 Rack B",
    hosts: [{ hostId: "x177", platform: "RichOS" }],
    status: "Up", richosState: "running", lastChange: "2026-06-18 08:05", lastPingValue: 16, recentDown: false,
    build: { distro: "mbient", distroVersion: "v3.2.1", buildTrack: "release", imageBasename: "apricot-image-val", machine: "binz", buildNumber: "4821", buildUrl: "https://ci.internal/builds/4821", gitCommit: "a3f8c12" },
    composition: [{ assetTag: "00506", role: "Gateway DUT", where: "Rack B · Slot 5", isPrimaryDUT: true, state: "active" }],
    telemetry: { cpuPct: 29, memPct: 36, diskPct: 21, memUsedGb: 5.0, memTotalGb: 14, memAvailGb: 9.0, collectorUp: true },
    dfTable: [{ fs: "/dev/root", size: "14G", used: "2.9G", avail: "11.1G", usePct: 21, mount: "/" }, { fs: "tmpfs", size: "7.0G", used: "0.9G", avail: "6.1G", usePct: 13, mount: "/run/user" }],
    coredumps: [],
  },
  {
    id: "TB-214", name: "CI Worker 2", description: "Second Windows CI worker node for parallel Jenkins pipeline execution — CANoe batch mode and Python test runners.", owner: "A. Kovalenko", createdAt: "2026-01-15", location: "Lab 2 Rack A",
    hosts: [{ hostId: "x214", platform: "Windows", rdpLink: "rdp://x214.lab.local" }],
    status: "Up", richosState: "n/a", lastChange: "2026-06-18 07:55", lastPingValue: 3, recentDown: false,
    build: undefined,
    composition: [],
    telemetry: { cpuPct: 44, memPct: 61, diskPct: 48, memUsedGb: 19.5, memTotalGb: 32, memAvailGb: 12.5, collectorUp: true },
    dfTable: [{ fs: "C:\\", size: "500G", used: "240G", avail: "260G", usePct: 48, mount: "C:\\" }, { fs: "D:\\", size: "2.0T", used: "0.8T", avail: "1.2T", usePct: 40, mount: "D:\\data" }],
    coredumps: [],
  },
];

export interface TestCenter {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  benchIds: string[];
  assetTags: string[];
}

export const TEST_CENTERS: TestCenter[] = [
  {
    id: "TC-MUC", name: "Munich HiL Lab", address: "Petuelring 130", city: "Munich", country: "Germany",
    lat: 48.177, lng: 11.556,
    benchIds: ["TB-178", "TB-205", "TB-038", "TB-047", "TB-093", "TB-071"],
    assetTags: ["00522", "00240", "00197", "00517", "00516", "00524", "00510", "00527"],
  },
  {
    id: "TC-STR", name: "Stuttgart Integration Center", address: "Epplestraße 225", city: "Stuttgart", country: "Germany",
    lat: 48.740, lng: 9.190,
    benchIds: ["TB-146", "TB-112", "TB-156", "TB-014", "TB-055", "TB-199"],
    assetTags: ["00499", "00500", "00095", "00518", "00502"],
  },
  {
    id: "TC-WAW", name: "Warsaw Test Farm", address: "ul. Wołoska 9", city: "Warsaw", country: "Poland",
    lat: 52.186, lng: 21.001,
    benchIds: ["TB-084", "TB-231", "TB-067", "TB-033", "TB-022", "TB-088", "TB-102"],
    assetTags: ["00478", "00466", "00506"],
  },
];
