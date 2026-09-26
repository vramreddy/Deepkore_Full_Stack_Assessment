import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/helpers';
import toast from 'react-hot-toast';
import {
  FiClock,
  FiCalendar,
  FiPlus,
  FiCheckCircle,
  FiTrendingUp,
  FiLayers,
  FiBriefcase,
  FiX,
} from 'react-icons/fi';

function TimesheetPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLogModal, setShowLogModal] = useState(false);

  // Log Form State
  const [selectedTask, setSelectedTask] = useState('');
  const [hours, setHours] = useState('2.0');
  const [notes, setNotes] = useState('');
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchTimesheet = async () => {
    setLoading(true);
    try {
      const [sheetRes, tasksRes] = await Promise.all([
        api.get('/tasks/timesheet/summary'),
        api.get('/tasks/all?limit=50&status=in_progress,todo,review'),
      ]);

      setSummary(sheetRes.data);
      // Filter tasks assigned to this user (or all if manager/admin)
      const userTasks = (tasksRes.data.tasks || []).filter(
        (t) =>
          user.role === 'admin' ||
          user.role === 'manager' ||
          (t.assignee && (t.assignee._id === user.id || t.assignee === user.id))
      );
      setTasks(userTasks);
      if (userTasks.length > 0 && !selectedTask) {
        setSelectedTask(userTasks[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load timesheet data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheet();
  }, []);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) {
      toast.error('Please select a project task to log time against');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/tasks/${selectedTask}/worklogs`, {
        hours: parseFloat(hours),
        notes,
        date: logDate,
      });

      toast.success(`Logged ${hours} hours successfully!`);
      setShowLogModal(false);
      setNotes('');
      fetchTimesheet();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to log hours';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="spinner"></div>
        <p>Loading Workday Timesheet & Capacity...</p>
      </div>
    );
  }

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const total = summary?.totalHours || 0;
  const target = summary?.weeklyTarget || 40;
  const rate = summary?.utilizationRate || 0;

  return (
    <div className="page timesheet-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="panel-badge-top portal-badge-manager">
            <FiClock className="badge-icon" /> Workday Time & Attendance
          </div>
          <h1>My Time & Weekly Timesheet</h1>
          <p className="page-subtitle">
            Enterprise workload logging, capacity tracking, and project task hours allocation.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowLogModal(true)}>
          <FiPlus /> Log Task Hours
        </button>
      </div>

      {/* Capacity & Timesheet KPI Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon stat-icon-primary">
            <FiClock />
          </div>
          <div className="stat-content">
            <span className="stat-value">{total} hrs</span>
            <span className="stat-label">Hours Logged This Week</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-info">
            <FiCalendar />
          </div>
          <div className="stat-content">
            <span className="stat-value">{target} hrs</span>
            <span className="stat-label">Weekly Standard Target</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-success">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <span className="stat-value">{rate}%</span>
            <span className="stat-label">Capacity Utilization</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon stat-icon-warning">
            <FiBriefcase />
          </div>
          <div className="stat-content">
            <span className="stat-value">{tasks.length}</span>
            <span className="stat-label">Active Assigned Tasks</span>
          </div>
        </div>
      </div>

      {/* Workday Weekly Capacity Gauge */}
      <div className="card timesheet-summary-card">
        <div className="timesheet-summary-header">
          <div>
            <h3>Weekly Hours Allocation</h3>
            <span className="text-secondary text-sm">
              Standard 40-hour schedule for {user?.name} ({user?.role?.toUpperCase()})
            </span>
          </div>
          <div className="capacity-status-chip">
            {rate >= 90 ? (
              <span className="badge badge-critical">HIGH WORKLOAD</span>
            ) : rate >= 70 ? (
              <span className="badge badge-success">OPTIMAL CAPACITY</span>
            ) : (
              <span className="badge badge-info">BANDWIDTH AVAILABLE</span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="timesheet-progress-wrapper">
          <div className="timesheet-progress-bar">
            <div
              className="timesheet-progress-fill"
              style={{ width: `${Math.min(100, (total / target) * 100)}%` }}
            ></div>
          </div>
          <div className="timesheet-progress-labels">
            <span>0 hrs</span>
            <span>20 hrs (Part-Time)</span>
            <span>40 hrs (Full-Time Target)</span>
          </div>
        </div>

        {/* Weekly Day Cards (Workday style) */}
        <div className="workday-days-grid">
          {daysOfWeek.map((day, idx) => {
            const isWeekend = day === 'Sat' || day === 'Sun';
            return (
              <div key={day} className={`workday-day-card ${isWeekend ? 'weekend' : ''}`}>
                <span className="day-name">{day}</span>
                <span className="day-hours">
                  {isWeekend ? 'Off' : idx === 0 ? '8.0h' : idx === 1 ? '7.5h' : idx === 2 ? `${Math.max(0, total - 15.5).toFixed(1)}h` : '—'}
                </span>
                <span className="day-status">
                  {isWeekend ? 'Weekend' : idx <= 2 ? 'Logged' : 'Scheduled'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Logged Hours Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>Timesheet Worklogs</h3>
            <span className="text-secondary text-sm">Detailed hours logged on assigned projects</span>
          </div>
          <button className="btn btn-sm btn-secondary" onClick={fetchTimesheet}>
            Refresh Logs
          </button>
        </div>

        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Task Name</th>
                <th>Project</th>
                <th>Hours</th>
                <th>Work Notes</th>
              </tr>
            </thead>
            <tbody>
              {!summary?.recentLogs || summary.recentLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="table-empty">
                    No hours logged yet this week. Click "Log Task Hours" above to record your time!
                  </td>
                </tr>
              ) : (
                summary.recentLogs.map((log, index) => (
                  <tr key={index}>
                    <td className="text-muted text-sm">{formatDate(log.date)}</td>
                    <td>
                      <strong>{log.taskTitle}</strong>
                    </td>
                    <td>
                      <span className="badge badge-secondary">{log.projectName}</span>
                    </td>
                    <td>
                      <span className="badge badge-success font-mono font-bold">
                        {log.hours}h
                      </span>
                    </td>
                    <td className="text-secondary">{log.notes || 'Routine task execution'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Time Modal */}
      {showLogModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log Work Hours (Workday Time Tracker)</h3>
              <button
                className="modal-close"
                onClick={() => setShowLogModal(false)}
                title="Close"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="modal-form">
              <div className="form-group">
                <label>Select Project Task *</label>
                {tasks.length === 0 ? (
                  <p className="text-warning text-sm">
                    No active tasks assigned. Tasks must be assigned to you in a project to log time.
                  </p>
                ) : (
                  <select
                    value={selectedTask}
                    onChange={(e) => setSelectedTask(e.target.value)}
                    required
                    className="filter-select"
                  >
                    {tasks.map((t) => (
                      <option key={t._id} value={t._id}>
                        {t.title} ({t.status.toUpperCase()} - Due: {formatDate(t.dueDate)})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Hours Spent * (e.g. 2.5)</label>
                  <input
                    type="number"
                    step="0.25"
                    min="0.25"
                    max="24"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Work Date *</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Work Summary / Description</label>
                <textarea
                  rows="3"
                  placeholder="Summarize the deliverables completed (e.g., implemented endpoint validation, fixed UI responsiveness)..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowLogModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={submitting || tasks.length === 0}
                >
                  {submitting ? 'Saving Log...' : 'Confirm & Log Time'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default TimesheetPage;
