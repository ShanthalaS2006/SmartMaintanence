import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  AlertCircle,
  Bell,
  Flame,
  TrendingUp,
  LogOut,
  Plus,
  User,
} from 'lucide-react';
import { Dashboard } from './Dashboard';
import { IncidentList } from './IncidentList';
import { IncidentForm } from './IncidentForm';
import { IncidentDetail } from './IncidentDetail';
import { Heatmap } from './Heatmap';
import { Predictions } from './Predictions';
import { NotificationPanel } from './NotificationPanel';
import { Incident } from '../lib/supabase';

type View = 'dashboard' | 'incidents' | 'heatmap' | 'predictions';

export function MainLayout() {
  const { profile, signOut } = useAuth();
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [showIncidentForm, setShowIncidentForm] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleIncidentSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const navigationItems = [
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'incidents' as View, label: 'Incidents', icon: AlertCircle },
    { id: 'heatmap' as View, label: 'Hotspots', icon: Flame },
    { id: 'predictions' as View, label: 'Predictions', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <nav className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Smart Maintenance</h1>
                <p className="text-xs text-gray-500">Incident Tracking System</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowNotifications(true)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg">
                <User className="w-4 h-4 text-gray-600" />
                <div className="text-sm">
                  <div className="font-medium text-gray-900">{profile?.full_name}</div>
                  <div className="text-xs text-gray-500 capitalize">{profile?.role}</div>
                </div>
              </div>

              <button
                onClick={() => signOut()}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-4 sticky top-24">
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveView(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              {(profile?.role === 'student' || profile?.role === 'admin') && (
                <button
                  onClick={() => setShowIncidentForm(true)}
                  className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                  Report Incident
                </button>
              )}
            </div>
          </aside>

          <main className="flex-1 min-w-0">
            {activeView === 'dashboard' && <Dashboard />}

            {activeView === 'incidents' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Incident Tracking
                </h2>
                <IncidentList
                  onSelectIncident={setSelectedIncident}
                  refreshTrigger={refreshTrigger}
                />
              </div>
            )}

            {activeView === 'heatmap' && <Heatmap />}

            {activeView === 'predictions' && <Predictions />}
          </main>
        </div>
      </div>

      {showIncidentForm && (
        <IncidentForm
          onClose={() => setShowIncidentForm(false)}
          onSuccess={handleIncidentSuccess}
        />
      )}

      {selectedIncident && (
        <IncidentDetail
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onUpdate={handleIncidentSuccess}
        />
      )}

      {showNotifications && (
        <NotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </div>
  );
}
