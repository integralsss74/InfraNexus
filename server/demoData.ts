export type RiskCategory = "Low" | "Moderate" | "High" | "Critical";

export type DemoProject = {
  id: string;
  name: string;
  ministry: string;
  agency: string;
  sector: string;
  state: string;
  district: string;
  status: "On track" | "Under review" | "Delayed" | "Critical review";
  approvedCost: number;
  revisedCost: number;
  expenditure: number;
  physicalProgress: number;
  financialProgress: number;
  plannedProgress: number;
  costRisk: number;
  delayRisk: number;
  implementationRisk: number;
  overallRisk: number;
  riskCategory: RiskCategory;
  predictedCostOverrun: number;
  delayMonths: number;
  milestonesDelayed: number;
  extensions: number;
  durationMonths: number;
  durationElapsed: number;
  clearance: "Cleared" | "Conditional" | "Pending";
  contractor: "Stable" | "At risk" | "Under review";
  trend: "Improving" | "Stable" | "Deteriorating" | "Rapidly deteriorating";
  latitude: number;
  longitude: number;
  updatedAt: string;
};

export type DemoAlert = {
  id: string;
  projectId: string;
  projectName: string;
  type: string;
  severity: "Critical" | "High" | "Moderate" | "Information";
  message: string;
  currentValue: string;
  threshold: string;
  createdAt: string;
  recommendedAction: string;
  acknowledged: boolean;
};

export type DemoMonthlyObservation = {
  projectId: string;
  month: string;
  risk: number;
  physical: number;
  planned: number;
  financial: number;
  monthlyExpenditure: number;
};

const sectors = [
  "Roads", "Railways", "Ports", "Airports", "Power", "Water & Sanitation",
  "Communication", "Mining", "Steel", "Coal", "Social Infrastructure", "Logistics",
];
const states = [
  "Maharashtra", "Gujarat", "Tamil Nadu", "Karnataka", "Uttar Pradesh", "Rajasthan",
  "Madhya Pradesh", "Odisha", "West Bengal", "Telangana", "Assam", "Kerala",
];
const stateCoordinates: Record<string, [number, number]> = { Maharashtra: [19.076, 72.878], Gujarat: [23.023, 72.572], "Tamil Nadu": [13.083, 80.271], Karnataka: [12.972, 77.595], "Uttar Pradesh": [26.847, 80.947], Rajasthan: [26.912, 75.787], "Madhya Pradesh": [23.26, 77.413], Odisha: [20.296, 85.825], "West Bengal": [22.573, 88.364], Telangana: [17.385, 78.487], Assam: [26.144, 91.736], Kerala: [8.524, 76.936] };
const districts = [
  "Pune", "Surat", "Chennai", "Bengaluru", "Lucknow", "Jaipur", "Bhopal", "Cuttack", "Howrah", "Hyderabad", "Kamrup", "Kochi",
];
const ministries: Record<string, string> = {
  Roads: "Ministry of Road Transport & Highways",
  Railways: "Ministry of Railways",
  Ports: "Ministry of Ports, Shipping & Waterways",
  Airports: "Ministry of Civil Aviation",
  Power: "Ministry of Power",
  "Water & Sanitation": "Ministry of Jal Shakti",
  Communication: "Ministry of Communications",
  Mining: "Ministry of Mines",
  Steel: "Ministry of Steel",
  Coal: "Ministry of Coal",
  "Social Infrastructure": "Ministry of Housing & Urban Affairs",
  Logistics: "Department for Promotion of Industry and Internal Trade",
};
const prefixes: Record<string, string> = {
  Roads: "National Corridor", Railways: "Rail Connectivity", Ports: "Harbour Modernisation",
  Airports: "Regional Air Link", Power: "Grid Strengthening", "Water & Sanitation": "Integrated Water",
  Communication: "Digital Backbone", Mining: "Mineral Logistics", Steel: "Industrial Capacity",
  Coal: "Coal Evacuation", "Social Infrastructure": "Urban Renewal", Logistics: "Multimodal Logistics",
};

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, Math.round(value)));
const money = (value: number) => Math.round(value * 10) / 10;
const categoryFor = (score: number): RiskCategory => score > 75 ? "Critical" : score > 50 ? "High" : score > 25 ? "Moderate" : "Low";

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createProject(index: number): DemoProject {
  const random = mulberry32(index * 713 + 91);
  const sector = sectors[index % sectors.length];
  const state = states[(index * 5) % states.length];
  const geoRandom = mulberry32(index * 1013 + 47);
  const [stateLatitude, stateLongitude] = stateCoordinates[state];
  const latitude = Math.round((stateLatitude + (geoRandom() - 0.5) * 0.64) * 1000) / 1000;
  const longitude = Math.round((stateLongitude + (geoRandom() - 0.5) * 0.72) * 1000) / 1000;
  const approvedCost = money(850 + random() * 18250);
  const durationMonths = 24 + Math.floor(random() * 72);
  const durationElapsed = 20 + Math.floor(random() * 76);
  const plannedProgress = clamp(durationElapsed * (0.8 + random() * 0.22));
  const slippage = Math.max(-7, Math.round((random() - 0.36) * 47));
  const physicalProgress = clamp(plannedProgress - slippage);
  const financialGap = Math.round((random() - 0.29) * 36);
  const financialProgress = clamp(physicalProgress + financialGap);
  const milestonesDelayed = Math.max(0, Math.round((slippage + random() * 18) / 10));
  const extensions = Math.max(0, Math.round((slippage + random() * 10) / 20));
  const clearance = random() > 0.86 ? "Pending" : random() > 0.67 ? "Conditional" : "Cleared";
  const contractor = random() > 0.82 ? "Under review" : random() > 0.63 ? "At risk" : "Stable";
  const costRisk = clamp(18 + Math.max(0, financialProgress - physicalProgress) * 1.12 + milestonesDelayed * 4 + extensions * 6 + (clearance === "Pending" ? 15 : 0) + random() * 12);
  const delayRisk = clamp(12 + Math.max(0, plannedProgress - physicalProgress) * 1.34 + milestonesDelayed * 8 + extensions * 5 + (contractor !== "Stable" ? 10 : 0) + random() * 10);
  const implementationRisk = clamp(10 + milestonesDelayed * 7 + extensions * 6 + (clearance === "Pending" ? 18 : clearance === "Conditional" ? 8 : 0) + (contractor === "Under review" ? 16 : contractor === "At risk" ? 8 : 0) + random() * 12);
  const overallRisk = clamp(costRisk * 0.35 + delayRisk * 0.35 + implementationRisk * 0.3);
  const riskCategory = categoryFor(overallRisk);
  const revisedCost = money(approvedCost * (1 + Math.max(0, costRisk - 23) / 250));
  const expenditure = money(revisedCost * (financialProgress / 100));
  const trend = overallRisk > 76 ? "Rapidly deteriorating" : overallRisk > 54 ? "Deteriorating" : overallRisk < 30 ? "Improving" : "Stable";
  const status = riskCategory === "Critical" ? "Critical review" : riskCategory === "High" ? "Delayed" : riskCategory === "Moderate" ? "Under review" : "On track";

  return {
    id: `P-${String(index).padStart(4, "0")}`,
    name: `${prefixes[sector]} Programme — ${districts[(index * 3) % districts.length]}`,
    ministry: ministries[sector],
    agency: `${state} Infrastructure Delivery Agency`,
    sector,
    state,
    district: districts[(index * 3) % districts.length],
    status,
    approvedCost,
    revisedCost,
    expenditure,
    physicalProgress,
    financialProgress,
    plannedProgress,
    costRisk,
    delayRisk,
    implementationRisk,
    overallRisk,
    riskCategory,
    predictedCostOverrun: money(Math.max(0, (costRisk - 16) * 0.47)),
    delayMonths: money(Math.max(0, (delayRisk - 16) * 0.17)),
    milestonesDelayed,
    extensions,
    durationMonths,
    durationElapsed,
    clearance,
    contractor,
    trend,
    latitude,
    longitude,
    updatedAt: "24 Aug 2026",
  };
}

const scenarios: Record<number, Partial<DemoProject>> = {
  1: { name: "Konkan Green Corridor", sector: "Roads", state: "Maharashtra", district: "Pune", status: "On track", physicalProgress: 72, financialProgress: 69, plannedProgress: 70, costRisk: 17, delayRisk: 12, implementationRisk: 16, overallRisk: 15, riskCategory: "Low", predictedCostOverrun: 2.6, delayMonths: 0.4, milestonesDelayed: 0, extensions: 0, clearance: "Cleared", contractor: "Stable", trend: "Improving" },
  2: { name: "Eastern Freight Augmentation", sector: "Railways", state: "Odisha", district: "Cuttack", status: "Under review", physicalProgress: 43, financialProgress: 76, plannedProgress: 61, costRisk: 84, delayRisk: 58, implementationRisk: 60, overallRisk: 69, riskCategory: "High", predictedCostOverrun: 31.4, delayMonths: 7.2, milestonesDelayed: 3, extensions: 1, clearance: "Conditional", contractor: "At risk", trend: "Deteriorating" },
  3: { name: "Himalayan Rail Resilience", ministry: "Ministry of Railways", agency: "Assam Rail Infrastructure Delivery Agency", sector: "Railways", state: "Assam", district: "Kamrup", status: "Delayed", physicalProgress: 37, financialProgress: 44, plannedProgress: 68, costRisk: 58, delayRisk: 86, implementationRisk: 72, overallRisk: 73, riskCategory: "High", predictedCostOverrun: 18.1, delayMonths: 13.8, milestonesDelayed: 5, extensions: 2, clearance: "Conditional", contractor: "Under review", trend: "Rapidly deteriorating" },
  4: { name: "Narmada Integrated Water Network", ministry: "Ministry of Jal Shakti", agency: "Madhya Pradesh Water Resources Corporation", sector: "Water & Sanitation", state: "Madhya Pradesh", district: "Bhopal", status: "Critical review", approvedCost: 12300, revisedCost: 16300, expenditure: 13200, physicalProgress: 38, financialProgress: 81, plannedProgress: 73, costRisk: 91, delayRisk: 88, implementationRisk: 86, overallRisk: 89, riskCategory: "Critical", predictedCostOverrun: 42.8, delayMonths: 16.4, milestonesDelayed: 6, extensions: 3, clearance: "Pending", contractor: "Under review", trend: "Rapidly deteriorating" },
};

export const demoProjects: DemoProject[] = Array.from({ length: 1248 }, (_, offset) => {
  const index = offset + 1;
  const project = createProject(index);
  const override = scenarios[index];
  const merged = override ? { ...project, ...override } : project;
  const [stateLatitude, stateLongitude] = stateCoordinates[merged.state];
  const geoRandom = mulberry32(index * 1013 + 47);
  return { ...merged, latitude: Math.round((stateLatitude + (geoRandom() - 0.5) * 0.64) * 1000) / 1000, longitude: Math.round((stateLongitude + (geoRandom() - 0.5) * 0.72) * 1000) / 1000 };
});

export const monthlyObservations: DemoMonthlyObservation[] = demoProjects.flatMap(project => Array.from({ length: 8 }, (_, index) => {
  const interval = 7 - index;
  const riskStep = project.trend === "Rapidly deteriorating" ? 6 : project.trend === "Deteriorating" ? 4 : project.trend === "Improving" ? -2 : 2;
  return {
    projectId: project.id,
    month: ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026"][index],
    risk: clamp(project.overallRisk - interval * riskStep),
    physical: clamp(project.physicalProgress - interval * 5),
    planned: clamp(project.plannedProgress - interval * 5),
    financial: clamp(project.financialProgress - interval * 5),
    monthlyExpenditure: money(project.expenditure / Math.max(1, 8 - index)),
  };
}));

const acknowledgedAlerts = new Set<string>();

function alertsForProject(project: DemoProject): DemoAlert[] {
  const createdAt = "24 Aug 2026, 09:30";
  const alerts: Omit<DemoAlert, "id" | "acknowledged">[] = [];
  if (project.plannedProgress - project.physicalProgress >= 13) alerts.push({ projectId: project.id, projectName: project.name, type: "Physical progress slippage", severity: project.overallRisk > 75 ? "Critical" : "High", message: "Physical progress is materially below the planned trajectory.", currentValue: `${project.physicalProgress}% actual`, threshold: `${project.plannedProgress}% planned`, createdAt, recommendedAction: "Review the blocked milestones and confirm the recovery schedule." });
  if (project.financialProgress - project.physicalProgress >= 22) alerts.push({ projectId: project.id, projectName: project.name, type: "Expenditure / progress imbalance", severity: "Critical", message: "Financial progress is advancing faster than physical completion.", currentValue: `${project.financialProgress}% financial`, threshold: `${project.physicalProgress}% physical`, createdAt, recommendedAction: "Review expenditure-to-physical-progress mismatch." });
  if (project.milestonesDelayed >= 3) alerts.push({ projectId: project.id, projectName: project.name, type: "Repeated milestone slippage", severity: project.milestonesDelayed >= 5 ? "Critical" : "High", message: "Repeated milestone delays indicate emerging schedule pressure.", currentValue: `${project.milestonesDelayed} delayed milestones`, threshold: "3 delayed milestones", createdAt, recommendedAction: "Review milestone execution and identify implementation bottlenecks." });
  if (project.trend === "Rapidly deteriorating") alerts.push({ projectId: project.id, projectName: project.name, type: "Rapid risk deterioration", severity: "Critical", message: "The risk trajectory has accelerated over recent monthly observations.", currentValue: `${project.overallRisk}/100 risk score`, threshold: "15-point monthly increase", createdAt, recommendedAction: "Prioritize this project for monitoring review." });
  if (project.predictedCostOverrun >= 20) alerts.push({ projectId: project.id, projectName: project.name, type: "Projected cost escalation", severity: project.predictedCostOverrun >= 35 ? "Critical" : "High", message: "Predicted final cost exceeds the approved envelope beyond the configured threshold.", currentValue: `${project.predictedCostOverrun}% projected overrun`, threshold: "20% projected overrun", createdAt, recommendedAction: "Review escalation drivers and cost-control actions." });
  return alerts.map((alert, index) => ({ ...alert, id: `${project.id}-A${index + 1}`, acknowledged: acknowledgedAlerts.has(`${project.id}-A${index + 1}`) }));
}

export function allAlerts() {
  return demoProjects.flatMap(alertsForProject).sort((a, b) => {
    const priority = { Critical: 4, High: 3, Moderate: 2, Information: 1 };
    return priority[b.severity] - priority[a.severity] || a.projectId.localeCompare(b.projectId);
  });
}

export function acknowledgeAlert(alertId: string) {
  acknowledgedAlerts.add(alertId);
  return allAlerts().find(alert => alert.id === alertId) ?? null;
}

export function portfolioOverview() {
  const riskCounts = ["Low", "Moderate", "High", "Critical"].map(name => ({ name, value: demoProjects.filter(p => p.riskCategory === name).length }));
  const sectorRisk = sectors.map(name => {
    const values = demoProjects.filter(p => p.sector === name);
    return { name, risk: Math.round(values.reduce((sum, p) => sum + p.overallRisk, 0) / values.length), highRisk: values.filter(p => p.overallRisk > 50).length };
  }).sort((a, b) => b.risk - a.risk);
  const riskHeatmap = sectors.map(name => {
    const values = demoProjects.filter(p => p.sector === name);
    return {
      sector: name,
      total: values.length,
      cells: ["Low", "Moderate", "High", "Critical"].map(risk => ({ risk, count: values.filter(project => project.riskCategory === risk).length })),
    };
  });
  const ministryRisk = Object.values(ministries).map(name => {
    const values = demoProjects.filter(p => p.ministry === name);
    return { name: name.replace("Ministry of ", ""), risk: Math.round(values.reduce((sum, p) => sum + p.overallRisk, 0) / values.length) };
  }).sort((a, b) => b.risk - a.risk).slice(0, 7);
  const totalCost = demoProjects.reduce((sum, p) => sum + p.approvedCost, 0);
  const revisedCost = demoProjects.reduce((sum, p) => sum + p.revisedCost, 0);
  const expenditure = demoProjects.reduce((sum, p) => sum + p.expenditure, 0);
  const highRisk = demoProjects.filter(p => p.overallRisk > 50).length;
  return {
    dataLabel: "Synthetic Demonstration Dataset",
    referencePortfolio: {
      label: "Reference portfolio figures — April 2026",
      totalProjects: "1,981",
      originalCost: "₹37.13 Lakh Crore",
      revisedCost: "₹42.78 Lakh Crore",
      totalExpenditure: "₹20.36 Lakh Crore",
    },
    kpis: { totalProjects: demoProjects.length, approvedCost: totalCost, revisedCost, expenditure, highRisk, warnings: allAlerts().filter(alert => !alert.acknowledged).length },
    riskCounts,
    sectorRisk,
    riskHeatmap,
    ministryRisk,
    costDistribution: [0, 10, 20, 30, 40].map((start) => ({ range: `${start}–${start + 9}%`, value: demoProjects.filter(p => p.predictedCostOverrun >= start && p.predictedCostOverrun < start + 10).length })),
    delayDistribution: [0, 3, 6, 9, 12].map((start) => ({ range: `${start}–${start + 2} mo`, value: demoProjects.filter(p => p.delayMonths >= start && p.delayMonths < start + 3).length })),
    trend: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((month, index) => ({ month, risk: 39 + index * 2 + (index > 3 ? 2 : 0), critical: 88 + index * 8 })),
    mapPoints: demoProjects.filter((_, index) => index % 67 === 0).map((project, index) => ({ id: project.id, name: project.name, state: project.state, risk: project.overallRisk, x: 20 + (index * 13) % 64, y: 15 + (index * 19) % 70 })),
  };
}

export function listProjects(input: { query?: string; sector?: string; state?: string; states?: string[]; reviewZone?: { north: number; south: number; east: number; west: number }; risk?: string; status?: string; monthStart?: string; monthEnd?: string; page?: number; pageSize?: number; sort?: string }) {
  const query = input.query?.trim().toLowerCase() ?? "";
  const zoneStates = input.states?.filter(state => state !== "All") ?? [];
  const months = ["Jan 2026", "Feb 2026", "Mar 2026", "Apr 2026", "May 2026", "Jun 2026", "Jul 2026", "Aug 2026"];
  const startIndex = Math.max(0, months.indexOf(input.monthStart ?? months[0]));
  const endIndex = Math.max(startIndex, months.indexOf(input.monthEnd ?? months[months.length - 1]));
  const hasDateRange = Boolean(input.monthStart || input.monthEnd);
  const matches = demoProjects.filter(project => {
    const baseMatch = (!query || [project.id, project.name, project.ministry, project.sector, project.state].join(" ").toLowerCase().includes(query)) && (!input.sector || input.sector === "All" || project.sector === input.sector) && (!input.state || input.state === "All" || project.state === input.state) && (zoneStates.length === 0 || zoneStates.includes(project.state)) && (!input.reviewZone || (project.latitude <= input.reviewZone.north && project.latitude >= input.reviewZone.south && project.longitude <= input.reviewZone.east && project.longitude >= input.reviewZone.west)) && (!input.status || input.status === "All" || project.status === input.status);
    if (!baseMatch) return false;
    if (!hasDateRange) return !input.risk || input.risk === "All" || project.riskCategory === input.risk;
    return monthlyObservations.some(observation => observation.projectId === project.id && months.indexOf(observation.month) >= startIndex && months.indexOf(observation.month) <= endIndex && (!input.risk || input.risk === "All" || categoryFor(observation.risk) === input.risk));
  });
  const sorted = [...matches].sort((a, b) => input.sort === "Cost" ? b.approvedCost - a.approvedCost : input.sort === "Progress" ? a.physicalProgress - b.physicalProgress : a.overallRisk !== b.overallRisk ? b.overallRisk - a.overallRisk : a.id.localeCompare(b.id));
  const pageSize = Math.min(input.pageSize && input.pageSize > 50 ? 2000 : 50, Math.max(5, input.pageSize ?? 10));
  const page = Math.max(1, input.page ?? 1);
  return { rows: sorted.slice((page - 1) * pageSize, page * pageSize), total: sorted.length, page, pageSize, sectors, states };
}

export function projectDetail(projectId: string) {
  const project = demoProjects.find(item => item.id === projectId);
  if (!project) return null;
  const timeline = monthlyObservations.filter(observation => observation.projectId === projectId);
  const contributors = [
    { feature: "Physical progress below plan", value: Math.max(0, project.plannedProgress - project.physicalProgress), contribution: Math.round(Math.max(4, (project.plannedProgress - project.physicalProgress) * 1.2)), direction: "positive" },
    { feature: "Financial / physical gap", value: project.financialProgress - project.physicalProgress, contribution: Math.round(Math.max(-3, (project.financialProgress - project.physicalProgress) * 0.9)), direction: project.financialProgress >= project.physicalProgress ? "positive" : "negative" },
    { feature: "Delayed milestones", value: project.milestonesDelayed, contribution: project.milestonesDelayed * 8, direction: "positive" },
    { feature: "Time extensions", value: project.extensions, contribution: project.extensions * 7, direction: "positive" },
    { feature: "Clearance condition", value: project.clearance, contribution: project.clearance === "Pending" ? 18 : project.clearance === "Conditional" ? 8 : -6, direction: project.clearance === "Cleared" ? "negative" : "positive" },
  ];
  const recommendations = [
    project.plannedProgress - project.physicalProgress >= 13 ? "Review milestone slippage and validate the recovery schedule." : "Maintain the planned physical-progress cadence.",
    project.financialProgress - project.physicalProgress >= 22 ? "Investigate expenditure-to-physical-progress mismatch." : "Continue monthly expenditure-to-output reconciliation.",
    project.contractor !== "Stable" ? "Review contractor performance and capacity constraints." : "Keep contractor capacity under routine monitoring.",
  ];
  return { project, timeline, contributors, recommendations, alerts: alertsForProject(project) };
}

export function simulateRisk(input: { projectId?: string; physicalProgress: number; financialProgress: number; delayedMilestones: number; extensions: number; clearance: "Cleared" | "Conditional" | "Pending" }) {
  const baseline = demoProjects.find(project => project.id === (input.projectId ?? "P-0004")) ?? demoProjects[3];
  const financialPhysicalGap = Math.max(0, input.financialProgress - input.physicalProgress);
  const plannedPhysicalGap = Math.max(0, baseline.plannedProgress - input.physicalProgress);
  const clearanceCostPenalty = input.clearance === "Pending" ? 15 : input.clearance === "Conditional" ? 7 : 0;
  const clearanceImplementationPenalty = input.clearance === "Pending" ? 18 : input.clearance === "Conditional" ? 8 : 0;
  const cost = clamp(16 + financialPhysicalGap * 1.15 + input.delayedMilestones * 4 + input.extensions * 6 + clearanceCostPenalty);
  const time = clamp(13 + plannedPhysicalGap * 1.35 + input.delayedMilestones * 8 + input.extensions * 5);
  const implementation = clamp(12 + input.delayedMilestones * 7 + input.extensions * 6 + clearanceImplementationPenalty);
  const overall = clamp(cost * 0.35 + time * 0.35 + implementation * 0.3);
  return {
    costRisk: cost,
    delayRisk: time,
    implementationRisk: implementation,
    overallRisk: overall,
    category: categoryFor(overall),
    delta: overall - baseline.overallRisk,
    baseline: baseline.overallRisk,
    explanation: [
      `Cost risk starts at 16 and adds ${financialPhysicalGap.toFixed(0)} points of financial-versus-physical gap pressure, ${input.delayedMilestones * 4} from delayed milestones, ${input.extensions * 6} from extensions, and ${clearanceCostPenalty} from clearance status.`,
      `Schedule risk starts at 13 and adds ${plannedPhysicalGap.toFixed(0)} points of planned-versus-physical progress pressure, ${input.delayedMilestones * 8} from delayed milestones, and ${input.extensions * 5} from extensions.`,
      `Implementation risk starts at 12 and adds ${input.delayedMilestones * 7} from delayed milestones, ${input.extensions * 6} from extensions, and ${clearanceImplementationPenalty} from clearance status.`,
      `Overall risk combines cost (35%), schedule (35%), and implementation (30%), then compares the result with the current project baseline of ${baseline.overallRisk}/100.`,
    ],
  };
}

export function benchmark(groupBy: "ministry" | "sector" | "state" | "agency") {
  const key = { ministry: "ministry", sector: "sector", state: "state", agency: "agency" }[groupBy] as keyof DemoProject;
  const groups = new Map<string, DemoProject[]>();
  demoProjects.forEach(project => groups.set(String(project[key]), [...(groups.get(String(project[key])) ?? []), project]));
  const entries: Array<[string, DemoProject[]]> = Array.from(groups.entries());
  return entries.map(([name, values]: [string, DemoProject[]]) => ({ name, projects: values.length, avgRisk: Math.round(values.reduce((sum: number, p: DemoProject) => sum + p.overallRisk, 0) / values.length), avgEscalation: money(values.reduce((sum: number, p: DemoProject) => sum + p.predictedCostOverrun, 0) / values.length), avgDelay: money(values.reduce((sum: number, p: DemoProject) => sum + p.delayMonths, 0) / values.length), highRiskShare: Math.round(values.filter((p: DemoProject) => p.overallRisk > 50).length / values.length * 100), avgProgress: Math.round(values.reduce((sum: number, p: DemoProject) => sum + p.physicalProgress, 0) / values.length) })).sort((a, b) => b.avgRisk - a.avgRisk);
}

export function answerQuestion(question: string) {
  const q = question.toLowerCase();
  const id = question.toUpperCase().match(/P-\d{1,4}/)?.[0]?.replace(/P-(\d+)/, (_, digits) => `P-${digits.padStart(4, "0")}`);
  if (id) {
    const project = projectDetail(id);
    if (!project) return { answer: "Insufficient project data available.", sources: [] };
    const p = project.project;
    return { answer: `**${p.name}** (${p.id}) is in **${p.riskCategory.toLowerCase()} risk** at **${p.overallRisk}/100**. It is ${p.physicalProgress}% physically complete against ${p.plannedProgress}% planned, with ${p.financialProgress}% financial progress. The controlled analysis projects a **${p.predictedCostOverrun}%** cost overrun and **${p.delayMonths} months** of potential schedule delay. Key drivers are ${project.contributors.filter(item => item.direction === "positive").slice(0, 3).map(item => item.feature.toLowerCase()).join(", ")}.`, sources: [p.id] };
  }
  const namedState = states.find(state => q.includes(state.toLowerCase()));
  if (q.includes("alert") || q.includes("warning") || q.includes("signal")) {
    const results = allAlerts().filter(alert => {
      const project = demoProjects.find(item => item.id === alert.projectId);
      return !namedState || project?.state === namedState;
    }).slice(0, 5);
    if (!results.length) return { answer: "Insufficient project data available.", sources: [] };
    return { answer: `The controlled alert queue${namedState ? ` for **${namedState}**` : ""} currently includes ${results.map(alert => `**${alert.projectId}** — ${alert.type.toLowerCase()} (${alert.severity.toLowerCase()})`).join("; ")}. These are rule-based analytical signals from the Synthetic Demonstration Dataset.`, sources: results.map(alert => alert.projectId) };
  }
  if (namedState && (q.includes("risk") || q.includes("critical") || q.includes("project") || q.includes("priority"))) {
    const results = demoProjects.filter(project => project.state === namedState && (!q.includes("critical") || project.riskCategory === "Critical")).sort((a, b) => b.overallRisk - a.overallRisk).slice(0, 5);
    if (!results.length) return { answer: "Insufficient project data available.", sources: [] };
    return { answer: `The controlled portfolio query${q.includes("critical") ? " for critical projects" : " for highest risk"} in **${namedState}** returns ${results.map(project => `**${project.id} ${project.name}** — ${project.overallRisk}/100, ${project.riskCategory.toLowerCase()} risk`).join("; ")}.`, sources: results.map(project => project.id) };
  }
  if (q.includes("high expenditure") || q.includes("low physical")) {
    const results = demoProjects.filter(p => p.financialProgress > 70 && p.physicalProgress < 50).sort((a, b) => b.overallRisk - a.overallRisk).slice(0, 5);
    return { answer: `The controlled dataset identifies **${results.length} priority examples** where financial progress exceeds 70% while physical progress is below 50%: ${results.map(p => `${p.id} — ${p.name} (${p.financialProgress}% financial / ${p.physicalProgress}% physical)`).join("; ")}.`, sources: results.map(p => p.id) };
  }
  if (q.includes("sector") && (q.includes("escalation") || q.includes("cost"))) {
    const results = benchmark("sector").slice(0, 4);
    return { answer: `By average predicted cost escalation, the highest-risk sectors in the controlled demo portfolio are ${results.map(item => `**${item.name}** (${item.avgEscalation}%)`).join(", ")}. These are analytical outputs from synthetic demonstration data.`, sources: [] };
  }
  if (q.includes("highest") || q.includes("critical") || q.includes("increasing risk")) {
    const results = demoProjects.filter(p => q.includes("critical") ? p.riskCategory === "Critical" : p.overallRisk > 65).sort((a, b) => b.overallRisk - a.overallRisk).slice(0, 5);
    return { answer: `The controlled query layer returns ${results.map(p => `**${p.id} ${p.name}** — ${p.overallRisk}/100, ${p.trend.toLowerCase()}`).join("; ")}.`, sources: results.map(p => p.id) };
  }
  return { answer: "Insufficient project data available. The demo assistant can safely answer supported portfolio, project ID, escalation, deterioration, and expenditure-versus-progress questions using only the synthetic dataset.", sources: [] };
}

export const taxonomy = { sectors, states, ministries: Object.values(ministries) };
