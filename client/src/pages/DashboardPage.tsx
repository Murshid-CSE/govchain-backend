import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../i18n/LanguageContext';
import { api } from '../api/client';
import type { Issue, Task, Grievance } from '../types';
import { StatusBadge, CategoryLabel } from '../components/common/Badge';
import { LoadingSpinner, ErrorBanner } from '../components/common/UIFeedback';
import {
  User as UserIcon,
  CheckCircle2,
  AlertTriangle,
  Building2,
  PlusCircle,
  FileText,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { t } = useLanguage();

  const isStaff = hasRole(['official', 'admin', 'moderator']);

  // Citizen data
  const [myIssues, setMyIssues] = useState<Issue[]>([]);
  const [myGrievances, setMyGrievances] = useState<Grievance[]>([]);

  // Staff data
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isStaff) {
        // Load official task queues
        const [tasksRes, overdueRes] = await Promise.all([
          api.get<{ tasks: Task[] }>('/tasks/my').catch(() => ({ data: { tasks: [] } })),
          api.get<{ tasks: Task[] }>('/tasks/overdue').catch(() => ({ data: { tasks: [] } })),
        ]);
        setAssignedTasks(tasksRes.data?.tasks || []);
        setOverdueTasks(overdueRes.data?.tasks || []);
      } else {
        // Load citizen reports and grievances
        const [issuesRes, grievancesRes] = await Promise.all([
          api.get<{ issues: Issue[] }>('/issues/my').catch(() => ({ data: { issues: [] } })),
          api.get<{ grievances: Grievance[] }>('/grievances/my').catch(() => ({ data: { grievances: [] } })),
        ]);
        setMyIssues(issuesRes.data?.issues || []);
        setMyGrievances(grievancesRes.data?.grievances || []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [isStaff]);

  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    setUpdatingTaskId(taskId);
    try {
      await api.put(`/tasks/${taskId}/status`, {
        status: newStatus,
        note: `Status updated via Official Workspace to ${newStatus}`,
      });
      loadDashboardData();
    } catch (err: any) {
      setError(err.message || 'Failed to update task status.');
    } finally {
      setUpdatingTaskId(null);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-4">
        <UserIcon className="w-12 h-12 text-slate-400 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to Access Dashboard</h2>
        <p className="text-xs text-slate-500">
          Your dashboard allows you to track submitted issues, file grievances, or manage municipal task queues.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-xs hover:bg-blue-700 transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* User Header Profile */}
      <div className="civic-card-3d p-6 sm:p-8 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md">
            {user.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">{user.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-slate-500">{user.email}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200">
                {user.role}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/report"
            className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4 mr-1.5" />
            {t.btnReportNow}
          </Link>
        </div>
      </div>

      {error && <ErrorBanner message={error} onRetry={loadDashboardData} />}
      {isLoading && <LoadingSpinner message="Loading dashboard records..." />}

      {/* STAFF WORKSPACE (Officials / Admins) */}
      {!isLoading && isStaff && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Verified Official Task Queue
            </h2>
            <span className="text-xs text-slate-500">
              Role authorized by backend: <strong>{user.role.toUpperCase()}</strong>
            </span>
          </div>

          {/* Overdue Alerts */}
          {overdueTasks.length > 0 && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
              <div className="flex items-center text-xs font-bold text-rose-800">
                <AlertTriangle className="w-4 h-4 mr-1.5 text-rose-600" />
                Overdue Departmental Tasks ({overdueTasks.length})
              </div>
              <div className="space-y-1">
                {overdueTasks.map((t) => (
                  <div key={t.id} className="text-xs text-rose-900 flex justify-between">
                    <span>{t.title}</span>
                    <span className="font-semibold">Due: {new Date(t.dueDate || '').toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Tasks Grid */}
          <div className="space-y-4">
            {assignedTasks.length === 0 ? (
              <div className="p-8 bg-white border border-dashed border-slate-300 rounded-2xl text-center text-xs text-slate-500">
                No active tasks assigned to your official queue currently.
              </div>
            ) : (
              assignedTasks.map((task) => (
                <div key={task.id} className="civic-card-3d p-6 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      TASK #{task.id.slice(0, 8)}
                    </span>
                    <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {task.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base">{task.title}</h3>
                  {task.description && <p className="text-xs text-slate-600">{task.description}</p>}

                  {task.issue && (
                    <div className="text-xs text-slate-500">
                      Linked Issue: <Link to={`/issues/${task.issue.id}`} className="text-blue-600 font-semibold hover:underline">{task.issue.title}</Link>
                    </div>
                  )}

                  {/* Official Status Update Controls */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No SLA'}
                    </span>

                    <div className="flex items-center space-x-2">
                      <select
                        aria-label="Update task status"
                        defaultValue={task.status}
                        disabled={updatingTaskId === task.id}
                        onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                        className="px-2.5 py-1 text-xs rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="on_hold">On Hold</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* CITIZEN WORKSPACE */}
      {!isLoading && !isStaff && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            My Reported Issues ({myIssues.length})
          </h2>

          <div className="space-y-4">
            {myIssues.length === 0 ? (
              <div className="p-8 bg-white border border-dashed border-slate-300 rounded-2xl text-center space-y-3">
                <p className="text-xs text-slate-500">You have not submitted any civic reports yet.</p>
                <Link
                  to="/report"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
                >
                  Report First Issue
                </Link>
              </div>
            ) : (
              myIssues.map((issue) => (
                <div key={issue.id} className="civic-card-3d p-5 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-slate-500">{issue.trackingId}</span>
                    <StatusBadge status={issue.status} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">{issue.title}</h3>
                  <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <CategoryLabel category={issue.category} />
                    <Link to={`/issues/${issue.id}`} className="text-blue-600 font-semibold hover:underline">
                      View Details &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Grievances Section */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              My Official Grievances ({myGrievances.length})
            </h2>

            {myGrievances.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                No active formal grievances submitted.
              </div>
            ) : (
              myGrievances.map((grv) => (
                <div key={grv.id} className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-mono font-bold text-slate-500">{grv.trackingId}</span>
                    <span className="uppercase text-blue-700 font-semibold">{grv.status}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{grv.subject}</h4>
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>Target SLA: {grv.slaDeadline ? new Date(grv.slaDeadline).toLocaleDateString() : 'N/A'}</span>
                    <Link to={`/track/${grv.trackingId}`} className="text-blue-600 hover:underline">
                      Track &rarr;
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
