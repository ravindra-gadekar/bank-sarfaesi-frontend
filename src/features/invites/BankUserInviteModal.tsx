import { useEffect, useState, type FormEvent } from 'react';
import { inviteApi, type BankRegistryEntry, type BankRole, type OfficeType } from './api/inviteApi';

const BANK_ROLES: BankRole[] = ['admin', 'manager', 'maker', 'checker', 'auditor'];
const OFFICE_TYPES: OfficeType[] = ['HO', 'Zonal', 'Regional', 'Branch'];

interface Props {
  inviterOfficeType: OfficeType;
  inviterBankName: string;
  /** Default existing office to invite into; if omitted the user fills newOffice fields. */
  defaultTargetOfficeId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BankUserInviteModal({
  inviterOfficeType: _inviterOfficeType,
  inviterBankName,
  defaultTargetOfficeId,
  onClose,
  onSuccess,
}: Props) {
  const [registry, setRegistry] = useState<BankRegistryEntry[]>([]);
  const [email, setEmail] = useState('');
  const [bankRole, setBankRole] = useState<BankRole>('maker');
  const [bankName, setBankName] = useState(inviterBankName);
  const [officeType, setOfficeType] = useState<OfficeType>('Branch');
  const [address, setAddress] = useState('');
  const [contact, setContact] = useState('');
  const [officeEmail, setOfficeEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isExistingTarget = !!defaultTargetOfficeId;
  // Bank users always inherit bankName from inviter — the freeform path is reserved for app users.
  const bankNameLocked = true;

  useEffect(() => {
    inviteApi
      .getBankRegistry()
      .then(setRegistry)
      .catch(() => setRegistry([]));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      const payload = isExistingTarget
        ? { email, bankRole, targetOfficeId: defaultTargetOfficeId! }
        : {
            email,
            bankRole,
            newOffice: { bankName, officeType, address, contact, email: officeEmail },
          };
      await inviteApi.createBankInvite(payload);
      setSuccess(`Invite sent to ${email}`);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message ?? 'Failed to send invite');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-invite-title"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-md bg-sand-50 dark:bg-dark-surface rounded-2xl shadow-lg border border-sand-300 dark:border-dark-border p-6">
        <h3 id="bank-invite-title" className="text-lg font-semibold mb-4 text-ink dark:text-dark-text">
          Invite Bank User
        </h3>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="bank-name" className="block text-sm font-medium mb-1 text-ink dark:text-dark-text">
              Bank Name
            </label>
            <input
              id="bank-name"
              aria-label="Bank Name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              disabled={bankNameLocked}
              list="bank-registry"
              className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white disabled:bg-sand-100 dark:bg-dark-bg dark:border-dark-border dark:text-dark-text"
            />
            <datalist id="bank-registry">
              {registry.map((b) => (
                <option key={b.name} value={b.name} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="invite-email" className="block text-sm font-medium mb-1 text-ink dark:text-dark-text">
              Email
            </label>
            <input
              id="invite-email"
              aria-label="Email"
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white text-ink placeholder:text-ink-tertiary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent dark:bg-dark-bg dark:border-dark-border dark:text-dark-text dark:placeholder:text-dark-text-tertiary"
            />
          </div>

          <div>
            <label htmlFor="invite-role" className="block text-sm font-medium mb-1 text-ink dark:text-dark-text">
              Role
            </label>
            <select
              id="invite-role"
              value={bankRole}
              onChange={(e) => setBankRole(e.target.value as BankRole)}
              className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white dark:bg-dark-bg dark:border-dark-border dark:text-dark-text"
            >
              {BANK_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {!isExistingTarget && (
            <>
              <div>
                <label htmlFor="office-type" className="block text-sm font-medium mb-1 text-ink dark:text-dark-text">
                  Office Type
                </label>
                <select
                  id="office-type"
                  value={officeType}
                  onChange={(e) => setOfficeType(e.target.value as OfficeType)}
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white dark:bg-dark-bg dark:border-dark-border dark:text-dark-text"
                >
                  {OFFICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="office-address" className="block text-sm font-medium mb-1 text-ink dark:text-dark-text">
                  Office Address
                </label>
                <input
                  id="office-address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white dark:bg-dark-bg dark:border-dark-border dark:text-dark-text"
                  required
                />
              </div>
              <div>
                <label htmlFor="office-contact" className="block text-sm font-medium mb-1 text-ink dark:text-dark-text">
                  Contact Number
                </label>
                <input
                  id="office-contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white dark:bg-dark-bg dark:border-dark-border dark:text-dark-text"
                  required
                />
              </div>
              <div>
                <label htmlFor="office-email" className="block text-sm font-medium mb-1 text-ink dark:text-dark-text">
                  Office Email
                </label>
                <input
                  id="office-email"
                  type="email"
                  value={officeEmail}
                  onChange={(e) => setOfficeEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-sand-300 bg-white dark:bg-dark-bg dark:border-dark-border dark:text-dark-text"
                  required
                />
              </div>
            </>
          )}

          {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
          {success && <p className="text-sm text-green-600 dark:text-green-400" role="status">{success}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-sand-300 dark:border-dark-border text-ink dark:text-dark-text py-2.5 px-4 rounded-xl font-medium hover:bg-sand-200 dark:hover:bg-dark-surface-hover transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-accent text-white py-2.5 px-4 rounded-xl font-medium hover:bg-accent-hover transition-colors disabled:opacity-50"
            >
              {submitting ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
