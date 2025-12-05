import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Save, User, Building, MapPin, Mail, Phone, CreditCard, CheckCircle, Image as ImageIcon, Upload, X, PenTool, Globe } from 'lucide-react';

export const Settings: React.FC = () => {
  const { profile, updateProfile } = useSettings();
  const { t, language, setLanguage } = useLanguage();
  const [formData, setFormData] = useState(profile);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name.includes('Percentage') ? Number(value) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          alert("File is too large. Please upload an image under 2MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (field: 'logo' | 'signature') => {
      setFormData(prev => ({ ...prev, [field]: undefined }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const totalPercentage = (formData.depositPercentage || 0) + (formData.secondPaymentPercentage || 0) + (formData.acceptancePaymentPercentage || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn pb-10">
      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Language Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <Globe className="text-blue-500" size={24} />
                {t('set.language')}
            </h3>
            <div className="flex gap-4 flex-col sm:flex-row">
                <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${language === 'en' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                    <span className="text-2xl">🇺🇸</span> {t('set.lang.en')}
                </button>
                <button
                    type="button"
                    onClick={() => setLanguage('zh-TW')}
                    className={`flex-1 py-4 px-6 rounded-2xl font-bold transition-all border-2 flex items-center justify-center gap-2 ${language === 'zh-TW' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-slate-100 dark:border-slate-800 text-slate-500 hover:border-slate-300 dark:hover:border-slate-600'}`}
                >
                    <span className="text-2xl">🇹🇼</span> {t('set.lang.zh')}
                </button>
            </div>
        </div>

        {/* Branding & Signature Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
             <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <ImageIcon className="text-purple-500" size={24} />
                {t('set.branding')}
             </h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {/* Logo Upload */}
                 <div className="space-y-3">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.companyLogo')}</label>
                     <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800/50 min-h-[160px] relative group">
                         {formData.logo ? (
                             <>
                                <img src={formData.logo} alt="Logo Preview" className="max-h-24 object-contain mb-2" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage('logo')}
                                    className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 rounded-full shadow-sm text-rose-500 hover:text-rose-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                             </>
                         ) : (
                             <>
                                <Upload className="text-slate-300 dark:text-slate-500 mb-2 group-hover:text-indigo-500 transition-colors" size={32} />
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('set.uploadLogo')}</span>
                                <span className="text-xs text-slate-400 mt-1">{t('set.logoFormat')}</span>
                             </>
                         )}
                         <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'logo')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         />
                     </div>
                 </div>

                 {/* Signature Upload */}
                 <div className="space-y-3">
                     <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.signature')}</label>
                     <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors bg-slate-50 dark:bg-slate-800/50 min-h-[160px] relative group">
                         {formData.signature ? (
                             <>
                                <img src={formData.signature} alt="Signature Preview" className="max-h-20 object-contain mb-2" />
                                <button 
                                    type="button"
                                    onClick={() => removeImage('signature')}
                                    className="absolute top-2 right-2 p-1.5 bg-white dark:bg-slate-700 rounded-full shadow-sm text-rose-500 hover:text-rose-600 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                             </>
                         ) : (
                             <>
                                <PenTool className="text-slate-300 dark:text-slate-500 mb-2 group-hover:text-indigo-500 transition-colors" size={32} />
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('set.uploadSignature')}</span>
                                <span className="text-xs text-slate-400 mt-1">{t('set.sigFormat')}</span>
                             </>
                         )}
                         <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => handleFileChange(e, 'signature')}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         />
                     </div>
                 </div>
             </div>
        </div>

        {/* Basic Information Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <User className="text-indigo-500" size={24} />
            {t('set.basicInfo')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.companyName')}</label>
              <div className="relative">
                <Building className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="text"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.contactName')}</label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="text"
                  name="contactName"
                  value={formData.contactName}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.address')}</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.email')}</label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white transition-all"
                />
              </div>
            </div>
             <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.taxId')}</label>
              <div className="relative">
                <Building className="absolute left-4 top-3.5 text-slate-400 pointer-events-none" size={18} />
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleChange}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Financial Settings Section */}
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <CreditCard className="text-emerald-500" size={24} />
            {t('set.financial')}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white font-mono transition-all"
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
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white font-mono transition-all"
                />
                <span className="absolute right-4 top-3.5 text-slate-400 font-bold">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('set.acceptance')}</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  name="acceptancePaymentPercentage"
                  value={formData.acceptancePaymentPercentage || 0}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 dark:text-white font-mono transition-all"
                />
                <span className="absolute right-4 top-3.5 text-slate-400 font-bold">%</span>
              </div>
            </div>
          </div>
          
           <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-sm text-indigo-700 dark:text-indigo-300">
                <div className="flex justify-between items-center font-bold">
                    <span>{t('set.total')}: {totalPercentage}%</span>
                    {totalPercentage !== 100 && (
                        <span className="text-rose-500">{t('set.warning')}</span>
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