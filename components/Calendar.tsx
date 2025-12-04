import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { ChevronLeft, ChevronRight, Plus, X, Clock, Bell, Trash2, Calendar as CalendarIcon, List } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CalendarProps {
  events: CalendarEvent[];
  onAddEvent: (event: CalendarEvent) => void;
  onUpdateEvent: (event: CalendarEvent) => void;
  onDeleteEvent: (id: string) => void;
}

const EmptyEvent: CalendarEvent = {
  id: '',
  title: '',
  date: new Date().toISOString().split('T')[0],
  time: '09:00',
  description: '',
  reminderMinutes: 0
};

const STANDARD_REMINDERS = [-1, 0, 5, 15, 30, 60, 1440];

export const Calendar: React.FC<CalendarProps> = ({ events, onAddEvent, onUpdateEvent, onDeleteEvent }) => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent>(EmptyEvent);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Custom reminder logic
  const [isCustomReminder, setIsCustomReminder] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<number>(10);

  useEffect(() => {
      if (isModalOpen) {
          const mins = editingEvent.reminderMinutes;
          // Check if it is a standard reminder (undefined treated as -1 for logic)
          const effectiveMins = mins === undefined ? -1 : mins;
          
          if (!STANDARD_REMINDERS.includes(effectiveMins)) {
              setIsCustomReminder(true);
              setCustomMinutes(effectiveMins);
          } else {
              setIsCustomReminder(false);
          }
      }
  }, [isModalOpen, editingEvent.id]); // trigger when modal opens or event changes

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return days;
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const dayStr = day.toString().padStart(2, '0');
    const dateStr = `${currentDate.getFullYear()}-${month}-${dayStr}`;
    setSelectedDate(dateStr);
    
    // Open modal to add event
    setEditingEvent({
        ...EmptyEvent,
        id: crypto.randomUUID(),
        date: dateStr
    });
    setIsModalOpen(true);
  };

  const handleEventClick = (e: React.MouseEvent, event: CalendarEvent) => {
      e.stopPropagation();
      setEditingEvent(event);
      setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const existing = events.find(ev => ev.id === editingEvent.id);
      if (existing) {
          onUpdateEvent(editingEvent);
      } else {
          onAddEvent(editingEvent);
      }
      setIsModalOpen(false);
  };

  const handleReminderChange = (value: string) => {
      if (value === 'custom') {
          setIsCustomReminder(true);
          setEditingEvent({ ...editingEvent, reminderMinutes: customMinutes });
      } else {
          setIsCustomReminder(false);
          const val = parseInt(value);
          setEditingEvent({ ...editingEvent, reminderMinutes: val === -1 ? undefined : val });
      }
  };

  const handleCustomMinutesChange = (value: number) => {
      setCustomMinutes(value);
      setEditingEvent({ ...editingEvent, reminderMinutes: value });
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[6rem] md:min-h-[8rem] bg-slate-50/50 dark:bg-slate-900/50 border-b border-r border-slate-100 dark:border-slate-800"></div>);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      const dateStr = `${currentDate.getFullYear()}-${month}-${dayStr}`;
      const isToday = new Date().toISOString().split('T')[0] === dateStr;
      
      const dayEvents = events.filter(e => e.date === dateStr);

      days.push(
        <div 
            key={day} 
            onClick={() => handleDateClick(day)}
            className={`min-h-[6rem] md:min-h-[8rem] border-b border-r border-slate-100 dark:border-slate-800 p-2 cursor-pointer transition-colors hover:bg-indigo-50/50 dark:hover:bg-slate-800/50 relative group ${isToday ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : 'bg-white dark:bg-slate-900'}`}
        >
          <div className={`text-sm font-bold mb-1 w-7 h-7 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-700 dark:text-slate-300'}`}>
              {day}
          </div>
          
          <div className="space-y-1">
              {dayEvents.map(event => (
                  <div 
                    key={event.id}
                    onClick={(e) => handleEventClick(e, event)}
                    className="text-[10px] md:text-xs px-2 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium truncate border-l-2 border-indigo-500 hover:brightness-95 transition-all"
                  >
                      {event.time && <span className="opacity-70 mr-1">{event.time}</span>}
                      {event.title}
                  </div>
              ))}
          </div>
          
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity md:hidden">
              <Plus size={16} className="text-slate-400" />
          </div>
        </div>
      );
    }

    return days;
  };

  const renderListView = () => {
    const monthEvents = events.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
    }).sort((a, b) => new Date(a.date + 'T' + (a.time || '00:00')).getTime() - new Date(b.date + 'T' + (b.time || '00:00')).getTime());

    if (monthEvents.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <CalendarIcon size={48} className="mb-4 opacity-50" />
                <p>{t('cal.noEvents') || 'No events this month'}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-4">
            {monthEvents.map(event => (
                <div 
                    key={event.id}
                    onClick={(e) => handleEventClick(e, event)}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all cursor-pointer"
                >
                    <div className="flex flex-col items-center justify-center w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 font-bold">
                        <span className="text-xs uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-xl">{new Date(event.date).getDate()}</span>
                    </div>
                    <div className="flex-1">
                        <h4 className="font-bold text-slate-800 dark:text-white">{event.title}</h4>
                        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                             {event.time && (
                                <span className="flex items-center gap-1">
                                    <Clock size={14} /> {event.time}
                                </span>
                             )}
                             {event.description && <span className="truncate max-w-[200px]">- {event.description}</span>}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const WEEKDAYS = [t('cal.sun'), t('cal.mon'), t('cal.tue'), t('cal.wed'), t('cal.thu'), t('cal.fri'), t('cal.sat')];

  return (
    <div className="space-y-6 animate-fadeIn pb-10 h-full flex flex-col">
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-orbitron">
                  {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h2>
              <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                  <button onClick={handlePrevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-all shadow-sm">
                      <ChevronLeft size={20} />
                  </button>
                  <button onClick={() => setCurrentDate(new Date())} className="px-3 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all shadow-sm">
                      {t('cal.today')}
                  </button>
                  <button onClick={handleNextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-slate-500 transition-all shadow-sm">
                      <ChevronRight size={20} />
                  </button>
              </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
             <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                 <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                 >
                     <CalendarIcon size={20} />
                 </button>
                 <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
                 >
                     <List size={20} />
                 </button>
             </div>
             <button 
                onClick={() => {
                    setEditingEvent({...EmptyEvent, id: crypto.randomUUID()});
                    setIsModalOpen(true);
                }}
                className="flex-1 md:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 font-medium"
            >
                <Plus size={20} />
                <span>{t('cal.addEvent')}</span>
            </button>
          </div>
      </div>

      {/* Content Area */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden flex-1 flex flex-col min-h-[500px]">
          {viewMode === 'grid' ? (
             <>
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    {WEEKDAYS.map(day => (
                        <div key={day} className="py-4 text-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>
                {/* Days Grid - Changed overflow-hidden to overflow-y-auto to fix cutting off */}
                <div className="grid grid-cols-7 flex-1 overflow-y-auto">
                    {renderCalendarDays()}
                </div>
             </>
          ) : (
             <div className="flex-1 overflow-y-auto">
                 {renderListView()}
             </div>
          )}
      </div>

      {/* Event Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md p-8 animate-scaleIn border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                          {editingEvent.title ? t('cal.editEvent') : t('cal.addEvent')}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                          <X size={24} />
                      </button>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('cal.eventTitle')}</label>
                          <input 
                            type="text" 
                            required 
                            value={editingEvent.title}
                            onChange={e => setEditingEvent({...editingEvent, title: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                          />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('book.date')}</label>
                              <input 
                                type="date" 
                                required 
                                value={editingEvent.date}
                                onChange={e => setEditingEvent({...editingEvent, date: e.target.value})}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:scheme-dark"
                              />
                          </div>
                          <div className="space-y-2">
                              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('cal.time')}</label>
                              <div className="relative">
                                  <Clock className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                  <input 
                                    type="time" 
                                    value={editingEvent.time}
                                    onChange={e => setEditingEvent({...editingEvent, time: e.target.value})}
                                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white dark:scheme-dark"
                                  />
                              </div>
                          </div>
                      </div>

                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('cal.reminder')}</label>
                          <div className="flex gap-2">
                              <div className="relative flex-1">
                                   <Bell className="absolute left-4 top-3.5 text-slate-400" size={18} />
                                   <select
                                      value={isCustomReminder ? 'custom' : (editingEvent.reminderMinutes ?? -1)}
                                      onChange={e => handleReminderChange(e.target.value)}
                                      className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white appearance-none"
                                   >
                                      <option value={-1}>{t('cal.none')}</option>
                                      <option value={0}>{t('cal.atTime')}</option>
                                      <option value={5}>{t('cal.5min')}</option>
                                      <option value={15}>{t('cal.15min')}</option>
                                      <option value={30}>{t('cal.30min')}</option>
                                      <option value={60}>{t('cal.1hour')}</option>
                                      <option value={1440}>{t('cal.1day')}</option>
                                      <option value="custom">{t('cal.custom')}</option>
                                   </select>
                              </div>
                              {isCustomReminder && (
                                  <div className="relative w-32">
                                      <input 
                                        type="number" 
                                        min="0"
                                        value={customMinutes}
                                        onChange={e => handleCustomMinutesChange(parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                        placeholder="Min"
                                      />
                                      <span className="absolute right-3 top-3.5 text-xs text-slate-400 font-bold">min</span>
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('cal.description')}</label>
                          <textarea
                            rows={3}
                            value={editingEvent.description}
                            onChange={e => setEditingEvent({...editingEvent, description: e.target.value})}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white resize-none"
                          />
                      </div>

                      <div className="flex gap-4 pt-4">
                        {events.find(e => e.id === editingEvent.id) && (
                            <button
                                type="button"
                                onClick={() => {
                                    onDeleteEvent(editingEvent.id);
                                    setIsModalOpen(false);
                                }}
                                className="px-4 py-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                            >
                                <Trash2 size={20} />
                            </button>
                        )}
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