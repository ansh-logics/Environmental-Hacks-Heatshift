import {
  HEAT_LEVEL_HEADLINES,
  HEAT_LEVEL_LABELS,
  HEAT_LEVEL_WBGT_THRESHOLDS,
  type HeatLevel,
  type HeatRiskComputed,
  type HeatRiskInput,
} from '@heatshift/shared';

/** Metabolic intensity of each work type, 1.0 = heavy continuous labour. */
const WORK_INTENSITY: Record<HeatRiskInput['workType'], number> = {
  delivery_rider: 0.9,
  security_guard: 0.6,
  construction: 1,
  street_vendor: 0.75,
  sanitation: 0.95,
  other: 0.8,
};

/** How far the black-globe temperature sits above air temperature. */
const SOLAR_GAIN: Record<HeatRiskInput['sunExposure'], number> = {
  full_sun: 12,
  partial_shade: 6,
  deep_shade: 2,
  indoor: 0,
};

const ACCESS_IMPACT: Record<HeatRiskInput['waterAccess'], number> = {
  none: 1.5,
  limited: 0,
  reliable: -1,
};

/** Saturation vapour pressure over water (Magnus-Tetens), in hPa. */
function saturationVapourPressure(tC: number): number {
  return 6.112 * Math.exp((17.67 * tC) / (tC + 243.5));
}

function clampedHumidity(humidityPercent: number): number {
  return Math.min(100, Math.max(1, humidityPercent));
}

/** Dew point from the same Magnus relation, used as the lower search bound. */
function dewPointC(temperatureC: number, humidityPercent: number): number {
  const rh = clampedHumidity(humidityPercent);
  const gamma = Math.log(rh / 100) + (17.67 * temperatureC) / (temperatureC + 243.5);
  return (243.5 * gamma) / (17.67 - gamma);
}

/**
 * Natural wet-bulb temperature from the psychrometric equation, solved by
 * bisection between the dew point and the dry bulb. Deliberately arithmetic
 * rather than a lookup table so the model can be audited from the response.
 */
export function wetBulbC(
  temperatureC: number,
  humidityPercent: number,
  pressureHpa = 1010,
): number {
  const actualVapourPressure =
    (clampedHumidity(humidityPercent) / 100) * saturationVapourPressure(temperatureC);
  const psychrometricConstant = 0.000665;

  const residual = (wetBulb: number) =>
    saturationVapourPressure(wetBulb) -
    psychrometricConstant * pressureHpa * (temperatureC - wetBulb) -
    actualVapourPressure;

  let low = dewPointC(temperatureC, humidityPercent);
  let high = temperatureC;
  for (let step = 0; step < 40; step += 1) {
    const middle = (low + high) / 2;
    if (residual(middle) > 0) high = middle;
    else low = middle;
  }
  return (low + high) / 2;
}

/** Estimated black-globe temperature: sun loads it up, wind cools it down. */
export function globeC(input: HeatRiskInput): number {
  const windCooling = Math.min(6, input.windSpeedKmh / 6);
  return input.temperatureC + SOLAR_GAIN[input.sunExposure] - windCooling;
}

export function wbgtC(input: HeatRiskInput): number {
  const tw = wetBulbC(input.temperatureC, input.humidityPercent);
  const tg = globeC(input);
  const wbgt =
    input.sunExposure === 'indoor'
      ? 0.7 * tw + 0.3 * tg
      : 0.561 * tw + 0.394 * tg + 0.041 * input.temperatureC;
  return Math.round(wbgt * 10) / 10;
}

function levelFromWbgt(value: number): HeatLevel {
  if (value > HEAT_LEVEL_WBGT_THRESHOLDS.severe) return 'severe';
  if (value >= HEAT_LEVEL_WBGT_THRESHOLDS.high) return 'high';
  if (value >= HEAT_LEVEL_WBGT_THRESHOLDS.moderate) return 'moderate';
  return 'low';
}

const PLAN_BY_LEVEL: Record<
  HeatLevel,
  {
    workMinutes: number;
    restMinutes: number;
    waterMlPerHour: number;
    maxShiftMinutes: number;
  }
> = {
  low: { workMinutes: 50, restMinutes: 10, waterMlPerHour: 350, maxShiftMinutes: 480 },
  moderate: {
    workMinutes: 40,
    restMinutes: 20,
    waterMlPerHour: 500,
    maxShiftMinutes: 360,
  },
  high: { workMinutes: 25, restMinutes: 35, waterMlPerHour: 750, maxShiftMinutes: 240 },
  severe: {
    workMinutes: 15,
    restMinutes: 45,
    waterMlPerHour: 1000,
    maxShiftMinutes: 120,
  },
};

/**
 * Pure, synchronous risk model. No network, no database: this is the function
 * the whole product rests on, so it stays easy to reason about and to test. It
 * says nothing about where the observation came from - the route that called it
 * attaches that provenance.
 */
export function computeHeatRisk(input: HeatRiskInput): HeatRiskComputed {
  const base = wbgtC(input);
  const intensity = WORK_INTENSITY[input.workType];
  const strain =
    base +
    (intensity - 0.8) * 3 +
    ACCESS_IMPACT[input.waterAccess] +
    ACCESS_IMPACT[input.shadeAccess] +
    (input.acclimatized ? 0 : 2);

  const level = levelFromWbgt(strain);
  // 24 °C strain is the comfortable ceiling; 38 °C is stop-work territory.
  const score = Math.round(Math.min(100, Math.max(0, ((strain - 24) / 14) * 100)));

  const plan = PLAN_BY_LEVEL[level];
  const waterMlPerHour =
    Math.round((plan.waterMlPerHour * (0.85 + intensity * 0.2)) / 50) * 50;
  const shiftMinutes = Math.round(input.hoursInShift * 60);
  const unsafeStartHour = { low: 15, moderate: 14, high: 12, severe: 11 }[level];

  return {
    wbgtC: Math.round(strain * 10) / 10,
    score,
    level,
    label: HEAT_LEVEL_LABELS[level],
    headline: HEAT_LEVEL_HEADLINES[level],
    plan: {
      workMinutesPerCycle: plan.workMinutes,
      restMinutesPerCycle: plan.restMinutes,
      waterMlPerHour,
      maxRecommendedShiftMinutes: plan.maxShiftMinutes,
      unsafeStartHour,
      advice: buildAdvice({
        level,
        input,
        workMinutes: plan.workMinutes,
        restMinutes: plan.restMinutes,
        waterMlPerHour,
        shiftMinutes,
        maxShiftMinutes: plan.maxShiftMinutes,
        unsafeStartHour,
      }),
    },
    factors: [
      {
        factor: 'Wet-bulb temperature',
        impact: `${wetBulbC(input.temperatureC, input.humidityPercent).toFixed(1)} °C at ${input.humidityPercent}% humidity`,
      },
      {
        factor: 'Sun and wind at the work spot',
        impact: `${input.sunExposure.replace('_', ' ')}, ${input.windSpeedKmh} km/h wind`,
      },
      {
        factor: 'Work intensity',
        impact: `${intensity.toFixed(2)} x resting heat load`,
      },
      {
        factor: 'Water and shade access',
        impact: `water ${input.waterAccess}, shade ${input.shadeAccess}${input.acclimatized ? '' : ', not heat-acclimatised'}`,
      },
    ],
    input,
  };
}

type AdviceInput = {
  level: HeatLevel;
  input: HeatRiskInput;
  workMinutes: number;
  restMinutes: number;
  waterMlPerHour: number;
  shiftMinutes: number;
  maxShiftMinutes: number;
  unsafeStartHour: number;
};

function buildAdvice({
  level,
  input,
  workMinutes,
  restMinutes,
  waterMlPerHour,
  shiftMinutes,
  maxShiftMinutes,
  unsafeStartHour,
}: AdviceInput): string[] {
  const advice = [
    `Work ${workMinutes} minutes, then rest ${restMinutes} minutes in shade. Repeat every hour.`,
    `Drink about ${waterMlPerHour} ml of water per hour; do not wait until you are thirsty.`,
  ];

  if (shiftMinutes > maxShiftMinutes) {
    advice.push(
      `Your planned shift is ${(shiftMinutes / 60).toFixed(1)} h. Cap it at ${(maxShiftMinutes / 60).toFixed(1)} h or split it around ${String(unsafeStartHour).padStart(2, '0')}:00`,
    );
  }

  if (level === 'severe' || level === 'high') {
    advice.push(
      `Avoid starting after ${String(unsafeStartHour).padStart(2, '0')}:00 — that is the hottest part of the day.`,
    );
    advice.push(
      'Use ORS/salt and light full-sleeve clothing; a wet cloth on the neck helps.',
    );
  }

  if (level === 'severe') {
    advice.push(
      'Move to a cooling space or clinic if you feel dizzy, sick or stop sweating.',
    );
  }

  if (input.waterAccess === 'none') {
    advice.push('No reliable water on this route: carry your own supply before leaving.');
  }

  return advice;
}
