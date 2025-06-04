'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  Monitor, 
  Wifi, 
  WifiOff, 
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

type TV = {
  roomNo: string;
  ipAddress: string;
  status: string;
  responseTime?: number;
  lastChecked?: string;
  error?: string;
  model?: string;
  _id?: string;
};

type TVStats = {
  totalTVs: number;
  onlineTVs: number;
  offlineTVs: number;
  uptime: string;
};

const TVHospitalityDashboard = () => {
  const [tvs, setTvs] = useState<TV[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('roomNo');
  const [sortOrder, setSortOrder] = useState('asc');
  const [stats, setStats] = useState<TVStats>({
    totalTVs: 0,
    onlineTVs: 0,
    offlineTVs: 0,
    uptime: '0.0'
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date().toLocaleString('en-US', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }));
  }, []);

  // Get API base URL
  const getBaseURL = () => {
    if (typeof window === 'undefined') return 'http://localhost:3001';
    return process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3001' 
      : 'https://iptv-backend-prod.up.railway.app';
  };

  // Fetch TV data
  const fetchTVs = React.useCallback(async () => {
    try {
      setError(null);
      const baseURL = getBaseURL();
      const params = new URLSearchParams({
        status: statusFilter,
        search: searchTerm,
        sortBy: sortBy,
        sortOrder: sortOrder
      });
      
      const response = await fetch(`${baseURL}/api/hospitality/tvs?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const allTVs = data.data || [];
        setStats({
          totalTVs: data.totalCount || 0,
          onlineTVs: data.onlineCount || 0,
          offlineTVs: data.offlineCount || 0,
          uptime: data.totalCount > 0 ? ((data.onlineCount / data.totalCount) * 100).toFixed(1) : '0.0'
        });
        
        // Calculate pagination
        const totalPages = Math.ceil(allTVs.length / itemsPerPage);
        setTotalPages(totalPages);
        
        // Get current page data
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedTVs = allTVs.slice(startIndex, endIndex);
        
        setTvs(paginatedTVs);
      } else {
        throw new Error(data.message || 'Failed to fetch TV data');
      }
    } catch (error) {
      console.error('Error fetching TVs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to fetch TV data: ${errorMessage}`);
      setTvs([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, sortBy, sortOrder, currentPage]);

  // Check all TVs status
  const checkAllTVs = async () => {
    setIsRefreshing(true);
    try {
      setError(null);
      const baseURL = getBaseURL();
      
      const response = await fetch(`${baseURL}/api/hospitality/tvs/check-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(30000)
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTVs();
        setCurrentTime(new Date().toLocaleString('en-US', { 
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }));
      } else {
        throw new Error(data.message || 'Failed to check TV status');
      }
    } catch (error) {
      console.error('Error checking all TVs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to check all TVs: ${errorMessage}`);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Check individual TV status
  const checkTVStatus = async (roomNo: string) => {
    try {
      setError(null);
      const baseURL = getBaseURL();
      
      const response = await fetch(`${baseURL}/api/hospitality/tvs/${roomNo}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(10000)
      });
      
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTvs(prevTvs => 
          prevTvs.map(tv => 
            tv.roomNo === roomNo ? { ...tv, ...data.data } : tv
          )
        );
      } else {
        throw new Error(data.message || 'Failed to check TV status');
      }
    } catch (error) {
      console.error('Error checking TV status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to check TV ${roomNo}: ${errorMessage}`);
    }
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sortBy, sortOrder]);

  // Fetch data
  useEffect(() => {
    if (mounted) {
      fetchTVs();
    }
  }, [mounted, fetchTVs]);

  // Auto-refresh every 3 minutes
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      if (!isRefreshing) {
        fetchTVs();
        setCurrentTime(new Date().toLocaleString('en-US', { 
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }));
      }
    }, 180000);
    
    return () => clearInterval(interval);
  }, [isRefreshing, fetchTVs, mounted]);

  // Utility functions
  const getStatusBadge = (status: string) => {
    const isOnline = status === 'online';
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isOnline ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {isOnline ? 'Online' : 'Offline'}
      </div>
    );
  };

  const formatLastChecked = (lastChecked?: string) => {
    if (!lastChecked || !mounted) return 'Never';
    try {
      const date = new Date(lastChecked);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getResponseTimeColor = (responseTime?: number) => {
    if (!responseTime) return 'text-gray-500';
    if (responseTime < 100) return 'text-green-600';
    if (responseTime < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Pagination component
  const Pagination = () => {
    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-medium">{Math.min(currentPage * itemsPerPage, stats.totalTVs)}</span> of{' '}
              <span className="font-medium">{stats.totalTVs}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                type="button"
                title="Previous page"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              {pages.map(page => (
                <button
                  type="button"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                    page === currentPage
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                  }`}
                  title={`Go to page ${page}`}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                title="Next page"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Initializing...</span>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-blue-50">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-lg text-gray-600">Loading TV data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">TV Hospitality Dashboard</h1>
          </div>
          
          {/* Error Alert */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            </div>
          )}
          
          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total TVs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalTVs}</p>
                </div>
                <Monitor className="w-8 h-8 text-blue-500" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Online</p>
                  <p className="text-2xl font-bold text-green-600">{stats.onlineTVs}</p>
                </div>
                <Wifi className="w-8 h-8 text-green-500" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Offline</p>
                  <p className="text-2xl font-bold text-red-600">{stats.offlineTVs}</p>
                </div>
                <WifiOff className="w-8 h-8 text-red-500" />
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.uptime}%</p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search room number or IP..."
                  className="pl-10 pr-4 py-2 border border-gray-300 text-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <label htmlFor="statusFilter" className="sr-only">Status Filter</label>
                <select
                  id="statusFilter"
                  title="Status Filter"
                  className="border border-gray-300 text-gray-800 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="online">Online Only</option>
                  <option value="offline">Offline Only</option>
                </select>
              </div>

              {/* Sort Options */}
              <div className="flex gap-2">
                <label htmlFor="sortBy" className="sr-only">Sort By</label>
                <select
                  id="sortBy"
                  title="Sort By"
                  className="border border-gray-300 text-gray-800 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="roomNo">Room Number</option>
                  <option value="ipAddress">IP Address</option>
                  <option value="status">Status</option>
                  <option value="responseTime">Response Time</option>
                </select>
                
                <label htmlFor="sortOrder" className="sr-only">Sort Order</label>
                <select
                  id="sortOrder"
                  title="Sort Order"
                  className="border border-gray-300 text-gray-800 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={checkAllTVs}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Checking...' : 'Check All TVs'}
            </button>
          </div>
        </div>

        {/* TV Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Checked</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tvs.map((tv, index) => (
                  <tr key={tv.roomNo || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{tv.roomNo}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{tv.ipAddress}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600">{tv.model || 'Samsung Hospitality'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(tv.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${getResponseTimeColor(tv.responseTime)}`}>
                        {tv.responseTime ? `${tv.responseTime}ms` : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatLastChecked(tv.lastChecked)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => checkTVStatus(tv.roomNo)}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Check
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && <Pagination />}
          
          {tvs.length === 0 && !loading && (
            <div className="text-center py-12">
              <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">
                {error ? 'Unable to load TV data' : 'No TVs found matching your criteria'}
              </p>
              {error && (
                <button
                  onClick={fetchTVs}
                  className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Retry
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Total: {stats.totalTVs} TVs • Showing {tvs.length} per page • Auto-refresh every 3 minutes</p>
          {mounted && currentTime && (
            <p className="mt-1">Last updated: {currentTime}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TVHospitalityDashboard;