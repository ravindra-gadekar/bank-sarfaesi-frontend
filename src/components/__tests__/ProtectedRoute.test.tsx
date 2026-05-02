import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import { useAuthStore } from '../../store/authStore';

beforeEach(() => {
  useAuthStore.setState({
    isAuthenticated: true,
    hasOffice: true,
    hasBranch: true,
    user: {
      id: '1',
      email: 'a@x.com',
      name: 'A',
      role: 'admin',
      userKind: 'bank',
      bankRole: 'admin',
    },
    offices: [],
    branches: [],
  } as any);
});

function withRoute(element: React.ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/protected" element={element} />
        <Route path="/login" element={<div>LOGIN</div>} />
        <Route path="/offices" element={<div>OFFICES</div>} />
        <Route path="/dashboard" element={<div>DASHBOARD</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute userKind gate', () => {
  it('renders children when userKind matches', () => {
    withRoute(
      <ProtectedRoute userKind="bank"><div>BANK ONLY</div></ProtectedRoute>,
    );
    expect(screen.getByText('BANK ONLY')).toBeInTheDocument();
  });

  it('redirects to /dashboard when userKind mismatches', () => {
    withRoute(
      <ProtectedRoute userKind="app"><div>APP ONLY</div></ProtectedRoute>,
    );
    expect(screen.queryByText('APP ONLY')).not.toBeInTheDocument();
    expect(screen.getByText('DASHBOARD')).toBeInTheDocument();
  });

  it('renders children when userKind not specified', () => {
    withRoute(
      <ProtectedRoute><div>ANY KIND</div></ProtectedRoute>,
    );
    expect(screen.getByText('ANY KIND')).toBeInTheDocument();
  });
});
