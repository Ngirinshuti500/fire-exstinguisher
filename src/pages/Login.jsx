import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { login as loginStore, getToken, getUser } from '../lib/auth';
import { setAuthToken } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/api/users/login', { email, password });
      loginStore({ token: res.data.token, user: res.data.user });
      setAuthToken(res.data.token);
      navigate('/');
    } catch (err) {
      setError(err?.response?.data?.error || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border rounded-xl shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-1">Fire Extinguisher Management</h1>
        <p className="text-gray-600 mb-5">Login to manage inspections and maintenance.</p>

        {error ? <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div> : null}

        <form onSubmit={onSubmit} className="space-y-3">
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

          <button
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2 rounded"
            type="submit"
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-sm text-gray-600">
          No account?{' '}
          <Link to="/register" className="text-green-700 font-semibold hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}

