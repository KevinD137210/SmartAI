import React, { useState, useEffect } from 'react';
import { Project, Client, ProjectStatus, Invoice, DocumentType } from '../types';
import { Plus, Edit2, Trash2, Search, Briefcase, FolderOpen, CheckCircle, X, ChevronDown, FileText } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface ProjectsProps {
  projects: Project[];
  clients: Client[];
  invoices: Invoice[];
  onAdd: (project: Project) => void;
  onUpdate: (project: Project) => void;
  onDelete: (id: string) => void;
}

const EmptyProject: Project = {
    id: '',
    name: '',
    clientId: '',
    status: 'NOT_SET',
    description: '',
    createdAt: ''
};

export const Projects: React.FC<ProjectsProps> = ({ projects, clients, invoices, onAdd, onUpdate, onDelete }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project>(EmptyProject);

  useEffect(() => {
    if (location.state?.filterProjectId) {
      const targetProject = projects.find(p => p.id === location.state.filterProjectId);
      if (targetProject) {
        setSearchTerm(targetProject.name);
      }
      // Replace state to prevent filter persistence on reload/navigation
      window.history.replaceState({}, '');
    }
  }, [location.state, projects]);

  // Filter Active clients for new projects
  const activeClients = clients.filter(c => c.status !== 'ARCHIVED');

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (project?: Project) => {
      if (project) {
          setEditingProject(project);
      } else {
          setEditingProject({ 
              ...EmptyProject, 
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString().split('T')[0]
          });
      }
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const existing = projects.find(p => p.id === editingProject.id);
      if (existing) {
          onUpdate(editingProject);
      } else {
          onAdd(editingProject);
      }
      setIsModalOpen(false);
  };

  const getClientName = (id: string) => {
      return clients.find(c => c.id === id)?.name || 'Unknown Client';
  };

  // Status Badge Colors & Helper
  const getStatusColor = (status: ProjectStatus) => {
      switch(status) {
          case 'NOT_SET': return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400';
          case 'QUOTE_SENT': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
          case 'DEPOSIT_RECEIVED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
          case 'PROGRESS_PAYMENT': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
          case 'COMPLETED': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300';
          case 'ARCHIVED': return 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
          default: return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
      }
  };

  const PROJECT_STATUSES: ProjectStatus[] = [
      'NOT_SET',
      'QUOTE_SENT',
      'DEPOSIT_RECEIVED',
      'PROGRESS_PAYMENT',
      'COMPLETED',
      'ARCHIVED'
  ];

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div className="relative flex-1 w-full md:w-auto md:max-w-md">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                 <Search size={20} />
             </div>
             <input 
                type="text" 
                placeholder="Search projects..."
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
            <span>{t('proj.addNew')}</span>
          </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-4">
                    <Briefcase className="text-indigo-300 dark:text-indigo-600" size={48}/>
                </div>
                <p className="text-slate-400 dark:text-slate-500 font-medium">{t('proj.noData')}</p>
            </div>
          ) : (
              filteredProjects.map(project => {
                  // We check if there are any invoices/quotes to style the button active, 
                  // but the click action always goes to the list view filtered by project.
                  const hasDocs = invoices.some(i => i.projectId === project.id);

                  const handleQuoteClick = () => {
                      navigate('/invoices', { state: { filterProjectId: project.id } });
                  };

                  return (
                  <div key={project.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-lg dark:hover:shadow-indigo-900/10 transition-all group flex flex-col relative overflow-hidden">
                      <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${project.status === 'COMPLETED' ? 'from-slate-500/10' : 'from-indigo-500/5'} to-transparent rounded-bl-[4rem] -mr-8 -mt-8 pointer-events-none`}></div>
                      
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl ${project.status === 'COMPLETED' || project.status === 'ARCHIVED' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'}`}>
                                  {project.status === 'COMPLETED' || project.status === 'ARCHIVED' ? <CheckCircle size={24}/> : <FolderOpen size={24}/>}
                              </div>
                              <div>
                                  <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">{project.name}</h3>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{getClientName(project.clientId)}</p>
                              </div>
                          </div>
                          <div className="flex gap-1 z-10">
                              <button 
                                onClick={handleQuoteClick} 
                                className={`p-2 rounded-xl transition-colors ${hasDocs ? 'text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20' : 'text-slate-400 hover:text-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                title={t('inv.title')}
                              >
                                  <FileText size={16} />
                              </button>
                              <button onClick={() => handleOpenModal(project)} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                  <Edit2 size={16} />
                              </button>
                              <button onClick={() => onDelete(project.id)} className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors">
                                  <Trash2 size={16} />
                              </button>
                          </div>
                      </div>

                      <div className="space-y-4 flex-1">
                           {/* Status Dropdown */}
                           <div className="relative">
                               <select 
                                   value={project.status || 'NOT_SET'}
                                   onChange={(e) => onUpdate({...project, status: e.target.value as ProjectStatus})}
                                   className={`w-full appearance-none px-3 py-2 rounded-xl text-xs font-bold border-none outline-none cursor-pointer ${getStatusColor(project.status || 'NOT_SET')}`}
                               >
                                   {PROJECT_STATUSES.map(status => (
                                       <option 
                                          key={status} 
                                          value={status} 
                                          className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200"
                                       >
                                           {t(`proj.st.${status}`)}
                                       </option>
                                   ))}
                               </select>
                               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                   <ChevronDown size={14} />
                               </div>
                           </div>

                           <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 min-h-[3rem]">{project.description || 'No description provided.'}</p>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 flex justify-between items-center">
                          <span>Created: {project.createdAt}</span>
                      </div>
                  </div>
              )})
          )}
      </div>

      {/* Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-lg p-8 animate-scaleIn border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {editingProject.id && projects.find(p => p.id === editingProject.id) ? 'Edit Project' : t('proj.addNew')}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                          <X size={24} />
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('proj.name')}</label>
                          <input 
                            type="text" 
                            required 
                            value={editingProject.name}
                            onChange={e => setEditingProject({...editingProject, name: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          />
                      </div>
                      
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('proj.selectClient')}</label>
                          <select
                            required
                            value={editingProject.clientId}
                            onChange={e => setEditingProject({...editingProject, clientId: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none"
                          >
                             <option value="">Select a Client...</option>
                             {activeClients.map(client => (
                                 <option key={client.id} value={client.id}>{client.name}</option>
                             ))}
                          </select>
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('proj.status')}</label>
                          <select
                              value={editingProject.status || 'NOT_SET'}
                              onChange={(e) => setEditingProject({...editingProject, status: e.target.value as ProjectStatus})}
                              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none"
                          >
                              {PROJECT_STATUSES.map(status => (
                                  <option 
                                    key={status} 
                                    value={status}
                                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200"
                                  >
                                    {t(`proj.st.${status}`)}
                                  </option>
                              ))}
                          </select>
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('cal.description')}</label>
                          <textarea
                            rows={3}
                            value={editingProject.description}
                            onChange={e => setEditingProject({...editingProject, description: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                          />
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
    </div>
  );
};