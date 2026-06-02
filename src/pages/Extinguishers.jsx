import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

export default function Extinguishers() {
  const [extinguishers, setExtinguishers] = useState([]);
  const [locations, setLocations] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    serial_number: '',
    type: 'ABC',
    capacity_kg: '',
    location_id: '',
    manufacture_date: '',
    next_service_date: '',
    hydrostatic_test_due: '',
    status: 'Active'
  });

  function resetForm() {
    setForm({
      serial_number: '',
      type: 'ABC',
      capacity_kg: '',
      location_id: String((locations?.[0]?.id) ?? ''),
      manufacture_date: '',
      next_service_date: '',
      hydrostatic_test_due: '',
      status: 'Active'
    });
    setEditingId(null);
  }

  async function fetchAll() {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.all([
        api.get('/api/extinguishers'),
        api.get('/api/locations'),
      ]);
      const eRes = results?.[0];
      const lRes = results?.[1];

      setExtinguishers(eRes.data || []);
      setLocations(lRes.data || []);

      setForm((prev) => ({
        ...prev,
        location_id: prev.location_id || String((lRes.data?.[0]?.id) ?? ''),
      }));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load extinguisher data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addAllowed = true; // client-side only; real enforcement is server-side in future.

  async function onSave(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        serial_number: form.serial_number,
        type: form.type,
        capacity_kg: form.capacity_kg,
        location_id: form.location_id ? Number(form.location_id) : null,
        manufacture_date: form.manufacture_date,
        next_service_date: form.next_service_date,
        hydrostatic_test_due: form.hydrostatic_test_due,
        status: form.status
      };

      if (editingId) {
        await api.put(`/api/extinguishers/${editingId}`, payload);
      } else {
        await api.post('/api/extinguishers', payload);
      }

      resetForm();
      await fetchAll();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to save extinguisher');
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Are you sure you want to delete this extinguisher? All related logs will be removed.')) return;
    try {
      await api.delete(`/api/extinguishers/${id}`);
      await fetchAll();
    } catch (err) {
      setError('Failed to delete record');
    }
  }

  function startEdit(ext) {
    setEditingId(ext.id);
    setForm({
      serial_number: ext.serial_number,
      type: ext.type,
      capacity_kg: ext.capacity_kg,
      location_id: String(ext.location_id || ''),
      manufacture_date: ext.manufacture_date ? ext.manufacture_date.slice(0, 10) : '',
      next_service_date: ext.next_service_date ? ext.next_service_date.slice(0, 10) : '',
      hydrostatic_test_due: ext.hydrostatic_test_due ? ext.hydrostatic_test_due.slice(0, 10) : '',
      status: ext.status
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">Extinguishers</h1>
        <p className="text-sm text-gray-600 mt-1">Inventory of all managed fire extinguishers.</p>

        {error ? <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">{error}</div> : null}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-bold mb-3">{editingId ? 'Edit Extinguisher' : 'Add Extinguisher'}</h2>
            {!addAllowed ? (
              <div className="text-sm text-gray-600">You do not have permission to add extinguishers.</div>
            ) : (
              <form onSubmit={onSave} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Serial Number</label>
                  <input className="mt-1 w-full border rounded px-3 py-2" value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} required />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <input className="mt-1 w-full border rounded px-3 py-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Capacity (kg)</label>
                    <input className="mt-1 w-full border rounded px-3 py-2" value={form.capacity_kg} onChange={(e) => setForm({ ...form, capacity_kg: e.target.value })} required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <select
                    className="mt-1 w-full border rounded px-3 py-2 bg-white"
                    value={form.location_id}
                    onChange={(e) => setForm({ ...form, location_id: e.target.value })}
                  >
                    {locations.map((l) => (
                      <option key={l.id} value={l.id}>
                        {l.building_name} • {l.floor} • {l.specific_zone}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    className="mt-1 w-full border rounded px-3 py-2 bg-white"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="Active">Active</option>
                    <option value="Under Maintenance">Under Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Manufacture Date</label>
                    <input type="date" className="mt-1 w-full border rounded px-3 py-2" value={form.manufacture_date} onChange={(e) => setForm({ ...form, manufacture_date: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Next Service Date</label>
                    <input type="date" className="mt-1 w-full border rounded px-3 py-2" value={form.next_service_date} onChange={(e) => setForm({ ...form, next_service_date: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Hydrostatic Test Due</label>
                  <input type="date" className="mt-1 w-full border rounded px-3 py-2" value={form.hydrostatic_test_due} onChange={(e) => setForm({ ...form, hydrostatic_test_due: e.target.value })} />
                </div>

                <div className="flex gap-2">
                  <button disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 rounded">
                    {loading ? 'Saving...' : editingId ? 'Update Record' : 'Add Extinguisher'}
                  </button>
                  {editingId && (
                    <button type="button" onClick={resetForm} className="px-4 py-2 border rounded font-semibold">Cancel</button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-bold mb-3">Inventory</h2>
            {loading ? <div className="text-sm text-gray-600">Loading...</div> : null}
            {!loading ? (
              <div className="overflow-auto max-h-[520px]">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-600">
                    <tr>
                      <th className="py-2 pr-3">Serial</th>
                      <th className="py-2 pr-3">Type</th>
                      <th className="py-2 pr-3">Capacity</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 pr-3">Next Service</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extinguishers.map((e) => (
                      <tr key={e.id} className="border-t">
                        <td className="py-2 pr-3 font-medium">{e.serial_number}</td>
                        <td className="py-2 pr-3">{e.type}</td>
                        <td className="py-2 pr-3">{e.capacity_kg}</td>
                        <td className="py-2 pr-3">{e.status}</td>
                        <td className="py-2 pr-3">{e.next_service_date ? String(e.next_service_date).slice(0,10) : '-'}</td>
                        <td className="py-2 text-right space-x-2">
                          <button onClick={() => startEdit(e)} className="text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => onDelete(e.id)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {!extinguishers.length ? (
                      <tr>
                        <td colSpan={6} className="py-6 text-gray-600">No extinguishers found.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
