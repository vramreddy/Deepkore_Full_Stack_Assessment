import { useState, useEffect } from 'react';
import api from '../api/axios';
import { formatDateTime, formatStatus, getActionText } from '../utils/helpers';
import Pagination from '../components/common/Pagination';
import { FiActivity } from 'react-icons/fi';
import toast from 'react-hot-toast';

function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchActivities();
  }, [page]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activities', { params: { page, limit: 20 } });
      setActivities(res.data.activities);
      setPagination(res.data.pagination);
    } catch (err) {
      toast.error('Failed to load activities.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="activities-page">
      <div className="page-header">
        <div>
          <h1>Activity Log</h1>
          <p className="page-description">Track all changes and actions across the system</p>
        </div>
      </div>

      {loading ? (
        <div className="page-loader">
          <div className="spinner"></div>
        </div>
      ) : activities.length === 0 ? (
        <div className="empty-state">
          <FiActivity size={48} style={{ opacity: 0.4 }} />
          <h3>No activity recorded</h3>
          <p>Activities will appear here as changes are made.</p>
        </div>
      ) : (
        <>
          <div className="activity-list-full">
            {activities.map((act) => (
              <div key={act._id} className="activity-card">
                <div className="activity-card-header">
                  <div className="activity-user-info">
                    <div className="avatar-small">
                      {act.user?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <strong>{act.user?.name || 'Unknown'}</strong>
                  </div>
                  <span className="activity-timestamp">{formatDateTime(act.createdAt)}</span>
                </div>
                <div className="activity-card-body">
                  <span className="activity-action-text">
                    {getActionText(act.action)}
                  </span>
                  <span className="activity-entity-name"> "{act.entityName}"</span>
                  {act.previousValue && act.newValue && (
                    <div className="activity-change-detail">
                      <span className="value-old">{formatStatus(act.previousValue)}</span>
                      <span className="arrow"> → </span>
                      <span className="value-new">{formatStatus(act.newValue)}</span>
                    </div>
                  )}
                  {act.details && <p className="activity-details">{act.details}</p>}
                </div>
                <div className="activity-card-footer">
                  <span className={`badge badge-${act.entityType === 'project' ? 'info' : 'secondary'}`}>
                    {act.entityType}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Pagination pagination={pagination} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export default ActivitiesPage;
