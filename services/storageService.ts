import { UserProfile, TailoredApplication } from '../types';

const PROFILE_KEY = 'resumatch_profile';
const APPLICATIONS_KEY = 'resumatch_applications';

export const saveProfile = (profile: UserProfile): void => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const getProfile = (): UserProfile | null => {
  const data = localStorage.getItem(PROFILE_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveApplication = (app: TailoredApplication): void => {
  const apps = getApplications();
  const updatedApps = [app, ...apps.filter(a => a.id !== app.id)];
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(updatedApps));
};

export const getApplications = (): TailoredApplication[] => {
  const data = localStorage.getItem(APPLICATIONS_KEY);
  return data ? JSON.parse(data) : [];
};

export const deleteApplication = (id: string): void => {
  const apps = getApplications();
  const updatedApps = apps.filter(a => a.id !== id);
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(updatedApps));
};

export const getApplicationById = (id: string): TailoredApplication | undefined => {
  return getApplications().find(a => a.id === id);
};
