import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import BankUserInviteModal from '../BankUserInviteModal';
import { useAuthStore } from '../../../store/authStore';
import { inviteApi } from '../api/inviteApi';

vi.mock('../api/inviteApi', () => ({
  inviteApi: {
    getBankRegistry: vi.fn().mockResolvedValue([{ name: 'Test Bank', logoKey: 'l' }]),
    createBankInvite: vi.fn().mockResolvedValue({ id: 'inv1', email: 'x@y.com' }),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  useAuthStore.setState({
    user: {
      id: 'u',
      email: 'h@a.com',
      name: 'H',
      role: 'admin',
      userKind: 'bank',
      bankRole: 'admin',
    },
    selectedOfficeId: 'office-ho',
  } as never);
});

describe('BankUserInviteModal', () => {
  it('locks bankName for HO inviter', async () => {
    render(
      <BankUserInviteModal
        inviterOfficeType="HO"
        inviterBankName="Test Bank"
        onClose={() => {}}
        onSuccess={() => {}}
      />,
    );
    const bankNameInput = await screen.findByLabelText(/bank name/i);
    expect(bankNameInput).toBeDisabled();
    expect((bankNameInput as HTMLInputElement).value).toBe('Test Bank');
  });

  it('submits a bank invite for an existing target office', async () => {
    const onSuccess = vi.fn();
    render(
      <BankUserInviteModal
        inviterOfficeType="HO"
        inviterBankName="Test Bank"
        defaultTargetOfficeId="office-ho"
        onClose={() => {}}
        onSuccess={onSuccess}
      />,
    );
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'new@a.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send invite/i }));
    await screen.findByText(/invite sent/i);
    expect(inviteApi.createBankInvite).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'new@a.com', targetOfficeId: 'office-ho' }),
    );
  });
});
