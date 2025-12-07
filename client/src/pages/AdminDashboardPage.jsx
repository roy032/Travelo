import { useState, useEffect } from "react";
import { adminApi } from "../services/api.service";
import Card from "../components/Card";
import Badge from "../components/Badge";
import Input from "../components/Input";
import Loader from "../components/Loader";
import VerificationQueue from "../components/VerificationQueue";
import { Users, CheckCircle, Clock, XCircle } from "lucide-react";

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
            <h2 className='text-xl font-semibold text-gray-900 mb-4'>
              User Management
            </h2>

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
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {sortedUsers.map((user) => (
                      <tr key={user._id} className='hover:bg-gray-50'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm font-medium text-gray-900'>
                            {user.name}
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
    </div>
  );
};

export default AdminDashboardPage;
