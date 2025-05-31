export interface User {
  username: string;
  email: string;
  phone?: string;
  major: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
