import { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Locations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [buildingName, setBuildingName] = useState('');
  const [floor, setFloor] = useState('');
  const [specificZone, setSpecificZone] = useState('');
  const [editingId, setEditingId] = useState(null);

  function resetForm() {
    setBuildingName('');
    setFloor('');
    setSpecificZone('');
    setEditingId(null);
  }

  async function fetchLocations() {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/locations');
      setLocations(res.data || []);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Failed to load locations');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSave(e) {
    e.preventDefault();
    setError('');
    try {
      const payload = {
        building_name: buildingName,
        floor,
        specific_zone: specificZone,
      };

      if (editingId) {
        await api.put(`/api/locations/${editingId}`, payload);
      } else {
        await api.post('/api/locations', payload);
      }

      resetForm();
      await fetchLocations();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Failed to save location');
    }
  }

  async function onDelete(id) {
    if (!window.confirm('Are you sure you want to delete this location?')) return;
    try {
      await api.delete(`/api/locations/${id}`);
      await fetchLocations();
    } catch (err) {
      setError('Failed to delete location');
    }
  }

  function startEdit(loc) {
    setEditingId(loc.id);
    setBuildingName(loc.building_name);
    setFloor(loc.floor);
    setSpecificZone(loc.specific_zone);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">Locations</h1>
        <p className="text-sm text-gray-600 mt-1">Add and manage building/floor/zone mapping.</p>

        {error ? <div className="mt-4 p-3 bg-red-50 text-red-700 rounded">{error}</div> : null}

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-bold mb-3">{editingId ? 'Edit Location' : 'Add Location'}</h2>
            <form onSubmit={onSave} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Building Name</label>
                <input className="mt-1 w-full border rounded px-3 py-2" value={buildingName} onChange={(e) => setBuildingName(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Floor</label>
                <input className="mt-1 w-full border rounded px-3 py-2" value={floor} onChange={(e) => setFloor(e.target.value)} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Specific Zone</label>
                <input className="mt-1 w-full border rounded px-3 py-2" value={specificZone} onChange={(e) => setSpecificZone(e.target.value)} required />
              </div>
              <div className="flex gap-2">
                <button disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 rounded">
                  {loading ? 'Working...' : editingId ? 'Update Location' : 'Add Location'}
                </button>
                {editingId && (
                  <button type="button" onClick={resetForm} className="px-4 py-2 border rounded font-semibold">Cancel</button>
                )}
              </div>
            </form>
          </div>

          <div className="bg-white border rounded-xl p-4">
            <h2 className="font-bold mb-3">Existing Locations</h2>
            {loading ? <div className="text-sm text-gray-600">Loading...</div> : null}
            {!loading ? (
              <div className="overflow-auto max-h-[520px]">
                <table className="min-w-full text-sm">
                  <thead className="text-left text-gray-600">
                    <tr>
                      <th className="py-2 pr-3">ID</th>
                      <th className="py-2 pr-3">Building</th>
                      <th className="py-2 pr-3">Floor</th>
                      <th className="py-2 pr-3">Zone</th>
                      <th className="py-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {locations.map((l) => (
                      <tr key={l.id} className="border-t">
                        <td className="py-2 pr-3">{l.id}</td>
                        <td className="py-2 pr-3">{l.building_name}</td>
                        <td className="py-2 pr-3">{l.floor}</td>
                        <td className="py-2 pr-3">{l.specific_zone}</td>
                        <td className="py-2 text-right space-x-2">
                          <button onClick={() => startEdit(l)} className="text-blue-600 hover:underline">Edit</button>
                          <button onClick={() => onDelete(l.id)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {!locations.length ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-gray-600">No locations found.</td>
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
