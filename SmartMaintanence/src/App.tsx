import { LoginForm } from "./components/LoginForm";

function AppContent() {
  console.log('AppContent rendering');
  return (
    <div>
      <h1 style={{ padding: 20, textAlign: 'center' }}>App loaded — Login below</h1>
      <LoginForm />
    </div>
  );
}

export default AppContent;
