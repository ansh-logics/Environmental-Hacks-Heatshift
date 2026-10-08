import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { MOCK_WORKER_ID, MOCK_WORKER_NAME } from '@heatshift/shared';
import { STORAGE_KEYS } from '../lib/constants';
import { useLocalStorage } from '../hooks/use-local-storage';
import { DEFAULT_PROFILE, type WorkerProfileDraft } from '../features/onboarding/profile';

type AppState = {
  /** Temporary identity: no login exists in this phase. */
  identity: { userId: string; name: string };
  profile: WorkerProfileDraft;
  saveProfile: (next: WorkerProfileDraft) => void;
  resetProfile: () => void;
};

const AppContext = createContext<AppState | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const [profile, updateProfile, clearProfile] = useLocalStorage<WorkerProfileDraft>(
    STORAGE_KEYS.workerProfile,
    DEFAULT_PROFILE,
  );

  const value = useMemo<AppState>(
    () => ({
      identity: { userId: MOCK_WORKER_ID, name: MOCK_WORKER_NAME },
      profile,
      saveProfile: (next) => updateProfile(next),
      resetProfile: clearProfile,
    }),
    [profile, updateProfile, clearProfile],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppState(): AppState {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used inside AppProviders');
  return context;
}
