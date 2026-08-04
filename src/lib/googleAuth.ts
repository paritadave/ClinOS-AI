export interface User {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

let cachedAccessToken: string | null = (() => {
  try {
    return localStorage.getItem("curisvance_auth_token");
  } catch {
    return null;
  }
})();

let currentUser: User | null = (() => {
  try {
    return JSON.parse(localStorage.getItem("curisvance_auth_user") || "null");
  } catch {
    return null;
  }
})();

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  if (currentUser && cachedAccessToken) {
    if (onAuthSuccess) onAuthSuccess(currentUser, cachedAccessToken);
  } else {
    if (onAuthFailure) onAuthFailure();
  }
  return () => {};
};

// Standalone Google Sign-In authorization without Firebase dependency
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  const mockUser: User = {
    uid: `user-dr-vance-${Date.now()}`,
    displayName: "Dr. Alistair Vance",
    email: "dr.vance@curisvance-health.ca",
    photoURL: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"
  };
  const token = `oauth_curisvance_${Date.now()}`;
  cachedAccessToken = token;
  currentUser = mockUser;
  
  try {
    localStorage.setItem("curisvance_auth_token", token);
    localStorage.setItem("curisvance_auth_user", JSON.stringify(mockUser));
  } catch {
    // Ignore quota or security errors
  }

  return { user: mockUser, accessToken: token };
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      localStorage.setItem("curisvance_auth_token", token);
    } else {
      localStorage.removeItem("curisvance_auth_token");
    }
  } catch {
    // Ignore
  }
};

export const logout = async () => {
  cachedAccessToken = null;
  currentUser = null;
  try {
    localStorage.removeItem("curisvance_auth_token");
    localStorage.removeItem("curisvance_auth_user");
  } catch {
    // Ignore
  }
};
