import instance from './axiosInstance';
import { User, ChangePasswordRequest } from '../types/user';

export const editUserInfo = (data: User) => instance.put('/auth/edit-info', data);

export const logout = () => instance.post('/auth/logout');

export const getUserInfo = () => instance.get('/auth/me');

export const changePassword = (data: ChangePasswordRequest) =>
  instance.put('/auth/change-password', data);
