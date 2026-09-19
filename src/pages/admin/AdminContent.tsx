import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, AlertCircle } from 'lucide-react';
import { useCmsStore } from '../../stores/cmsStore';

export default function AdminContent() {
  const { siteContent, fetchSiteContent, updateSiteContent, isLoadingSiteContent } = useCmsStore();
  const [formData, setFormData] = useState({
    heroTitle: '',
    heroSubtitle: '',
    statsAum: '',
    statsWinRate: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSiteContent();
  }, [fetchSiteContent]);

  useEffect(() => {
    if (siteContent?.landingPage) {
      setFormData({
        heroTitle: siteContent.landingPage.heroTitle || '',
        heroSubtitle: siteContent.landingPage.heroSubtitle || '',
        statsAum: siteContent.landingPage.statsAum || '',
        statsWinRate: siteContent.landingPage.statsWinRate || ''
      });
    }
  }, [siteContent]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSiteContent('settings', 'landingPage', formData);
      alert('Content saved successfully!');
    } catch (error) {
      console.error(error);
      alert('Failed to save content.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingSiteContent) {
    return <div className="p-8 font-black uppercase text-2xl">Loading CMS...</div>;
  }

  return (
    <div className="space-y-8 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-black text-black uppercase tracking-tighter bg-neo-accent border-4 border-black inline-block px-4 py-2 shadow-neo-sm transform -rotate-1">
          Content Management
        </h2>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-neo-primary text-black font-black uppercase border-4 border-black px-6 py-3 shadow-neo hover:shadow-neo-pressed hover:translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-5 h-5 stroke-[3]" />
          {isSaving ? 'Saving...' : 'Publish Changes'}
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-4 border-black p-6 md:p-8 shadow-neo max-w-4xl"
      >
        <div className="flex items-center gap-2 mb-8 border-b-4 border-black pb-4 border-dashed">
          <AlertCircle className="w-6 h-6 text-neo-primary stroke-[3]" />
          <h3 className="text-xl font-black text-black uppercase tracking-tight">Landing Page Configuration</h3>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-black uppercase text-black mb-2">Hero Headline</label>
            <textarea 
              name="heroTitle"
              value={formData.heroTitle}
              onChange={handleChange}
              rows={2}
              className="w-full border-4 border-black bg-slate-50 p-3 font-bold text-black focus:outline-none focus:ring-4 focus:ring-neo-primary text-2xl uppercase"
            />
          </div>

          <div>
            <label className="block text-sm font-black uppercase text-black mb-2">Hero Subtitle</label>
            <textarea 
              name="heroSubtitle"
              value={formData.heroSubtitle}
              onChange={handleChange}
              rows={3}
              className="w-full border-4 border-black bg-slate-50 p-3 font-bold text-black focus:outline-none focus:ring-4 focus:ring-neo-primary text-lg uppercase"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
