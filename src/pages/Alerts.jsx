import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function fetchAlerts() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/alerts');
      setAlerts(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">Alerts</h1>
        <p className="text-sm text-gray-600 mt-1">Open maintenance alerts generated from failed inspections.</p>

        {error ? <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">{error}</div> : null}

        <div className="mt-6 bg-white border rounded-xl p-4">
          {loading ? <div className="text-sm text-gray-600">Loading...</div> : null}

          {!loading ? (
            <div className="overflow-auto max-h-[640px]">
              <table className="min-w-full text-sm">
                <thead className="text-left text-gray-600">
                  <tr>
                    <th className="py-2 pr-3">Alert</th>
                    <th className="py-2 pr-3">Extinguisher</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2">Message</th>
                    <th className="py-2 pr-3">Triggered</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id} className="border-t align-top">
                      <td className="py-3 pr-3">{a.id}</td>
                      <td className="py-3 pr-3">
                        {a.serial_number ? (
                          <div>
                            <div className="font-semibold">{a.serial_number}</div>
                            <div className="text-gray-600">Extinguisher ID: {a.extinguisher_id}</div>
                          </div>
                        ) : (
                          <span>{a.extinguisher_id}</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">{a.alert_type}</td>
                      <td className="py-3">
                        <div className="text-gray-800">{a.message}</div>
                      </td>
                      <td className="py-3 pr-3">{a.triggered_at ? String(a.triggered_at).slice(0, 19).replace('T', ' ') : '-'}</td>
                    </tr>
                  ))}
                  {!alerts.length ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-gray-600">
                        No open alerts.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}

          <div className="mt-4 flex justify-end">
            <button onClick={fetchAlerts} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 font-semibold">Refresh</button>
          </div>
        </div>
      </div>
    </div>
  );
}

