import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
} from 'lucide-react';

interface Stats {
  total: number;
  active: number;
  resolved: number;
  overdue: number;
  avgResolutionTime: number;
}

interface CategoryStats {
  category: string;
  count: number;
}

export function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    active: 0,
    resolved: 0,
    overdue: 0,
    avgResolutionTime: 0,
  });
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchCategoryStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: allIncidents, error } = await supabase
        .from('incidents')
        .select('*');

      if (error) throw error;

      const now = new Date();
      const active = allIncidents?.filter((i) =>
        ['reported', 'assigned', 'in_progress'].includes(i.status)
      ).length || 0;

      const resolved = allIncidents?.filter((i) => i.status === 'resolved').length || 0;

      const overdue = allIncidents?.filter((i) => {
        if (['resolved', 'closed'].includes(i.status)) return false;
        return new Date(i.sla_deadline) < now;
      }).length || 0;

      const resolvedIncidents = allIncidents?.filter(
        (i) => i.resolved_at && i.created_at
      ) || [];

      let avgResolutionTime = 0;
      if (resolvedIncidents.length > 0) {
        const totalTime = resolvedIncidents.reduce((acc, i) => {
          const created = new Date(i.created_at).getTime();
          const resolved = new Date(i.resolved_at).getTime();
          return acc + (resolved - created);
        }, 0);
        avgResolutionTime = totalTime / resolvedIncidents.length / (1000 * 60 * 60);
      }

      setStats({
        total: allIncidents?.length || 0,
        active,
        resolved,
        overdue,
        avgResolutionTime: Math.round(avgResolutionTime),
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryStats = async () => {
    try {
      const { data, error } = await supabase
        .from('incidents')
        .select('category')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const categoryMap = new Map<string, number>();
      data?.forEach((incident) => {
        const count = categoryMap.get(incident.category) || 0;
        categoryMap.set(incident.category, count + 1);
      });

      const sorted = Array.from(categoryMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      setCategoryStats(sorted);
    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  };

  const statCards = [
    {
      title: 'Total Incidents',
      value: stats.total,
      icon: Activity,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active',
      value: stats.active,
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Overdue',
      value: stats.overdue,
      icon: AlertTriangle,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Category Breakdown (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {categoryStats.map((stat) => {
              const total = categoryStats.reduce((acc, s) => acc + s.count, 0);
              const percentage = (stat.count / total) * 100;

              return (
                <div key={stat.category}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700 capitalize">
                      {stat.category}
                    </span>
                    <span className="text-sm text-gray-600">
                      {stat.count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-orange-600" />
            Performance Metrics
          </h3>
          <div className="space-y-6">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">
                Average Resolution Time
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.avgResolutionTime}h
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Time from report to resolution
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-600 mb-2">
                Resolution Rate
              </div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.total > 0
                  ? Math.round((stats.resolved / stats.total) * 100)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Percentage of resolved incidents
              </div>
            </div>

            {profile?.role === 'admin' && (
              <div className="pt-4 border-t">
                <div className="text-sm text-gray-600">
                  System operating at{' '}
                  <span className="font-bold text-green-600">
                    {stats.overdue === 0 ? '100' : Math.max(0, 100 - (stats.overdue / stats.active) * 100).toFixed(0)}%
                  </span>{' '}
                  efficiency
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
