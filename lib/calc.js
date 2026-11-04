// Profit-sharing rules for House of Horticulturists
// Partner 1: Hamid Ali   Partner 2: Syed Haider

export const PARTNER_1 = "Hamid Ali";
export const PARTNER_2 = "Syed Haider";
export const BUSINESS = "House of Horticulturists";

// Scenario 1 – new (first-time) clients.
// The tier is chosen from the TOTAL gross profit of all new-client projects
// and that one rate is applied to the whole total.
//   total <= 5000          -> 10%
//   5000 < total <= 7500   ->  8%
//   total > 7500           ->  6%
export const NEW_CLIENT_TIERS = [
  { max: 5000, rate: 0.10, label: "Up to £5,000" },
  { max: 7500, rate: 0.08, label: "£5,000.01 – £7,500" },
  { max: Infinity, rate: 0.06, label: "Above £7,500" },
];

// Scenario 2 – repeat clients: flat 5% for Haider.
export const REPEAT_CLIENT_RATE = 0.05;

// Scenario 3 – monthly garden maintenance subscribers:
// Haider gets a fixed £5 per subscription project, whatever the price.
export const SUBSCRIPTION_FEE = 5;

export const CLIENT_TYPES = [
  { value: "new", label: "New client (first timer)" },
  { value: "repeat", label: "Repeat client" },
  { value: "subscription", label: "Monthly maintenance subscriber" },
];

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const sum = (ps) => round2(ps.reduce((s, p) => s + p.profit, 0));

export function newClientTier(total) {
  return NEW_CLIENT_TIERS.find((t) => total <= t.max);
}

// Gross profit for one project: either typed in directly, or (optionally)
// worked out as project price minus overall project cost.
export function profitOf(p) {
  if (p.useCost) return round2((Number(p.price) || 0) - (Number(p.cost) || 0));
  return Number(p.profit) || 0;
}

export function calculate(projects) {
  const clean = projects.map((p) => ({
    ...p,
    price: Number(p.price) || 0,
    cost: Number(p.cost) || 0,
    profit: profitOf(p),
  }));
  const newProjects = clean.filter((p) => p.type === "new");
  const repeatProjects = clean.filter((p) => p.type === "repeat");
  const subProjects = clean.filter((p) => p.type === "subscription");

  const newTotal = sum(newProjects);
  const repeatTotal = sum(repeatProjects);
  const subTotal = sum(subProjects);

  const tier = newClientTier(newTotal);
  const newRate = newTotal > 0 ? tier.rate : 0;
  const haiderNew = round2(newTotal * newRate);

  const repeatRate = repeatTotal > 0 ? REPEAT_CLIENT_RATE : 0;
  const haiderRepeat = round2(repeatTotal * repeatRate);

  const haiderSub = round2(subProjects.length * SUBSCRIPTION_FEE);

  const haider = {
    new: haiderNew,
    repeat: haiderRepeat,
    subscription: haiderSub,
    total: round2(haiderNew + haiderRepeat + haiderSub),
  };
  const hamid = {
    new: round2(newTotal - haiderNew),
    repeat: round2(repeatTotal - haiderRepeat),
    subscription: round2(subTotal - haiderSub),
  };
  hamid.total = round2(hamid.new + hamid.repeat + hamid.subscription);

  return {
    newProjects,
    repeatProjects,
    subProjects,
    newTotal,
    repeatTotal,
    subTotal,
    grandTotal: round2(newTotal + repeatTotal + subTotal),
    usesCost: clean.some((p) => p.useCost),
    newTier: newTotal > 0 ? tier : null,
    newRate,
    repeatRate,
    haider,
    hamid,
  };
}

export const gbp = (n) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n || 0);

export const pct = (r) => `${(r * 100).toFixed(r * 100 % 1 ? 1 : 0)}%`;
