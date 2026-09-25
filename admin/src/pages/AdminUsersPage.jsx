import { useState, useEffect } from 'react';
import api from '../api/axios';
import { FiUsers, FiUserPlus, FiSearch, FiFilter, FiMail, FiShield, FiUserCheck, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';

function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/users');
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error('Failed to load user directory.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      toast.error('Please provide name, email, and password.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/auth/register', newUserData);
      toast.success(`User ${newUserData.name} created successfully!`);
      setShowAddModal(false);
      setNewUserData({ name: '', email: '', password: '', role: 'employee' });
      fetchUsers();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to create user.';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-content-view">
      <div className="admin-page-header">
        <div>
          <span className="admin-eyebrow">IDENTITY & ACCESS GOVERNANCE</span>
          <h1 className="admin-title">User Directory & Role Administration</h1>
          <p className="admin-subtitle">
            Manage corporate identities, assign operational roles, and enforce security policies.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={() => setShowAddModal(true)}
        >
          <FiUserPlus /> Provision New User
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="admin-filter-bar">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search users by name or corporate email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="filter-group">
          <FiFilter className="filter-icon" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">All Roles</option>
            <option value="admin">Administrators</option>
            <option value="manager">Project Managers</option>
            <option value="employee">Employees</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="admin-page-loader">
          <div className="admin-spinner"></div>
          <p>Loading directory roster...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="admin-empty-state">
          <FiUsers size={48} style={{ opacity: 0.3 }} />
          <h3>No users match your criteria</h3>
          <p>Try clearing your search or role filters.</p>
        </div>
      ) : (
        <div className="admin-panel-card">
          <div className="admin-audit-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Profile</th>
                  <th>Email Address</th>
                  <th>Assigned Role</th>
                  <th>Account Status</th>
                  <th>Created Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="user-profile-cell">
                        <div className={`user-table-avatar ${u.role}`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong className="user-name">{u.name}</strong>
                        </div>
                      </div>
                    </td>
                    <td className="mono muted">{u.email}</td>
                    <td>
                      <span className={`role-badge ${u.role}`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="badge-pill online">Active</span>
                    </td>
                    <td className="muted mono">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Provision User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FiUserPlus /> Provision New User Account</h2>
              <p>Create credentials for an Employee, Project Manager, or Administrator.</p>
            </div>

            <form onSubmit={handleCreateUser} className="admin-modal-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Aditi Rao"
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Corporate Email *</label>
                <input
                  type="email"
                  placeholder="e.g. aditi@smartops.com"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Initial Temporary Password *</label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newUserData.password}
                  onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Operational Role Clearance *</label>
                <select
                  value={newUserData.role}
                  onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                >
                  <option value="employee">Employee (Task Execution & Timesheets)</option>
                  <option value="manager">Project Manager (Project & Task Assignment)</option>
                  <option value="admin">System Administrator (Global Oversight)</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={creating}
                >
                  {creating ? 'Provisioning...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminUsersPage;
