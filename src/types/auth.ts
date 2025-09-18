export interface AuthUser {
  id: string;
  username: string;
  displayName: string;
  status: string;
  roleId: string | null;
  role?: {
    id: string;
    name: string;
    level: number;
  };
}

export interface RegisterRequest {
  username: string;
  password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

// Extend Express Request to include user
declare global {
  namespace Express {
    interface User extends AuthUser {}
    interface Request {
      resource?: any; // For storing pre-fetched resources
    }
  }
}
