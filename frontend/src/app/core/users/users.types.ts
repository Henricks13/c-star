export interface UserListItem {
  id: string;
  fullName: string;
  email: string;
  enabled: boolean;
  roles: string[];
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
  roleCode: string;
}

export interface UpdateUserRequest {
  fullName: string;
  email: string;
  roleCode: string;
  enabled?: boolean;
}

export interface UpdateUserPasswordRequest {
  password: string;
}
