import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';
import { getUser } from '../lib/auth';

export default function Inspections() {
  const user = getUser();
  const inspectorId = user?.id;

  const [extinguishers, setExtinguishers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    extinguisher_id: '',
    pressure_gauge: 'Normal',
    nozzle_and_hose: 'Good',
    tamper_seal_intact: 1,
    physical_signs_rust_dent: 0,
    is_obstructed: 0,
    signage_visible: 1,
    comments: '',
  });

  const statusOptions = useMemo(
    () => ({
      tamper: [
        { label: 'Yes (1)', value: 1 },
        { label: 'No (0)', value: 0 },
      ],
      rust: [
        { label: 'No (0)', value: 0 },
        { label: 'Yes (1)', value: 1 },
      ],
      obstructed: [
        { label: 'No (0)', value: 0 },
        { label: 'Yes (1)', value: 1 },
      ],
      signage: [
        { label: 'Visible (1)', value: 1 },
        { label: 'Not visible (0)', value: 0 },
      ],
    }),
    []
  );

  async function fetchExtinguishers() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/extinguishers');
      setExtinguishers(res.data || []);
      // Default selection if none chosen yet
      setForm((prev) => ({
        ...prev,
        extinguisher_id: prev.extinguisher_id || String((res.data?.[0]?.id) ?? ''),
      }));
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
    setMessage('');

    if (!inspectorId) {
      setError('Inspector ID not found in stored user. Please login again.');
      return;
    }

    try {
      const res = await api.post('/api/inspections', {
        extinguisher_id: Number(form.extinguisher_id),
        inspector_id: Number(inspectorId),
        pressure_gauge: form.pressure_gauge,
        nozzle_and_hose: form.nozzle_and_hose,
        tamper_seal_intact: Number(form.tamper_seal_intact),
        physical_signs_rust_dent: Number(form.physical_signs_rust_dent),
        is_obstructed: Number(form.is_obstructed),
        signage_visible: Number(form.signage_visible),
        comments: form.comments,
      });

      setMessage(`${res.data?.passed ? '✅ Passed' : '❌ Failed'} — ${res.data?.message || 'Inspection submitted'}`);
      await fetchExtinguishers();
      setForm((prev) => ({ ...prev, comments: '' }));
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to submit inspection');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">Routine Inspection</h1>
        <p className="text-sm text-gray-600 mt-1">Submit inspection findings; backend will auto-update extinguisher status and alerts.</p>

        {error ? <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">{error}</div> : null}
        {message ? <div className="mt-4 p-3 bg-green-50 text-green-800 rounded">{message}</div> : null}

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
                >
                  {extinguishers.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.serial_number} • {x.type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Pressure Gauge</label>
                <select
                  className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  value={form.pressure_gauge}
                  onChange={(e) => setForm({ ...form, pressure_gauge: e.target.value })}
                >
                  <option value="Normal">Normal</option>
                  <option value="Abnormal">Abnormal</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nozzle & Hose</label>
                <select
                  className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  value={form.nozzle_and_hose}
                  onChange={(e) => setForm({ ...form, nozzle_and_hose: e.target.value })}
                >
                  <option value="Good">Good</option>
                  <option value="Bad">Bad</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Tamper Seal Intact</label>
                <select
                  className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  value={form.tamper_seal_intact}
                  onChange={(e) => setForm({ ...form, tamper_seal_intact: Number(e.target.value) })}
                >
                  {statusOptions.tamper.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Physical Signs (Rust/Dent)</label>
                <select
                  className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  value={form.physical_signs_rust_dent}
                  onChange={(e) => setForm({ ...form, physical_signs_rust_dent: Number(e.target.value) })}
                >
                  {statusOptions.rust.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Is Obstructed</label>
                <select
                  className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  value={form.is_obstructed}
                  onChange={(e) => setForm({ ...form, is_obstructed: Number(e.target.value) })}
                >
                  {statusOptions.obstructed.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Signage Visible</label>
                <select
                  className="mt-1 w-full border rounded px-3 py-2 bg-white"
                  value={form.signage_visible}
                  onChange={(e) => setForm({ ...form, signage_visible: Number(e.target.value) })}
                >
                  {statusOptions.signage.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Inspector</label>
                <input className="mt-1 w-full border rounded px-3 py-2 bg-gray-50" value={user?.full_name || ''} readOnly />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Comments</label>
              <textarea
                className="mt-1 w-full border rounded px-3 py-2"
                rows={3}
                value={form.comments}
                onChange={(e) => setForm({ ...form, comments: e.target.value })}
                placeholder="Add notes, observations, or failure reason"
              />
            </div>

            <button disabled={loading} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 rounded">
              {loading ? 'Submitting...' : 'Submit Inspection'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

