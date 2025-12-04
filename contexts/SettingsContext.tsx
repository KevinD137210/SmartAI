import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile } from '../types';

interface SettingsContextType {
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => void;
}

const defaultProfile: UserProfile = {
  companyName: 'SmartQxAI',
  contactName: 'Admin User',
  address: '123 Tech Street, Silicon Valley, CA',
  email: 'contact@smartqx.ai',
  phone: '+1 234 567 890',
  taxId: '',
  depositPercentage: 30,
  secondPaymentPercentage: 70
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('userProfile');
    return saved ? JSON.parse(saved) : defaultProfile;
  });

  useEffect(() => {
    localStorage.setItem('userProfile', JSON.stringify(profile));
  }, [profile]);

  const updateProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
  };

  return (
    <SettingsContext.Provider value={{ profile, updateProfile }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};