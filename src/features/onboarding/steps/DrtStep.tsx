import { useState, useEffect } from 'react';
import { useOnboardingStore } from '../../../store/onboardingStore';
import apiClient from '../../../lib/apiClient';

interface DrtResult {
  name: string;
  location: string;
  state: string;
}

export default function DrtStep() {
  const { branchInfo, drtJurisdiction, setDrtJurisdiction, nextStep } = useOnboardingStore();
  const [results, setResults] = useState<DrtResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualName, setManualName] = useState(drtJurisdiction.name);
  const [manualLocation, setManualLocation] = useState(drtJurisdiction.location);

  useEffect(() => {
    if (!branchInfo.state || !branchInfo.district) return;

    const fetchDrt = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await apiClient.get('/lookup/drt', {
          params: { state: branchInfo.state, district: branchInfo.district },
        });
        setResults(res.data.results || []);
      } catch {
        setError('Failed to fetch DRT suggestions.');
      } finally {
        setLoading(false);
      }
    };

    fetchDrt();
  }, [branchInfo.state, branchInfo.district]);

  const selectDrt = (drt: DrtResult) => {
    setDrtJurisdiction({ name: drt.name, location: drt.location });
  };

  const handleManualSubmit = () => {
    if (!manualName.trim() || !manualLocation.trim()) return;
    setDrtJurisdiction({ name: manualName.trim(), location: manualLocation.trim() });
    nextStep();
  };

  const handleContinue = () => {
    if (manualMode) {
      handleManualSubmit();
    } else {
      nextStep();
    }
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text dark:placeholder:text-dark-text-tertiary';

  return (
    <div>
      <h2 className="text-xl font-semibold text-ink dark:text-dark-text mb-1">DRT Jurisdiction</h2>
      <p className="text-sm text-ink-secondary dark:text-dark-text-secondary mb-6">
        Select the Debt Recovery Tribunal for your branch location
      </p>

      {!manualMode ? (
        <>
          {loading && (
            <div className="text-center text-ink-secondary dark:text-dark-text-secondary py-8">
              Loading DRT suggestions...
            </div>
          )}

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          {!loading && results.length > 0 && (
            <div className="space-y-3 mb-4">
              {results.map((drt) => {
                const isSelected = drtJurisdiction.name === drt.name && drtJurisdiction.location === drt.location;
                return (
                  <button
                    key={`${drt.name}-${drt.location}`}
                    type="button"
                    onClick={() => selectDrt(drt)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                      isSelected
                        ? 'border-accent bg-accent/5 dark:bg-accent/10'
                        : 'border-sand-300 hover:border-accent/50 dark:border-dark-border dark:hover:border-accent/50'
                    }`}
                  >
                    <div className="font-medium text-ink dark:text-dark-text">{drt.name}</div>
                    <div className="text-sm text-ink-secondary dark:text-dark-text-secondary">{drt.location}, {drt.state}</div>
                  </button>
                );
              })}
            </div>
          )}

          {!loading && results.length === 0 && !error && (
            <p className="text-ink-secondary dark:text-dark-text-secondary text-sm mb-4">
              No DRT suggestions found for {branchInfo.district}, {branchInfo.state}. Please enter manually.
            </p>
          )}

          <button
            type="button"
            onClick={() => setManualMode(true)}
            className="text-sm text-accent hover:underline mb-4"
          >
            Enter DRT details manually
          </button>
        </>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor="drtName" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              DRT Name <span className="text-red-500">*</span>
            </label>
            <input
              id="drtName"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              className={inputClass}
              placeholder="e.g. DRT-I Mumbai"
            />
          </div>

          <div>
            <label htmlFor="drtLocation" className="block text-sm font-medium text-ink dark:text-dark-text mb-1">
              DRT Location <span className="text-red-500">*</span>
            </label>
            <input
              id="drtLocation"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              className={inputClass}
              placeholder="e.g. Mumbai"
            />
          </div>

          <button
            type="button"
            onClick={() => setManualMode(false)}
            className="text-sm text-accent hover:underline"
          >
            ← Back to suggestions
          </button>
        </div>
      )}

      <div className="flex justify-between mt-8 pt-6 border-t border-sand-300 dark:border-dark-border">
        <button
          type="button"
          onClick={() => useOnboardingStore.getState().prevStep()}
          className="px-6 py-2.5 rounded-xl border border-sand-300 text-ink hover:bg-sand-100 dark:border-dark-border dark:text-dark-text dark:hover:bg-dark-bg transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!drtJurisdiction.name && !manualMode}
          className="px-6 py-2.5 rounded-xl bg-accent text-white hover:bg-accent-hover transition-colors font-medium disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
