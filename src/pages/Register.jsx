import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { login as loginStore, logout } from '../lib/auth';
import { setAuthToken } from '../lib/api';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Inspector');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post('/api/users/register', {
        full_name: fullName,
        email,
        password,
        role,
      });

      // Auto-login after registration
      const res = await api.post('/api/users/login', { email, password });

      // Store auth from backend response
      loginStore({ token: res.data.token, user: res.data.user });
      setAuthToken(res.data.token);

      // Make sure role exists; otherwise ProtectedRoute will redirect away from dashboard
      if (!res.data?.user?.role) {
        throw new Error('Login ok but user.role missing. Check DB role values match: Admin/Inspector/Auditor');
      }

      navigate('/');
    } catch (err) {
      // If someone previously logged in, clear local state on failure
      logout();
      setError(err?.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-1">Create Account</h1>
        <p className="text-gray-600 mb-5">Register to manage extinguisher records.</p>

        {error ? <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div> : null}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <select
              className="mt-1 w-full border rounded px-3 py-2 bg-white"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="Admin">Admin</option>
              <option value="Inspector">Inspector</option>
              <option value="Auditor">Auditor</option>
            </select>
          </div>

          <button
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 rounded"
            type="submit"
          >
            {loading ? 'Creating...' : 'Register'}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-green-700 font-semibold hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

