export interface User {
  username: string;
  email: string;
  phone?: string;
  major: string;
  companyName?: string;
  refreshToken?: string; // Added for easier frontend state management
  mustChangePassword?: boolean; // Added for easier frontend state management
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
