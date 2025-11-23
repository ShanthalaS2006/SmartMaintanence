import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Flame } from 'lucide-react';

interface HotspotData {
  location: string;
  building: string;
  count: number;
  category: string;
}

export function Heatmap() {
  const [hotspots, setHotspots] = useState<HotspotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchHotspots();
  }, [selectedCategory]);

  const fetchHotspots = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('incidents')
        .select('location, building, category')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      const locationMap = new Map<string, HotspotData>();

      data?.forEach((incident) => {
        const key = `${incident.building}-${incident.location}`;
        const existing = locationMap.get(key);

        if (existing) {
          existing.count += 1;
        } else {
          locationMap.set(key, {
            location: incident.location,
            building: incident.building,
            count: 1,
            category: incident.category,
          });
        }
      });

      const sorted = Array.from(locationMap.values()).sort((a, b) => b.count - a.count);
      setHotspots(sorted);
    } catch (error) {
      console.error('Error fetching hotspots:', error);
    } finally {
      setLoading(false);
    }
  };

  const getIntensityColor = (count: number, maxCount: number) => {
    const intensity = count / maxCount;
    if (intensity > 0.7) return 'bg-red-500';
    if (intensity > 0.5) return 'bg-orange-500';
    if (intensity > 0.3) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const maxCount = Math.max(...hotspots.map((h) => h.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading heatmap...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Flame className="w-6 h-6 text-orange-500" />
          Issue Hotspots (Last 30 Days)
        </h3>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Categories</option>
          <option value="electricity">Electricity</option>
          <option value="water">Water</option>
          <option value="internet">Internet</option>
          <option value="hostel">Hostel</option>
          <option value="equipment">Equipment</option>
        </select>
      </div>

      {hotspots.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No hotspot data available
        </div>
      ) : (
        <div className="space-y-3">
          {hotspots.slice(0, 10).map((hotspot, index) => (
            <div
              key={index}
              className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-white shadow-sm">
                <span className="text-lg font-bold text-gray-700">#{index + 1}</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{hotspot.location}</h4>
                  <span className="text-sm text-gray-500">({hotspot.building})</span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full ${getIntensityColor(hotspot.count, maxCount)} transition-all duration-500`}
                    style={{ width: `${(hotspot.count / maxCount) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex-shrink-0 text-right">
                <div className="text-2xl font-bold text-gray-900">{hotspot.count}</div>
                <div className="text-xs text-gray-500">incidents</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 pt-6 border-t">
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded" />
            <span className="text-gray-600">Low</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <span className="text-gray-600">Medium</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded" />
            <span className="text-gray-600">High</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <span className="text-gray-600">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
}
