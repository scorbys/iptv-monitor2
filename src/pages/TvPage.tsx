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
  Clock
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

  // Fix hydration issue
  useEffect(() => {
    setMounted(true);
    // Set initial time on client side only
    setCurrentTime(new Date().toLocaleString('en-US', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }));
  }, []);

  // Get the base URL for API calls - Fixed for different environments
  const getBaseURL = () => {
    // Check if we're in the browser
    if (typeof window === 'undefined') {
      return 'http://localhost:3001';
    }
    
    // For development
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3001';
    }
    
    // For production - try different possible URLs
    const { protocol, hostname } = window.location;
    
    // First try same host with port 3001
    return `${protocol}//${hostname}:3001`;
  };

  // Fetch TV data with better error handling
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
      
      const url = `${baseURL}/api/hospitality/tvs?${params}`;
      console.log('Fetching from:', url);
      
      // First check if server is reachable
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`API endpoint not found. Please check if the server is running on ${baseURL}`);
        }
        throw new Error(`Server error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setTvs(data.data || []);
        setStats({
          totalTVs: data.totalCount || 0,
          onlineTVs: data.onlineCount || 0,
          offlineTVs: data.offlineCount || 0,
          uptime: data.totalCount > 0 ? ((data.onlineCount / data.totalCount) * 100).toFixed(1) : '0.0'
        });
      } else {
        throw new Error(data.message || 'Failed to fetch TV data');
      }
    } catch (error) {
      console.error('Error fetching TVs:', error);
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - Server may be unreachable';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Cannot connect to server. Please check if the backend server is running.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(`Failed to fetch TV data: ${errorMessage}`);
      setTvs([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, sortBy, sortOrder]);

  // Check all TVs status with better error handling
  const checkAllTVs = async () => {
    setIsRefreshing(true);
    try {
      setError(null);
      const baseURL = getBaseURL();
      const url = `${baseURL}/api/hospitality/tvs/check-all`;
      
      console.log('Checking all TVs at:', url);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`API endpoint not found. Please check if the server is running on ${baseURL}`);
        }
        throw new Error(`Server error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        await fetchTVs(); // Refresh data
        // Update current time after successful refresh
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
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout - Server may be unreachable';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Cannot connect to server. Please check if the backend server is running.';
        } else {
          errorMessage = error.message;
        }
      }
      
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
      const url = `${baseURL}/api/hospitality/tvs/${roomNo}/check`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`API endpoint not found. Please check if the server is running on ${baseURL}`);
        }
        throw new Error(`Server error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Update specific TV in the list
        setTvs(prevTvs => 
          prevTvs.map(tv => 
            tv.roomNo === roomNo 
              ? { ...tv, ...data.data }
              : tv
          )
        );
      } else {
        throw new Error(data.message || 'Failed to check TV status');
      }
    } catch (error) {
      console.error('Error checking TV status:', error);
      let errorMessage = 'Unknown error';
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Cannot connect to server';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(`Failed to check TV ${roomNo}: ${errorMessage}`);
    }
  };

  // Initial data fetch - only after component is mounted
  useEffect(() => {
    if (mounted) {
      fetchTVs();
    }
  }, [mounted, fetchTVs]);

  // Fetch data when filters change - only if mounted
  useEffect(() => {
    if (!loading && mounted) {
      fetchTVs();
    }
  }, [searchTerm, statusFilter, sortBy, sortOrder, fetchTVs, loading, mounted]);

  // Auto-refresh every 3 minutes - only if mounted
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      if (!isRefreshing) {
        fetchTVs();
        // Update current time during auto-refresh
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

  const getStatusBadge = (status: string) => {
    if (status === 'online') {
      return (
        <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          <CheckCircle className="w-3 h-3" />
          Online
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
        <XCircle className="w-3 h-3" />
        Offline
      </div>
    );
  };

  // Fixed date formatting to prevent hydration mismatch
  const formatLastChecked = (lastChecked?: string) => {
    if (!lastChecked || !mounted) return 'Never';
    try {
      const date = new Date(lastChecked);
      // Use a consistent format that works both server and client side
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

  // Don't render until mounted to prevent hydration issues
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
                <div className="flex-1">
                  <span className="text-red-700">{error}</span>
                  {error.includes('server') && (
                    <div className="mt-2 text-sm text-red-600">
                      <p>Troubleshooting steps:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Make sure your backend server is running on port 3001</li>
                        <li>Check if the API endpoints are properly configured</li>
                        <li>Verify CORS settings allow connections from your frontend</li>
                      </ul>
                    </div>
                  )}
                </div>
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
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <label htmlFor="statusFilter" className="sr-only">Filter by status</label>
                <select
                  id="statusFilter"
                  title="Filter by status"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
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
                <label htmlFor="sortBy" className="sr-only">Sort by</label>
                <select
                  id="sortBy"
                  title="Sort by"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="roomNo">Room Number</option>
                  <option value="ipAddress">IP Address</option>
                  <option value="status">Status</option>
                  <option value="responseTime">Response Time</option>
                </select>
                
                <label htmlFor="sortOrder" className="sr-only">Sort order</label>
                <select
                  id="sortOrder"
                  title="Sort order"
                  className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={sortOrder}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortOrder(e.target.value)}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    IP Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Checked
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
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
          <p>Total: {tvs.length} TVs displayed • Auto-refresh every 3 minutes</p>
          {mounted && currentTime && (
            <p className="mt-1">
              Last updated: {currentTime}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TVHospitalityDashboard;