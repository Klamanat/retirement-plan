export interface RetirementInputs {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
  currentSavings: number;
  expectedReturn: number;   // % per year nominal
  inflationRate: number;    // % per year
  monthlyExpense: number;   // after retirement (today's money)
  monthlySavings: number;   // current monthly savings (income - expense)
}

export interface RetirementResult {
  yearsToRetirement: number;
  yearsInRetirement: number;
  requiredFund: number;         // เงินที่ต้องมีตอนเกษียณ
  projectedFund: number;        // เงินที่จะมีตอนเกษียณ (ถ้าออมต่อเนื่อง)
  requiredMonthlySavings: number; // เงินออมต่อเดือนที่ต้องการ
  shortfall: number;            // ขาดอีกเท่าไหร่
  progress: number;             // % ของเป้าหมาย (0–100)
  fvCurrentSavings: number;     // FV ของเงินออมปัจจุบัน
  realReturnRate: number;       // อัตราผลตอบแทนจริง (หักเงินเฟ้อ)
}

export function calculateRetirement(inputs: RetirementInputs): RetirementResult {
  const {
    currentAge, retirementAge, lifeExpectancy,
    currentSavings, expectedReturn, inflationRate,
    monthlyExpense, monthlySavings,
  } = inputs;

  const yearsToRetirement = Math.max(0, retirementAge - currentAge);
  const yearsInRetirement = Math.max(0, lifeExpectancy - retirementAge);
  const monthsToRetirement = yearsToRetirement * 12;

  // Real return rate (Fisher equation)
  const nominalRate   = expectedReturn / 100;
  const inflation     = inflationRate  / 100;
  const realRate      = (1 + nominalRate) / (1 + inflation) - 1;
  const monthlyNominal = nominalRate / 12;
  const monthlyReal   = realRate / 12;

  // ── Required retirement fund (PV of annuity, real terms) ──
  const n = yearsInRetirement * 12;
  let requiredFund: number;
  if (monthlyReal > 0.00001) {
    requiredFund = monthlyExpense * (1 - Math.pow(1 + monthlyReal, -n)) / monthlyReal;
  } else {
    requiredFund = monthlyExpense * n;
  }

  // ── FV of current savings at retirement ──
  const fvCurrentSavings = currentSavings * Math.pow(1 + monthlyNominal, monthsToRetirement);

  // ── FV of ongoing monthly savings ──
  let fvMonthlySavings = 0;
  if (monthlyNominal > 0.00001 && monthsToRetirement > 0) {
    fvMonthlySavings = monthlySavings * (Math.pow(1 + monthlyNominal, monthsToRetirement) - 1) / monthlyNominal;
  } else {
    fvMonthlySavings = monthlySavings * monthsToRetirement;
  }

  const projectedFund = fvCurrentSavings + fvMonthlySavings;

  // ── Required monthly savings to reach goal ──
  const remaining = requiredFund - fvCurrentSavings;
  let requiredMonthlySavings = 0;
  if (remaining > 0 && monthsToRetirement > 0) {
    if (monthlyNominal > 0.00001) {
      requiredMonthlySavings = remaining * monthlyNominal / (Math.pow(1 + monthlyNominal, monthsToRetirement) - 1);
    } else {
      requiredMonthlySavings = remaining / monthsToRetirement;
    }
  }

  const shortfall = Math.max(0, requiredFund - projectedFund);
  const progress  = requiredFund > 0 ? Math.min(100, (projectedFund / requiredFund) * 100) : 100;

  return {
    yearsToRetirement,
    yearsInRetirement,
    requiredFund:           Math.round(requiredFund),
    projectedFund:          Math.round(projectedFund),
    requiredMonthlySavings: Math.round(requiredMonthlySavings),
    shortfall:              Math.round(shortfall),
    progress:               Math.round(progress * 10) / 10,
    fvCurrentSavings:       Math.round(fvCurrentSavings),
    realReturnRate:         Math.round(realRate * 10000) / 100,
  };
}
