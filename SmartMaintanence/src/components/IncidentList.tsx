import { useEffect, useState } from 'react';
import { supabase, Incident } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Clock, MapPin, AlertCircle, CheckCircle, XCircle, Circle } from 'lucide-react';

const statusConfig = {
  reported: { color: 'bg-yellow-100 text-yellow-800', icon: Circle, label: 'Reported' },
  assigned: { color: 'bg-blue-100 text-blue-800', icon: Clock, label: 'Assigned' },
  in_progress: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'In Progress' },
  resolved: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Resolved' },
  closed: { color: 'bg-gray-100 text-gray-800', icon: XCircle, label: 'Closed' },
};

const categoryColors = {
  electricity: 'bg-yellow-500',
  water: 'bg-blue-500',
  internet: 'bg-green-500',
  hostel: 'bg-red-500',
  equipment: 'bg-gray-500',
};

const priorityColors = {
  low: 'border-green-300',
  medium: 'border-yellow-300',
  high: 'border-orange-300',
  critical: 'border-red-500',
};

interface IncidentListProps {
  onSelectIncident: (incident: Incident) => void;
  refreshTrigger?: number;
}

export function IncidentList({ onSelectIncident, refreshTrigger }: IncidentListProps) {
  const { user, profile } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'my' | 'active'>('all');

  useEffect(() => {
    fetchIncidents();
  }, [user, filter, refreshTrigger]);

  const fetchIncidents = async () => {
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('incidents')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter === 'my') {
        query = query.eq('reported_by', user.id);
      } else if (filter === 'active') {
        query = query.in('status', ['reported', 'assigned', 'in_progress']);
      }

      const { data, error } = await query;

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading incidents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {profile?.role === 'student' && (
          <button
            onClick={() => setFilter('my')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'my'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            My Incidents
          </button>
        )}
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            filter === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active
        </button>
      </div>

      {incidents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No incidents found
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => {
            const StatusIcon = statusConfig[incident.status].icon;
            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className={`bg-white rounded-lg border-l-4 ${priorityColors[incident.priority]} p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                      <span
                        className={`w-3 h-3 rounded-full ${categoryColors[incident.category]}`}
                      />
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {incident.description}
                    </p>
                  </div>
                  <span
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusConfig[incident.status].color}`}
                  >
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig[incident.status].label}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 mt-3">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {incident.building} {incident.floor && `- ${incident.floor}`}
                    </span>
                    <span className="capitalize">{incident.category}</span>
                    <span className="uppercase font-medium">{incident.priority}</span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(incident.created_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
