import React, { useState } from 'react';
import { Client, Project } from '../types';
import { Plus, Edit2, Trash2, Search, User, Mail, Phone, MapPin, Building, FileText, X, Archive, RefreshCw, Briefcase, ChevronRight, FolderOpen, ArrowRightCircle } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

interface ClientsProps {
  clients: Client[];
  projects?: Project[];
  onAdd: (client: Client) => void;
  onUpdate: (client: Client) => void;
  onDelete: (id: string) => void;
  onArchive?: (id: string) => void;
  onRestore?: (id: string) => void;
  onAddProject?: (project: Project) => void;
}

const EmptyClient: Client = {
    id: '',
    status: 'ACTIVE',
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    notes: ''
};

const EmptyProject: Project = {
    id: '',
    name: '',
    clientId: '',
    status: 'NOT_SET',
    description: '',
    createdAt: ''
};

export const Clients: React.FC<ClientsProps> = ({ clients, projects = [], onAdd, onUpdate, onDelete, onArchive, onRestore, onAddProject }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Client Modal State
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client>(EmptyClient);
  const [filterStatus, setFilterStatus] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  // Project Modal State
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [selectedClientForProjects, setSelectedClientForProjects] = useState<Client | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState<Project>(EmptyProject);

  const filteredClients = clients.filter(c => 
    (c.status === filterStatus || (!c.status && filterStatus === 'ACTIVE')) && // Handle legacy data
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (client?: Client) => {
      if (client) {
          setEditingClient(client);
      } else {
          setEditingClient({ ...EmptyClient, id: crypto.randomUUID() });
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Check if updating or adding
      const existing = clients.find(c => c.id === editingClient.id);
      if (existing) {
          onUpdate(editingClient);
      } else {
          onAdd(editingClient);
      }
      setIsModalOpen(false);
  };

  // --- Project Workflow Logic ---

  const handleOpenProjectModal = (client: Client) => {
      setSelectedClientForProjects(client);
      setIsProjectModalOpen(true);
      setIsAddingProject(false);
  };

  const handleCreateProject = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedClientForProjects || !onAddProject) return;

      const projectToAdd: Project = {
          ...newProject,
          id: crypto.randomUUID(),
          clientId: selectedClientForProjects.id,
          createdAt: new Date().toISOString().split('T')[0]
      };
      
      onAddProject(projectToAdd);
      setIsAddingProject(false);
      setNewProject(EmptyProject);
  };

  const handleCreateQuoteFromProject = (project: Project) => {
      navigate('/invoices', { 
          state: { 
              createNew: true,
              clientId: project.clientId, 
              projectId: project.id 
          } 
      });
  };

  const clientProjects = selectedClientForProjects 
      ? projects.filter(p => p.clientId === selectedClientForProjects.id)
      : [];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="flex gap-2">
             <button
                onClick={() => setFilterStatus('ACTIVE')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === 'ACTIVE' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-500'}`}
             >
                 {t('client.active')}
             </button>
             <button
                onClick={() => setFilterStatus('ARCHIVED')}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterStatus === 'ARCHIVED' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 text-slate-500'}`}
             >
                 {t('client.archived')}
             </button>
         </div>

         <div className="flex flex-1 w-full md:w-auto gap-4">
            <div className="relative flex-1 w-full">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search size={20} />
                </div>
                <input 
                    type="text" 
                    placeholder={t('client.search')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm"
                />
            </div>
            <button
                onClick={() => handleOpenModal()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 font-medium whitespace-nowrap"
            >
                <Plus size={20} />
                <span className="hidden md:inline">{t('client.addNew')}</span>
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-4">
                    <User className="text-indigo-300 dark:text-indigo-600" size={48}/>
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-medium">{t('client.noData')}</p>
            </div>
          ) : (
              filteredClients.map(client => (
                  <div key={client.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg dark:hover:shadow-indigo-900/10 transition-all group flex flex-col">
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold text-xl">
                                  {client.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                  <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">{client.name}</h3>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{client.taxId ? `${t('common.taxId')}: ${client.taxId}` : ''}</p>
                              </div>
                          </div>
                          <div className="flex gap-1">
                               <button onClick={() => handleOpenProjectModal(client)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors" title="Manage Projects">
                                  <Briefcase size={16} />
                              </button>
                              <button onClick={() => handleOpenModal(client)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors" title="Edit">
                                  <Edit2 size={16} />
                              </button>
                              
                              {client.status === 'ARCHIVED' ? (
                                   <button onClick={() => onRestore && onRestore(client.id)} className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors" title="Restore">
                                      <RefreshCw size={16} />
                                   </button>
                              ) : (
                                   <button onClick={() => onArchive && onArchive(client.id)} className="p-2 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors" title="Archive">
                                      <Archive size={16} />
                                   </button>
                              )}

                              <button onClick={() => onDelete(client.id)} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors" title="Delete">
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </div>

                      <div className="space-y-3 flex-1">
                          {client.email && (
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <Mail size={16} className="shrink-0 text-slate-400" />
                                <span className="truncate">{client.email}</span>
                            </div>
                          )}
                          {client.phone && (
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <Phone size={16} className="shrink-0 text-slate-400" />
                                <span>{client.phone}</span>
                            </div>
                          )}
                          {client.address && (
                            <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                                <MapPin size={16} className="shrink-0 text-slate-400" />
                                <span className="line-clamp-2">{client.address}</span>
                            </div>
                          )}
                      </div>

                      {client.notes && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <p className="text-xs text-slate-500 italic line-clamp-2">{client.notes}</p>
                        </div>
                      )}
                  </div>
              ))
          )}
      </div>

      {/* Client Edit Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl p-8 animate-scaleIn border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {editingClient.id && clients.find(c => c.id === editingClient.id) ? t('client.edit') : t('client.addNew')}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                          <X size={24} />
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('client.name')}</label>
                              <div className="relative">
                                  <User className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                  <input 
                                    type="text" 
                                    required 
                                    value={editingClient.name}
                                    onChange={e => setEditingClient({...editingClient, name: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                  />
                              </div>
                          </div>
                           <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('client.taxId')}</label>
                              <div className="relative">
                                  <FileText className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                  <input 
                                    type="text" 
                                    value={editingClient.taxId}
                                    onChange={e => setEditingClient({...editingClient, taxId: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                  />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('client.email')}</label>
                              <div className="relative">
                                  <Mail className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                  <input 
                                    type="email" 
                                    value={editingClient.email}
                                    onChange={e => setEditingClient({...editingClient, email: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                  />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('client.phone')}</label>
                              <div className="relative">
                                  <Phone className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                  <input 
                                    type="text" 
                                    value={editingClient.phone}
                                    onChange={e => setEditingClient({...editingClient, phone: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                  />
                              </div>
                          </div>
                          <div className="space-y-2 md:col-span-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('client.address')}</label>
                              <div className="relative">
                                  <MapPin className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                  <input 
                                    type="text" 
                                    value={editingClient.address}
                                    onChange={e => setEditingClient({...editingClient, address: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                  />
                              </div>
                          </div>
                           <div className="space-y-2 md:col-span-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('client.notes')}</label>
                              <textarea
                                rows={3}
                                value={editingClient.notes}
                                onChange={e => setEditingClient({...editingClient, notes: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                              />
                          </div>
                      </div>
                      
                      <div className="flex gap-4 pt-4">
                        <button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-bold transition-colors"
                        >
                          {t('book.cancel')}
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all transform active:scale-95"
                        >
                          {t('book.save')}
                        </button>
                      </div>
                  </form>
              </div>
          </div>
      )}

      {/* Projects Management Modal */}
      {isProjectModalOpen && selectedClientForProjects && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-2xl p-0 animate-scaleIn border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-hidden flex flex-col">
                  {/* Header */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                      <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                             <Briefcase className="text-indigo-600 dark:text-indigo-400" size={24} />
                             {t('client.manageProjects')}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {t('client.for')} {selectedClientForProjects.name}
                          </p>
                      </div>
                      <button onClick={() => setIsProjectModalOpen(false)} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500">
                          <X size={24} />
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
                      {isAddingProject ? (
                          <div className="animate-fadeIn">
                              <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-bold text-slate-800 dark:text-white">{t('proj.addNew')}</h4>
                                  <button onClick={() => setIsAddingProject(false)} className="text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                                      {t('book.cancel')}
                                  </button>
                              </div>
                              <form onSubmit={handleCreateProject} className="space-y-4 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30">
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('proj.name')}</label>
                                      <input 
                                          type="text" 
                                          required 
                                          value={newProject.name}
                                          onChange={e => setNewProject({...newProject, name: e.target.value})}
                                          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                          placeholder="e.g. Website Redesign"
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('cal.description')}</label>
                                      <textarea 
                                          rows={2}
                                          value={newProject.description}
                                          onChange={e => setNewProject({...newProject, description: e.target.value})}
                                          className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                                          placeholder={t('proj.details')}
                                      />
                                  </div>
                                  <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all">
                                      {t('client.createQuote')}
                                  </button>
                              </form>
                          </div>
                      ) : (
                          <div className="space-y-4">
                              {clientProjects.length === 0 ? (
                                  <div className="text-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                      <FolderOpen size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                      <p className="text-slate-400 dark:text-slate-500 mb-4">{t('proj.noData')}</p>
                                      <button 
                                          onClick={() => setIsAddingProject(true)}
                                          className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                      >
                                          + {t('proj.addNew')}
                                      </button>
                                  </div>
                              ) : (
                                  <>
                                      <button 
                                          onClick={() => setIsAddingProject(true)}
                                          className="w-full py-3 border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-500 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                                      >
                                          <Plus size={18} /> {t('proj.addNew')}
                                      </button>
                                      
                                      <div className="space-y-3">
                                          {clientProjects.map(project => {
                                              const isActive = project.status !== 'COMPLETED' && project.status !== 'ARCHIVED';
                                              return (
                                              <div key={project.id} className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 p-4 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all">
                                                  <div className="flex items-center gap-4">
                                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                                                          <FolderOpen size={20} />
                                                      </div>
                                                      <div>
                                                          <h4 className="font-bold text-slate-800 dark:text-white">{project.name}</h4>
                                                          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                                              <span>{project.createdAt}</span>
                                                              <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                                              <span className={isActive ? 'text-emerald-500' : 'text-slate-500'}>
                                                                  {t(`proj.st.${project.status}`)}
                                                              </span>
                                                          </div>
                                                      </div>
                                                  </div>
                                                  
                                                  <button 
                                                      onClick={() => handleCreateQuoteFromProject(project)}
                                                      className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                                                  >
                                                      {t('client.createQuote')}
                                                      <ArrowRightCircle size={14} />
                                                  </button>
                                              </div>
                                          )})}
                                      </div>
                                  </>
                              )}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};