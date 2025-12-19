import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminApi, authApi } from "../services/api.service";
import Card from "../components/ui/Card";
import Badge from "../components/ui/Badge";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import Loader from "../components/ui/Loader";
import VerificationQueue from "../components/features/admin/VerificationQueue";
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  UserPlus,
  Shield,
  Ban,
  Trash2,
  MoreVertical,
  Flag,
} from "lucide-react";
import toast from "react-hot-toast";

/**
 * AdminDashboard page component
 * Displays user statistics, user table with filtering and search
 */
const AdminDashboardPage = () => {
  const [statistics, setStatistics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0,
    usersPerPage: 20,
  });
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [newUserData, setNewUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });
  const [selectedUser, setSelectedUser] = useState(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(null);

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, filterStatus, pagination.currentPage]);

  const fetchStatistics = async () => {
    try {
      const response = await adminApi.getUserStatistics();
      setStatistics(response);
    } catch (error) {
      console.error("Failed to fetch statistics:", error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.currentPage,
        limit: pagination.usersPerPage,
      };

      if (searchTerm) {
        params.search = searchTerm;
      }

      if (filterStatus) {
        params.verificationStatus = filterStatus;
      }

      const response = await adminApi.getAllUsers(params);
      setUsers(response.users);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];

    if (sortOrder === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const getVerificationBadgeVariant = (status) => {
    switch (status) {
      case "verified":
        return "verified";
      case "pending":
        return "pending";
      case "unverified":
        return "unverified";
      default:
        return "default";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();

    // Validation
    if (!newUserData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!newUserData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    if (!newUserData.password || newUserData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setIsCreatingUser(true);
    try {
      await authApi.register(newUserData);
      toast.success("User created successfully");

      // Reset form and close modal
      setNewUserData({ name: "", email: "", password: "", role: "user" });
      setIsAddUserModalOpen(false);

      // Refresh users list and statistics
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      console.error("Failed to create user:", error);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    if (
      !window.confirm(
        `Are you sure you want to ${
          newRole === "admin"
            ? "promote this user to admin"
            : "demote this user to regular user"
        }?`
      )
    ) {
      return;
    }

    try {
      await adminApi.updateUserRole(userId, newRole);
      toast.success(`User role updated to ${newRole} successfully`);
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      console.error("Failed to update user role:", error);
    }
  };

  const handleToggleBlock = async (userId, currentBlockStatus) => {
    const action = currentBlockStatus ? "unblock" : "block";
    if (
      !window.confirm(
        `Are you sure you want to ${action} this user? ${
          !currentBlockStatus ? "They will not be able to log in." : ""
        }`
      )
    ) {
      return;
    }

    try {
      await adminApi.toggleUserBlock(userId, !currentBlockStatus);
      toast.success(`User ${action}ed successfully`);
      fetchUsers();
    } catch (error) {
      console.error(`Failed to ${action} user:`, error);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${userName}'s account? This will permanently delete:\n\n• All trips owned by this user\n• All activities, expenses, notes, and photos created by this user\n• All messages and notifications\n• All invitations\n\nThis action CANNOT be undone!`
      )
    ) {
      return;
    }

    // Double confirmation
    if (
      !window.confirm(
        "FINAL WARNING: This will permanently delete the user and ALL associated data. Type the user's name to confirm."
      )
    ) {
      return;
    }

    try {
      await adminApi.deleteUser(userId);
      toast.success("User and all associated data deleted successfully");
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  if (!statistics) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <Loader />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 p-6'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900'>Admin Dashboard</h1>
          <p className='text-gray-600 mt-2'>
            Manage users and verification requests
          </p>

          {/* Admin Navigation */}
          <div className='flex gap-2 mt-4'>
            <Link to='/admin'>
              <Button variant='outline' size='sm'>
                <Users className='w-4 h-4 mr-2' />
                Users
              </Button>
            </Link>
            <Link to='/admin/reports'>
              <Button variant='outline' size='sm'>
                <Flag className='w-4 h-4 mr-2' />
                Trip Reports
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card>
            <div className='flex items-center'>
              <div className='p-3 bg-blue-100 rounded-lg'>
                <Users className='text-blue-600' size={24} />
              </div>
              <div className='ml-4'>
                <p className='text-sm text-gray-600'>Total Users</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {statistics.totalUsers}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className='flex items-center'>
              <div className='p-3 bg-green-100 rounded-lg'>
                <CheckCircle className='text-green-600' size={24} />
              </div>
              <div className='ml-4'>
                <p className='text-sm text-gray-600'>Verified</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {statistics.verifiedUsers}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className='flex items-center'>
              <div className='p-3 bg-yellow-100 rounded-lg'>
                <Clock className='text-yellow-600' size={24} />
              </div>
              <div className='ml-4'>
                <p className='text-sm text-gray-600'>Pending</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {statistics.pendingUsers}
                </p>
              </div>
            </div>
          </Card>

          <Card>
            <div className='flex items-center'>
              <div className='p-3 bg-gray-100 rounded-lg'>
                <XCircle className='text-gray-600' size={24} />
              </div>
              <div className='ml-4'>
                <p className='text-sm text-gray-600'>Unverified</p>
                <p className='text-2xl font-bold text-gray-900'>
                  {statistics.unverifiedUsers}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Verification Queue */}
        <div className='mb-8'>
          <VerificationQueue />
        </div>

        {/* User Table */}
        <Card>
          <div className='mb-6'>
            <div className='flex items-center justify-between mb-4'>
              <h2 className='text-xl font-semibold text-gray-900'>
                User Management
              </h2>
              <Button
                variant='primary'
                onClick={() => setIsAddUserModalOpen(true)}
                className='flex items-center gap-2'
              >
                <UserPlus size={18} />
                Add User
              </Button>
            </div>

            {/* Filters and Search */}
            <div className='flex flex-col md:flex-row gap-4'>
              <div className='flex-1'>
                <Input
                  type='text'
                  placeholder='Search by name or email...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className='flex gap-2'>
                <button
                  onClick={() => setFilterStatus("")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === ""
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterStatus("verified")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === "verified"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Verified
                </button>
                <button
                  onClick={() => setFilterStatus("pending")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === "pending"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Pending
                </button>
                <button
                  onClick={() => setFilterStatus("unverified")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === "unverified"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Unverified
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className='flex justify-center py-12'>
              <Loader />
            </div>
          ) : (
            <>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead className='bg-gray-50 border-b border-gray-200'>
                    <tr>
                      <th
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                        onClick={() => handleSort("name")}
                      >
                        <div className='flex items-center'>
                          Name
                          {sortField === "name" && (
                            <span className='ml-1'>
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                        onClick={() => handleSort("email")}
                      >
                        <div className='flex items-center'>
                          Email
                          {sortField === "email" && (
                            <span className='ml-1'>
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Role
                      </th>
                      <th
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                        onClick={() => handleSort("verificationStatus")}
                      >
                        <div className='flex items-center'>
                          Status
                          {sortField === "verificationStatus" && (
                            <span className='ml-1'>
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th
                        className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                        onClick={() => handleSort("createdAt")}
                      >
                        <div className='flex items-center'>
                          Registered
                          {sortField === "createdAt" && (
                            <span className='ml-1'>
                              {sortOrder === "asc" ? "↑" : "↓"}
                            </span>
                          )}
                        </div>
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {sortedUsers.map((user) => (
                      <tr key={user._id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900'>
                            {user.name}
                            {user.isBlocked && (
                              <Badge variant='danger' className='ml-2'>
                                Blocked
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-gray-600'>
                            {user.email}
                          </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <Badge
                            variant={
                              user.role === "admin" ? "primary" : "default"
                            }
                          >
                            {user.role}
                          </Badge>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <Badge
                            variant={getVerificationBadgeVariant(
                              user.verificationStatus
                            )}
                          >
                            {user.verificationStatus}
                          </Badge>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-600'>
                          {formatDate(user.createdAt)}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm'>
                          <div className='flex items-center space-x-2'>
                            {/* Toggle Admin Role */}
                            <button
                              onClick={() =>
                                handleUpdateRole(
                                  user._id,
                                  user.role === "admin" ? "user" : "admin"
                                )
                              }
                              className={`p-2 rounded-lg transition-colors ${
                                user.role === "admin"
                                  ? "bg-purple-100 text-purple-600 hover:bg-purple-200"
                                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                              }`}
                              title={
                                user.role === "admin"
                                  ? "Demote from admin"
                                  : "Promote to admin"
                              }
                            >
                              <Shield className='h-4 w-4' />
                            </button>

                            {/* Toggle Block Status */}
                            <button
                              onClick={() =>
                                handleToggleBlock(user._id, user.isBlocked)
                              }
                              className={`p-2 rounded-lg transition-colors ${
                                user.isBlocked
                                  ? "bg-green-100 text-green-600 hover:bg-green-200"
                                  : "bg-yellow-100 text-yellow-600 hover:bg-yellow-200"
                              }`}
                              title={
                                user.isBlocked ? "Unblock user" : "Block user"
                              }
                            >
                              <Ban className='h-4 w-4' />
                            </button>

                            {/* Delete User */}
                            <button
                              onClick={() =>
                                handleDeleteUser(user._id, user.name)
                              }
                              className='p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors'
                              title='Delete user and all data'
                            >
                              <Trash2 className='h-4 w-4' />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className='flex items-center justify-between mt-6 pt-6 border-t border-gray-200'>
                  <div className='text-sm text-gray-600'>
                    Showing{" "}
                    {(pagination.currentPage - 1) * pagination.usersPerPage + 1}{" "}
                    to{" "}
                    {Math.min(
                      pagination.currentPage * pagination.usersPerPage,
                      pagination.totalUsers
                    )}{" "}
                    of {pagination.totalUsers} users
                  </div>
                  <div className='flex gap-2'>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage - 1,
                        }))
                      }
                      disabled={pagination.currentPage === 1}
                      className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Previous
                    </button>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage + 1,
                        }))
                      }
                      disabled={
                        pagination.currentPage === pagination.totalPages
                      }
                      className='px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isAddUserModalOpen}
        onClose={() => {
          setIsAddUserModalOpen(false);
          setNewUserData({ name: "", email: "", password: "", role: "user" });
        }}
        title='Add New User'
        size='md'
      >
        <form onSubmit={handleCreateUser} className='space-y-4'>
          <Input
            label='Name'
            type='text'
            name='name'
            value={newUserData.name}
            onChange={(e) =>
              setNewUserData({ ...newUserData, name: e.target.value })
            }
            placeholder='Enter user name'
            required
          />

          <Input
            label='Email'
            type='email'
            name='email'
            value={newUserData.email}
            onChange={(e) =>
              setNewUserData({ ...newUserData, email: e.target.value })
            }
            placeholder='user@example.com'
            required
          />

          <Input
            label='Password'
            type='password'
            name='password'
            value={newUserData.password}
            onChange={(e) =>
              setNewUserData({ ...newUserData, password: e.target.value })
            }
            placeholder='Minimum 8 characters'
            required
          />

          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>
              Role
            </label>
            <select
              value={newUserData.role}
              onChange={(e) =>
                setNewUserData({ ...newUserData, role: e.target.value })
              }
              className='w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            >
              <option value='user'>User</option>
              <option value='admin'>Admin</option>
            </select>
          </div>

          <div className='flex gap-3 mt-6'>
            <Button
              type='submit'
              variant='primary'
              loading={isCreatingUser}
              disabled={isCreatingUser}
              className='flex-1'
            >
              Create User
            </Button>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setIsAddUserModalOpen(false);
                setNewUserData({
                  name: "",
                  email: "",
                  password: "",
                  role: "user",
                });
              }}
              disabled={isCreatingUser}
              className='flex-1'
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminDashboardPage;
