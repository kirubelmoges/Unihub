import React, { useState, useEffect } from 'react';
import axiosInstance from '../static/csrf';
import { format, isToday, isTomorrow, differenceInMinutes } from 'date-fns';
import toast from 'react-hot-toast';

const TaskScheduler = () => {
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [alarmTasks, setAlarmTasks] = useState([]);
  const [showAlarmModal, setShowAlarmModal] = useState(false);
  const [currentAlarm, setCurrentAlarm] = useState(null);
  const [view, setView] = useState('today'); // today, upcoming, all
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    enable_alarm: true,
    alarm_minutes_before: 5,
    repeat_type: 'none',
    repeat_until: '',
    priority: 'medium',
    category: '',
    location: '',
    url: ''
  });

  useEffect(() => {
    fetchTasks();
    startAlarmChecker();
    requestNotificationPermission();
    
    return () => {
      if (window.alarmInterval) clearInterval(window.alarmInterval);
    };
  }, [view]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted');
      }
    }
  };

  const showNotification = (task) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(`🔔 Task Reminder: ${task.title}`, {
        body: `Due at ${format(new Date(task.scheduled_datetime), 'hh:mm a')}\n${task.description || 'Click to view details'}`,
        icon: '/logo192.png',
        tag: task.id.toString(),
        requireInteraction: true,
        silent: false
      });

      notification.onclick = () => {
        window.focus();
        setCurrentAlarm(task);
        setShowAlarmModal(true);
        notification.close();
      };

      // Play sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  const startAlarmChecker = () => {
    // Check for alarms every 30 seconds
    window.alarmInterval = setInterval(async () => {
      try {
        const response = await axiosInstance.get('/tasks/alarm/check/');
        const alarmTasks = response.data;
        
        for (const task of alarmTasks) {
          if (!task.alarm_sent) {
            showNotification(task);
            await axiosInstance.post(`/tasks/${task.id}/alarm-sent/`);
            
            // Add to alarm modal queue
            setAlarmTasks(prev => [...prev, task]);
            setShowAlarmModal(true);
            setCurrentAlarm(task);
          }
        }
      } catch (error) {
        console.error('Alarm check failed:', error);
      }
    }, 30000); // Check every 30 seconds
  };

  const fetchTasks = async () => {
    try {
      let url = '/tasks/';
      if (view === 'today') url = '/tasks/today/';
      else if (view === 'upcoming') url = '/tasks/upcoming/';
      
      const response = await axiosInstance.get(url);
      setTasks(response.data);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        await axiosInstance.patch(`/tasks/${editingTask.id}/update/`, formData);
        toast.success('Task updated successfully');
      } else {
        await axiosInstance.post('/tasks/create/', formData);
        toast.success('Task created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchTasks();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save task');
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await axiosInstance.post(`/tasks/${taskId}/complete/`);
      toast.success('Task completed! 🎉');
      fetchTasks();
    } catch (error) {
      toast.error('Failed to complete task');
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axiosInstance.delete(`/tasks/${taskId}/delete/`);
        toast.success('Task deleted');
        fetchTasks();
      } catch (error) {
        toast.error('Failed to delete task');
      }
    }
  };

  const handleSnooze = async (taskId, minutes = 5) => {
    try {
      await axiosInstance.post(`/tasks/${taskId}/snooze/`, { minutes });
      toast.success(`Task snoozed for ${minutes} minutes`);
      setShowAlarmModal(false);
      fetchTasks();
    } catch (error) {
      toast.error('Failed to snooze task');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduled_date: '',
      scheduled_time: '',
      enable_alarm: true,
      alarm_minutes_before: 5,
      repeat_type: 'none',
      repeat_until: '',
      priority: 'medium',
      category: '',
      location: '',
      url: ''
    });
    setEditingTask(null);
  };

  const editTask = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      scheduled_date: task.scheduled_date,
      scheduled_time: task.scheduled_time,
      enable_alarm: task.enable_alarm,
      alarm_minutes_before: task.alarm_minutes_before,
      repeat_type: task.repeat_type,
      repeat_until: task.repeat_until || '',
      priority: task.priority,
      category: task.category || '',
      location: task.location || '',
      url: task.url || ''
    });
    setShowModal(true);
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-emerald-100 text-emerald-700',
      medium: 'bg-amber-100 text-amber-700',
      high: 'bg-orange-100 text-orange-700',
      urgent: 'bg-red-100 text-red-700'
    };
    return colors[priority] || 'bg-gray-100 text-gray-600';
  };

  const getTimeRemaining = (datetime) => {
    const diff = differenceInMinutes(new Date(datetime), new Date());
    if (diff < 0) return 'Overdue';
    if (diff < 60) return `${diff} minutes`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hours`;
    return `${Math.floor(diff / 1440)} days`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50/30 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Task Scheduler</h1>
            <p className="text-gray-500 mt-1">Manage your tasks and never miss a deadline</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-2.5 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
          >
            + New Task
          </button>
        </div>

        {/* View Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            {['today', 'upcoming', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setView(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize transition-all ${
                  view === tab
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'today' ? "Today's Tasks" : tab === 'upcoming' ? 'Upcoming (7 days)' : 'All Tasks'}
              </button>
            ))}
          </nav>
        </div>

        {/* Tasks List */}
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200">
              <p className="text-gray-500">No tasks found. Create your first task!</p>
            </div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md p-5 hover:shadow-xl transition-all hover:-translate-y-1 border border-gray-200">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center flex-wrap gap-2">
                      <h3 className="text-lg font-semibold text-gray-800">{task.title}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {task.repeat_type !== 'none' && (
                        <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-700">
                          🔄 {task.repeat_type}
                        </span>
                      )}
                    </div>
                    
                    {task.description && (
                      <p className="text-gray-600 mt-1">{task.description}</p>
                    )}
                    
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                      <span>📅 {format(new Date(task.scheduled_datetime), 'PPP')}</span>
                      <span>⏰ {format(new Date(task.scheduled_datetime), 'hh:mm a')}</span>
                      {task.enable_alarm && (
                        <span>🔔 {task.alarm_minutes_before} min before</span>
                      )}
                      {task.location && <span>📍 {task.location}</span>}
                      {task.category && <span>🏷️ {task.category}</span>}
                      {task.status === 'pending' && !task.completed_at && (
                        <span className="text-orange-600 font-medium">
                          ⏳ {getTimeRemaining(task.scheduled_datetime)} remaining
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {task.status === 'pending' && (
                      <button
                        onClick={() => handleComplete(task.id)}
                        className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-3 py-1.5 rounded-xl hover:from-emerald-700 hover:to-green-700 text-sm transition shadow-sm"
                      >
                        Complete
                      </button>
                    )}
                    <button
                      onClick={() => editTask(task)}
                      className="bg-gray-600 text-white px-3 py-1.5 rounded-xl hover:bg-gray-700 text-sm transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="bg-red-600 text-white px-3 py-1.5 rounded-xl hover:bg-red-700 text-sm transition"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create/Edit Task Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-center mb-5">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                    {editingTask ? 'Edit Task' : 'Create New Task'}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600 w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                    <textarea
                      rows="3"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Date *</label>
                      <input
                        type="date"
                        required
                        value={formData.scheduled_date}
                        onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Time *</label>
                      <input
                        type="time"
                        required
                        value={formData.scheduled_time}
                        onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Priority</label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        placeholder="Work, Personal, Study..."
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">URL</label>
                      <input
                        type="url"
                        value={formData.url}
                        onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Alarm Settings</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.enable_alarm}
                          onChange={(e) => setFormData({ ...formData, enable_alarm: e.target.checked })}
                          className="w-4 h-4 accent-indigo-600"
                        />
                        <span className="text-gray-700">Enable Alarm</span>
                      </label>
                      
                      {formData.enable_alarm && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">
                            Remind me before (minutes)
                          </label>
                          <select
                            value={formData.alarm_minutes_before}
                            onChange={(e) => setFormData({ ...formData, alarm_minutes_before: parseInt(e.target.value) })}
                            className="px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value={1}>1 minute</option>
                            <option value={5}>5 minutes</option>
                            <option value={10}>10 minutes</option>
                            <option value={15}>15 minutes</option>
                            <option value={30}>30 minutes</option>
                            <option value={60}>1 hour</option>
                            <option value={120}>2 hours</option>
                            <option value={1440}>1 day</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Repeat Settings</h3>
                    <div className="space-y-3">
                      <select
                        value={formData.repeat_type}
                        onChange={(e) => setFormData({ ...formData, repeat_type: e.target.value })}
                        className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="none">No Repeat</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      
                      {formData.repeat_type !== 'none' && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Repeat Until</label>
                          <input
                            type="date"
                            value={formData.repeat_until}
                            onChange={(e) => setFormData({ ...formData, repeat_until: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-5 py-2.5 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
                    >
                      {editingTask ? 'Update' : 'Create'} Task
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Alarm Modal */}
        {showAlarmModal && currentAlarm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-md w-full p-6 animate-bounce shadow-2xl border border-gray-200">
              <div className="text-center">
                <div className="text-6xl mb-4">🔔</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Task Reminder!</h2>
                <h3 className="text-xl font-semibold text-indigo-600 mb-2">{currentAlarm.title}</h3>
                {currentAlarm.description && (
                  <p className="text-gray-600 mb-4">{currentAlarm.description}</p>
                )}
                <p className="text-sm text-gray-500 mb-4">
                  Due at {format(new Date(currentAlarm.scheduled_datetime), 'hh:mm a')}
                </p>
                
                <div className="space-y-2">
                  <button
                    onClick={() => handleComplete(currentAlarm.id)}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2.5 rounded-xl hover:from-emerald-700 hover:to-green-700 transition shadow-md"
                  >
                    ✓ Mark as Complete
                  </button>
                  <button
                    onClick={() => handleSnooze(currentAlarm.id, 5)}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2.5 rounded-xl hover:from-amber-700 hover:to-orange-700 transition"
                  >
                    ⏰ Snooze 5 minutes
                  </button>
                  <button
                    onClick={() => handleSnooze(currentAlarm.id, 15)}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white px-4 py-2.5 rounded-xl hover:from-amber-700 hover:to-orange-700 transition"
                  >
                    ⏰ Snooze 15 minutes
                  </button>
                  <button
                    onClick={() => setShowAlarmModal(false)}
                    className="w-full bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-300 transition"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskScheduler;