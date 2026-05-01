import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { branchApi } from '../api/branchApi';

interface SsoEntry {
  provider: 'microsoft' | 'google';
  clientId: string;
  tenantId: string;
  clientSecret: string;
  allowedDomains: string;
}

interface SsoForm {
  configs: SsoEntry[];
}

const emptySso: SsoEntry = {
  provider: 'microsoft',
  clientId: '',
  tenantId: '',
  clientSecret: '',
  allowedDomains: '',
};

export default function SsoConfigTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const { register, control, handleSubmit, reset, watch } = useForm<SsoForm>({
    defaultValues: { configs: [] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'configs' });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await branchApi.getBranch();
        const existing: SsoEntry[] = (data.ssoConfigs || []).map(
          (c: Record<string, unknown>) => ({
            provider: c.provider || 'microsoft',
            clientId: c.clientId || '',
            tenantId: c.tenantId || '',
            clientSecret: c.clientSecret || '',
            allowedDomains: Array.isArray(c.allowedDomains)
              ? (c.allowedDomains as string[]).join(', ')
              : c.allowedDomains || '',
          }),
        );
        reset({ configs: existing });
      } catch {
        setMessage({ type: 'error', text: 'Failed to load SSO configuration.' });
      } finally {
        setLoading(false);
      }
    })();
  }, [reset]);

  const onSubmit = async (values: SsoForm) => {
    setSaving(true);
    setMessage(null);
    try {
      const payload = values.configs.map((c) => ({
        provider: c.provider,
        clientId: c.clientId,
        tenantId: c.provider === 'microsoft' ? c.tenantId : undefined,
        clientSecret: c.clientSecret,
        allowedDomains: c.allowedDomains
          .split(',')
          .map((d) => d.trim())
          .filter(Boolean),
      }));
      await branchApi.updateSso(payload);
      setMessage({ type: 'success', text: 'SSO configuration saved.' });
    } catch {
      setMessage({ type: 'error', text: 'Failed to save SSO configuration.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-10 bg-sand-200 dark:bg-dark-border rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  const inputCls =
    'w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-surface dark:border-dark-border dark:text-dark-text';
  const labelCls = 'block text-sm font-medium text-ink-secondary dark:text-dark-text-secondary mb-1';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {fields.length === 0 && (
        <p className="text-sm text-ink-tertiary dark:text-dark-text-tertiary">
          No SSO providers configured.
        </p>
      )}

      {fields.map((field, idx) => {
        const provider = watch(`configs.${idx}.provider`);
        return (
          <div
            key={field.id}
            className="bg-sand-50 dark:bg-dark-surface rounded-2xl border border-sand-300 dark:border-dark-border p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-ink dark:text-dark-text">
                Provider #{idx + 1}
              </h4>
              <button
                type="button"
                onClick={() => remove(idx)}
                className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
              >
                Remove
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Provider</label>
                <select {...register(`configs.${idx}.provider`)} className={inputCls}>
                  <option value="microsoft">Microsoft</option>
                  <option value="google">Google</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Client ID</label>
                <input {...register(`configs.${idx}.clientId`)} className={inputCls} />
              </div>
              {provider === 'microsoft' && (
                <div>
                  <label className={labelCls}>Tenant ID</label>
                  <input {...register(`configs.${idx}.tenantId`)} className={inputCls} />
                </div>
              )}
              <div>
                <label className={labelCls}>Client Secret</label>
                <input
                  {...register(`configs.${idx}.clientSecret`)}
                  type="password"
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Allowed Domains (comma-separated)</label>
              <input
                {...register(`configs.${idx}.allowedDomains`)}
                placeholder="example.com, corp.example.com"
                className={inputCls}
              />
            </div>

            <button
              type="button"
              disabled
              className="text-xs text-ink-tertiary dark:text-dark-text-tertiary border border-sand-300 dark:border-dark-border py-1.5 px-3 rounded-lg opacity-60 cursor-not-allowed"
            >
              Test Connection (coming soon)
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => append({ ...emptySso })}
        className="border border-sand-300 text-ink py-2.5 px-4 rounded-xl font-medium hover:bg-sand-200 transition-colors dark:border-dark-border dark:text-dark-text"
      >
        + Add SSO Provider
      </button>

      {message && (
        <p className={`text-sm ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {message.text}
        </p>
      )}

      {fields.length > 0 && (
        <button
          type="submit"
          disabled={saving}
          className="bg-accent text-white py-2.5 px-4 rounded-xl font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      )}
    </form>
  );
}
