import { useState } from 'react';
import { supabase, Incident, IncidentStatus } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { X, Calendar, MapPin, User, Clock, AlertCircle } from 'lucide-react';

interface IncidentDetailProps {
  incident: Incident;
  onClose: () => void;
  onUpdate: () => void;
}

export function IncidentDetail({ incident, onClose, onUpdate }: IncidentDetailProps) {
  const { profile } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<IncidentStatus>(incident.status);

  const canUpdateStatus = profile?.role === 'admin' || profile?.role === 'technician';

  const handleStatusUpdate = async () => {
    if (!canUpdateStatus || newStatus === incident.status) return;

    setUpdating(true);
    try {
      const updates: Record<string, unknown> = { status: newStatus };

      if (newStatus === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      } else if (newStatus === 'closed') {
        updates.closed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('incidents')
        .update(updates)
        .eq('id', incident.id);

      if (error) throw error;
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating incident:', error);
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSLAStatus = () => {
    const deadline = new Date(incident.sla_deadline);
    const now = new Date();
    const hoursLeft = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (incident.status === 'resolved' || incident.status === 'closed') {
      return { text: 'Completed', color: 'text-green-600' };
    }

    if (hoursLeft < 0) {
      return { text: 'Overdue', color: 'text-red-600' };
    } else if (hoursLeft < 2) {
      return { text: `${Math.round(hoursLeft * 60)} mins left`, color: 'text-orange-600' };
    } else {
      return { text: `${Math.round(hoursLeft)}h left`, color: 'text-blue-600' };
    }
  };

  const slaStatus = getSLAStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Incident Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {incident.title}
                </h3>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                    {incident.category}
                  </span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium uppercase">
                    {incident.priority}
                  </span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium capitalize">
                    {incident.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700">{incident.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Location</div>
                  <div className="text-gray-900">{incident.location}</div>
                  <div className="text-sm text-gray-600">
                    {incident.building}
                    {incident.floor && `, Floor ${incident.floor}`}
                    {incident.room && `, Room ${incident.room}`}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500">Reported On</div>
                  <div className="text-gray-900">{formatDate(incident.created_at)}</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-gray-500">SLA Deadline</div>
                  <div className="text-gray-900">{formatDate(incident.sla_deadline)}</div>
                  <div className={`text-sm font-medium ${slaStatus.color}`}>
                    {slaStatus.text}
                  </div>
                </div>
              </div>

              {incident.resolved_at && (
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-green-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-gray-500">Resolved On</div>
                    <div className="text-gray-900">{formatDate(incident.resolved_at)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {canUpdateStatus && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-3">Update Status</h4>
              <div className="flex items-center gap-3">
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as IncidentStatus)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="reported">Reported</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  onClick={handleStatusUpdate}
                  disabled={updating || newStatus === incident.status}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
