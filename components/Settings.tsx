import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Save, User, Building, MapPin, Mail, Phone, CreditCard, CheckCircle } from 'lucide-react';

export const Settings: React.FC = () => {
  const { profile, updateProfile } = useSettings();
  const { t } = useLanguage();
  const [formData, setFormData] = useState(profile);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Percentage') ? Number(value) : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-10">
      {/* Header removed */}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <User className="text-indigo-500" size={24} />
            {t('set.basicInfo')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.companyName')}</label>
              <div className="relative">
                <Building className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.contactName')}</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.address')}</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>
             <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.taxId')}</label>
              <div className="relative">
                <Building className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Settings Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <CreditCard className="text-emerald-500" size={24} />
            {t('set.financial')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.deposit')}</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="depositPercentage"
                  value={formData.depositPercentage}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono"
                />
                <span className="absolute right-4 top-3.5 text-slate-400 font-bold">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.secondPayment')}</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="secondPaymentPercentage"
                  value={formData.secondPaymentPercentage}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white font-mono"
                />
                <span className="absolute right-4 top-3.5 text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>
          
           <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-sm text-indigo-700 dark:text-indigo-300">
                <div className="flex justify-between items-center font-bold">
                    <span>Total: {formData.depositPercentage + formData.secondPaymentPercentage}%</span>
                    {formData.depositPercentage + formData.secondPaymentPercentage !== 100 && (
                        <span className="text-rose-500">Warning: Total does not equal 100%</span>
                    )}
                </div>
           </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
          >
            {showSuccess ? <CheckCircle size={20} /> : <Save size={20} />}
            <span>{showSuccess ? t('set.saveSuccess') : t('book.save')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};