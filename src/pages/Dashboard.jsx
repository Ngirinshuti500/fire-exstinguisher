import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, logout } from '../lib/auth';

export default function Dashboard() {
  const user = getUser();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());

  const role = user?.role;

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const cards = useMemo(() => {
    const base = [
      { title: 'Extinguishers', desc: 'View tracked inventory', to: '/extinguishers', roles: ['Admin', 'Inspector', 'Auditor'] },
      { title: 'Alerts', desc: 'Open maintenance alerts', to: '/alerts', roles: ['Admin', 'Inspector', 'Auditor'] },
    ];

    if (role === 'Admin') {
      base.unshift({ title: 'Locations', desc: 'Manage building locations', to: '/locations', roles: ['Admin'] });
    }

    if (role === 'Admin' || role === 'Auditor') {
      base.push({ title: 'Maintenance', desc: 'Create maintenance records', to: '/maintenance', roles: ['Admin', 'Auditor'] });
    }

    if (role === 'Inspector') {
      base.push({ title: 'Inspection', desc: 'Submit routine inspection', to: '/inspections', roles: ['Inspector'] });
    }

    if (role === 'Admin') {
      base.push({ title: 'Inspection', desc: 'Submit routine inspection', to: '/inspections', roles: ['Admin'] });
    }

    return base;
  }, [role]);

  function onLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <div className="text-xl font-bold">Fire Extinguisher Management</div>
            <div className="text-sm text-gray-600">Welcome, {user?.full_name || 'User'} • {role}</div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-gray-600">{new Date(now).toLocaleString()}</div>
            <button onClick={onLogout} className="px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 font-semibold">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cards
            .filter((c) => c.roles.includes(role))
            .map((c) => (
              <button
                key={c.to}
                onClick={() => navigate(c.to)}
                className="text-left bg-white border rounded-xl p-5 hover:shadow-sm transition"
              >
                <div className="font-bold text-lg">{c.title}</div>
                <div className="text-sm text-gray-600 mt-1">{c.desc}</div>
              </button>
            ))}
        </div>

        {!cards.filter((c) => c.roles.includes(role)).length ? (
          <div className="mt-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded">
            No dashboard modules available for this role.
          </div>
        ) : null}
      </main>
    </div>
  );
}

