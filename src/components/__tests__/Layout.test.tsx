import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '../Layout';
import { useAuthStore } from '../../store/authStore';

function renderWithUser(userKind: 'app' | 'bank') {
  useAuthStore.setState({
    isAuthenticated: true,
    hasOffice: true,
    hasBranch: true,
    user: {
      id: '1',
      email: 'a@x.com',
      name: 'A',
      role: 'admin',
      userKind,
      bankRole: userKind === 'bank' ? 'admin' : undefined,
      appRole: userKind === 'app' ? 'admin' : undefined,
    },
  } as never);
  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<div>child</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('Layout sidebar dispatch', () => {
  beforeEach(() => {
    // Reset store between tests so persisted state doesn't leak
    useAuthStore.setState({
      isAuthenticated: false,
      hasOffice: false,
      hasBranch: false,
      user: null,
    } as never);
  });

  it('renders App-side nav for app user', () => {
    renderWithUser('app');
    expect(screen.getByText(/^banks$/i)).toBeInTheDocument();
    expect(screen.getByText(/app users/i)).toBeInTheDocument();
    expect(screen.queryByText(/^cases$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/registry/i)).not.toBeInTheDocument();
  });

  it('renders Bank-side nav for bank user', () => {
    renderWithUser('bank');
    expect(screen.getByText(/^cases$/i)).toBeInTheDocument();
    expect(screen.getByText(/registry/i)).toBeInTheDocument();
    expect(screen.queryByText(/^banks$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/app users/i)).not.toBeInTheDocument();
  });
});
