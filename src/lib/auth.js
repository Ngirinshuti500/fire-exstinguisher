const TOKEN_KEY = 'fems_token';
const USER_KEY = 'fems_user';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);

    // Normalize role value to match what the frontend uses.
    // Expected frontend roles: Admin | Inspector | Auditor
    const role = parsed?.role;
    if (typeof role === 'string') {
      const normalized = role.trim().toLowerCase();
      const mapped =
        normalized === 'admin' ? 'Admin' :
        normalized === 'inspector' ? 'Inspector' :
        normalized === 'auditor' ? 'Auditor' :
        role;

      return { ...parsed, role: mapped };
    }

    return parsed;
  } catch {
    return null;
  }
}


export function login({ token, user }) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

