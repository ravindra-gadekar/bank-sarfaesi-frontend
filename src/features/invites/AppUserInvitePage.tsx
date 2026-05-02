import { useNavigate } from 'react-router-dom';
import AppUserInviteModal from './AppUserInviteModal';

export default function AppUserInvitePage() {
  const navigate = useNavigate();
  return (
    <AppUserInviteModal
      onClose={() => navigate(-1)}
      onSuccess={() => {
        // no-op; modal self-closes after success
      }}
    />
  );
}
