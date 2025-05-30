import instance from './axiosInstance';

export const editUserInfo = (data: {
  username: string;
  email: string;
  phone?: string;
  major: string;
}) => instance.put('/auth/edit-info', data);

export const logout = () => instance.post('/auth/logout');

export const getUserInfo = () => instance.get('/auth/me');
