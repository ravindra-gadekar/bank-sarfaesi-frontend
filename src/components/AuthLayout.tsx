import { Outlet } from 'react-router-dom';

function Mascot() {
  return (
    <svg width="140" height="140" viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Stylised shield / document mascot */}
      <path d="M70 15C40 15 20 45 20 75C20 105 45 130 70 130C95 130 120 105 120 75C120 45 100 15 70 15Z" fill="#B8C8E0" />
      <path d="M70 20C43 20 25 47 25 75C25 103 47 125 70 125C93 125 115 103 115 75C115 47 97 20 70 20Z" fill="#C8D6EA" />
      {/* Eyes */}
      <ellipse cx="52" cy="72" rx="8" ry="9" fill="white" />
      <ellipse cx="88" cy="72" rx="8" ry="9" fill="white" />
      <ellipse cx="52" cy="73" rx="4" ry="5" fill="#2A3A4A" />
      <ellipse cx="88" cy="73" rx="4" ry="5" fill="#2A3A4A" />
      {/* Smile */}
      <path d="M58 88C62 94 78 94 82 88" stroke="#2A3A4A" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Left panel — warm illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-sand-100 dark:bg-dark-surface flex-col items-center justify-center relative overflow-hidden">
        {/* Decorative gradient accent bar at the top */}
        <div className="absolute top-0 inset-x-0 h-56 bg-linear-to-b from-accent/20 to-transparent" />

        <div className="relative z-10 flex flex-col items-center px-12 text-center">
          <Mascot />
          <h2 className="mt-8 text-2xl font-bold text-ink dark:text-dark-text tracking-tight">
            Welcome back!
          </h2>
          <p className="mt-3 text-ink-secondary dark:text-dark-text-secondary max-w-xs leading-relaxed">
            Manage SARFAESI notices with confidence. Let's get you signed in.
          </p>
        </div>

        {/* Footer */}
        <p className="absolute bottom-6 text-xs text-ink-tertiary dark:text-dark-text-tertiary">
          © {new Date().getFullYear()} Bank SARFAESI
        </p>
      </div>

      {/* Right panel — form content */}
      <div className="flex flex-1 items-center justify-center bg-white dark:bg-dark-bg px-6 py-12">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
