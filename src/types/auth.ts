export interface AuthUser {
  id: string;
  username: string;
  status: string;
  roleId: string | null;
  organizationId: string | null;
  role?: {
    id: string;
    name: string;
    level: number;
  };
  organization?: {
    id: string;
    name: string;
    code: string;
  };
  profile?: {
    id: string;
    name: string | null;
    joinDate: Date | null;
  };
}

export interface RegisterRequest {
  username: string;
  password: string;
  roleId?: string;      
  organizationId?: string; 
  departmentId?: string;  
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