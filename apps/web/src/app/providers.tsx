import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { MOCK_WORKER_ID, MOCK_WORKER_NAME } from '@heatshift/shared';
import { STORAGE_KEYS } from '../lib/constants';
import { useLocalStorage } from '../hooks/use-local-storage';
import { useApiStatus, type ApiStatus } from '../hooks/use-api-status';
import { MotionProvider } from '../components/motion/motion-provider';
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

  return (
    <AppContext.Provider value={value}>
      <ApiStatusProvider>
        <MotionProvider>{children}</MotionProvider>
      </ApiStatusProvider>
    </AppContext.Provider>
  );
}

export function useAppState(): AppState {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppState must be used inside AppProviders');
  return context;
}

/**
 * One /health poll for the whole shell. The header indicator, the sidebar
 * indicator and the diagnostics disclosure all read the same snapshot.
 */
function ApiStatusProvider({ children }: { children: ReactNode }) {
  const status = useApiStatus();
  const value = useMemo(() => status, [status]);
  return <ApiStatusContext.Provider value={value}>{children}</ApiStatusContext.Provider>;
}

const ApiStatusContext = createContext<ApiStatus | null>(null);

export function useConnection(): ApiStatus {
  const context = useContext(ApiStatusContext);
  if (!context) throw new Error('useConnection must be used inside AppProviders');
  return context;
}
