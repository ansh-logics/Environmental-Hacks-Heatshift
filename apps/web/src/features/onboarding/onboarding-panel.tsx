import { useState } from 'react';
import {
  ACCESS_LEVEL_LABELS,
  ACCESS_LEVELS,
  SUN_EXPOSURE_LABELS,
  SUN_EXPOSURES,
  WORK_TYPE_LABELS,
  WORK_TYPES,
  type AccessLevel,
  type SunExposure,
  type WorkType,
} from '@heatshift/shared';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Field } from '../../components/ui/field';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { useAppState } from '../../app/providers';
import { DEMO_IDENTITY_NOTE } from '../../lib/constants';

const toOptions = <T extends string>(values: readonly T[], labels: Record<T, string>) =>
  values.map((value) => ({ value, label: labels[value] }));

/**
 * Local-only setup. There is no account to create: the answers stay on the device
 * and feed the heat-risk preview.
 */
export function OnboardingPanel() {
  const { profile, saveProfile } = useAppState();
  const [draft, setDraft] = useState(profile);
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(profile);

  return (
    <Card
      eyebrow="Step 1"
      title="Tell us how you work"
      action={
        <Button
          variant={dirty ? 'primary' : 'secondary'}
          onClick={() => {
            saveProfile(draft);
            setSaved(true);
            window.setTimeout(() => setSaved(false), 2500);
          }}
          disabled={!dirty}
        >
          {saved ? 'Saved on this phone' : 'Save'}
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Work" htmlFor="workType">
          <Select
            id="workType"
            value={draft.workType}
            options={toOptions(WORK_TYPES, WORK_TYPE_LABELS)}
            onChange={(event) =>
              setDraft({ ...draft, workType: event.target.value as WorkType })
            }
          />
        </Field>

        <Field label="City" htmlFor="city">
          <Input
            id="city"
            value={draft.city}
            onChange={(event) => setDraft({ ...draft, city: event.target.value })}
            placeholder="New Delhi"
          />
        </Field>

        <Field label="Hours in shift" htmlFor="hours">
          <Input
            id="hours"
            type="number"
            min={1}
            max={16}
            step={0.5}
            value={draft.hoursInShift}
            onChange={(event) =>
              setDraft({ ...draft, hoursInShift: Number(event.target.value) || 1 })
            }
          />
        </Field>

        <Field label="Shift start" htmlFor="shiftStart">
          <Input
            id="shiftStart"
            type="time"
            value={draft.shiftStart}
            onChange={(event) => setDraft({ ...draft, shiftStart: event.target.value })}
          />
        </Field>

        <Field label="Shift end" htmlFor="shiftEnd">
          <Input
            id="shiftEnd"
            type="time"
            value={draft.shiftEnd}
            onChange={(event) => setDraft({ ...draft, shiftEnd: event.target.value })}
          />
        </Field>

        <Field label="Sun at your work spot" htmlFor="sun">
          <Select
            id="sun"
            value={draft.sunExposure}
            options={toOptions(SUN_EXPOSURES, SUN_EXPOSURE_LABELS)}
            onChange={(event) =>
              setDraft({ ...draft, sunExposure: event.target.value as SunExposure })
            }
          />
        </Field>

        <Field label="Drinking water" htmlFor="water">
          <Select
            id="water"
            value={draft.waterAccess}
            options={toOptions(ACCESS_LEVELS, ACCESS_LEVEL_LABELS)}
            onChange={(event) =>
              setDraft({ ...draft, waterAccess: event.target.value as AccessLevel })
            }
          />
        </Field>

        <Field label="Shade" htmlFor="shade">
          <Select
            id="shade"
            value={draft.shadeAccess}
            options={toOptions(ACCESS_LEVELS, ACCESS_LEVEL_LABELS)}
            onChange={(event) =>
              setDraft({ ...draft, shadeAccess: event.target.value as AccessLevel })
            }
          />
        </Field>
      </div>

      <label className="mt-4 flex min-h-11 items-center gap-3 text-sm font-semibold text-ink-700">
        <input
          type="checkbox"
          className="h-5 w-5 accent-heat-accent"
          checked={draft.acclimatized}
          onChange={(event) => setDraft({ ...draft, acclimatized: event.target.checked })}
        />
        I am used to this heat (worked outdoors here for 2+ weeks)
      </label>

      <p className="mt-3 text-xs text-ink-500">{DEMO_IDENTITY_NOTE}</p>
    </Card>
  );
}
