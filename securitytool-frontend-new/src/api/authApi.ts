import instance from './axiosInstance';

export const login = (username: string, password: string) =>
  instance.post('/auth/login', { username, password });

export const register = (data: {
  username: string;
  password: string;
  email: string;
  phone?: string;
  major: string;
}) => instance.post('/auth/register', data);

export const resetPassword = (email: string) =>
  instance.post('/auth/reset-password', { email });

export const setNewPassword = (token: string, password: string) =>
  instance.post('/auth/set-new-password', { token, password });
