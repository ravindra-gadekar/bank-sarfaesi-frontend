import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Layout from '../Layout';
import { useAuthStore } from '../../store/authStore';

function renderAt(userKind: 'app' | 'bank', officeType?: 'HO' | 'Zonal' | 'Regional' | 'Branch') {
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
      officeType,
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

describe('Layout sidebar — officeType dispatch', () => {
  beforeEach(() => {
    useAuthStore.setState({
      isAuthenticated: false,
      hasOffice: false,
      hasBranch: false,
      user: null,
    } as never);
  });

  it('HO bank user sees "Bank Tree" not "Cases"', () => {
    renderAt('bank', 'HO');
    expect(screen.getByText(/bank tree/i)).toBeInTheDocument();
    expect(screen.queryByText(/^cases$/i)).not.toBeInTheDocument();
  });

  it('Zonal bank user sees "Zone Tree" not "Cases"', () => {
    renderAt('bank', 'Zonal');
    expect(screen.getByText(/zone tree/i)).toBeInTheDocument();
    expect(screen.queryByText(/^cases$/i)).not.toBeInTheDocument();
  });

  it('Regional bank user sees "Region Tree" not "Cases"', () => {
    renderAt('bank', 'Regional');
    expect(screen.getByText(/region tree/i)).toBeInTheDocument();
    expect(screen.queryByText(/^cases$/i)).not.toBeInTheDocument();
  });

  it('Branch bank user sees "Cases" and "Notices"', () => {
    renderAt('bank', 'Branch');
    expect(screen.getByText(/^cases$/i)).toBeInTheDocument();
    expect(screen.getByText(/^notices$/i)).toBeInTheDocument();
    expect(screen.queryByText(/bank tree/i)).not.toBeInTheDocument();
  });

  it('App user sees "Banks" not "Cases"', () => {
    renderAt('app');
    expect(screen.getByText(/^banks$/i)).toBeInTheDocument();
    expect(screen.queryByText(/^cases$/i)).not.toBeInTheDocument();
  });
});
