import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { getUser } from '../lib/auth';

export default function Maintenance() {
  const user = getUser();
  const technicianId = user?.id;

  const [extinguishers, setExtinguishers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    extinguisher_id: '',
    maintenance_type: 'Repair',
    service_provider: '',
    cost: '',
    details: '',
  });

  const maintenanceTypes = useMemo(() => ['Repair', 'Replacement', 'Service', 'Inspection Follow-up'], []);

  async function fetchExtinguishers() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/extinguishers');
      setExtinguishers(res.data || []);
      setForm((prev) => ({ ...prev, extinguisher_id: prev.extinguisher_id || String((res.data?.[0]?.id) ?? '') }));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load extinguishers');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExtinguishers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!technicianId) {
      setError('User ID not found in stored user. Please login again.');
      return;
    }

    try {
      await api.post('/api/maintenance', {
        extinguisher_id: Number(form.extinguisher_id),
        technician_id: Number(technicianId),
        maintenance_type: form.maintenance_type,
        service_provider: form.service_provider,
        cost: form.cost,
        details: form.details,
      });

      setSuccess('Maintenance saved. Alerts will be resolved by backend logic.');
      setForm((prev) => ({ ...prev, service_provider: '', cost: '', details: '' }));
      await fetchExtinguishers();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to create maintenance record');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">Maintenance</h1>
        <p className="text-sm text-gray-600 mt-1">Create maintenance records and automatically resolve related alerts.</p>

        {error ? <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">{error}</div> : null}
        {success ? <div className="mt-4 p-3 bg-green-50 text-green-800 rounded">{success}</div> : null}

        <div className="mt-6 bg-white border rounded-xl p-4">
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Extinguisher</label>
                <select
                  className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  value={form.extinguisher_id}
                  onChange={(e) => setForm({ ...form, extinguisher_id: e.target.value })}
                  required
                  disabled={loading}
                >
                  {extinguishers.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.serial_number} • {x.type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Maintenance Type</label>
                <select
                  className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  value={form.maintenance_type}
                  onChange={(e) => setForm({ ...form, maintenance_type: e.target.value })}
                >
                  {maintenanceTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Service Provider</label>
                <input
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={form.service_provider}
                  onChange={(e) => setForm({ ...form, service_provider: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Cost</label>
                <input
                  className="mt-1 w-full border rounded px-3 py-2"
                  value={form.cost}
                  onChange={(e) => setForm({ ...form, cost: e.target.value })}
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Details</label>
              <textarea
                className="mt-1 w-full border rounded px-3 py-2"
                rows={4}
                value={form.details}
                onChange={(e) => setForm({ ...form, details: e.target.value })}
                placeholder="Describe work performed, parts replaced, notes..."
                required
              />
            </div>

            <button disabled={loading} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 rounded">
              {loading ? 'Loading...' : 'Create Maintenance Record'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

