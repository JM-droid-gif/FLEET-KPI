import { useApp } from './context/AppContext';
import { Login } from './components/Login';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { VehicleModal } from './components/VehicleModal';
import { EntryModal } from './components/EntryModal';
import { UserModal } from './components/UserModal';
import { Dashboard } from './pages/Dashboard';
import { StoreDirectory } from './pages/StoreDirectory';
import { StoreSummary } from './pages/StoreSummary';
import { UsersPage } from './pages/UsersPage';
import { VehiclePage } from './pages/VehiclePage';

function ModalHost() {
  const { modal } = useApp();
  if (modal.type === 'vehicle-add' || modal.type === 'vehicle-edit') return <VehicleModal />;
  if (modal.type === 'entry') return <EntryModal />;
  if (modal.type === 'user-add' || modal.type === 'user-edit') return <UserModal />;
  return null;
}

function PageHost() {
  const { page } = useApp();
  switch (page) {
    case 'vehicle':
      return <VehiclePage />;
    case 'stores':
      return <StoreDirectory />;
    case 'store-summary':
      return <StoreSummary />;
    case 'users':
      return <UsersPage />;
    default:
      return <Dashboard />;
  }
}

export default function App() {
  const { ready, currentUser, sidebarCollapsed } = useApp();

  if (!ready) {
    return <div className="loading-msg">Loading manifest…</div>;
  }

  if (!currentUser) {
    return (
      <>
        <Login />
        <ModalHost />
      </>
    );
  }

  return (
    <>
      <div className={`app-shell ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <Sidebar />
        <div className="main-area">
          <Topbar />
          <main className="main-content">
            <PageHost />
          </main>
        </div>
      </div>
      <ModalHost />
    </>
  );
}
