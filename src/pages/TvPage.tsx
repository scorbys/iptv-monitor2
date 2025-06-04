'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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

interface TV {
  id: number;
  roomNo: string;
  ipAddress: string;
  status: 'online' | 'offline';
  responseTime?: number;
  lastChecked: string;
  error?: string;
  model?: string;
}

interface TVStats {
  totalTVs: number;
  onlineTVs: number;
  offlineTVs: number;
  uptime: string;
  lastUpdated: string;
}

const ITEMS_PER_PAGE = 20;
const API_BASE_URL = 'https://iptv-backend-prod.up.railway.app';

const TVHospitalityDashboard = () => {
  const [tvs, setTvs] = useState<TV[]>([]);
  const [stats, setStats] = useState<TVStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch TV data
  const fetchTVs = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/hospitality/tvs`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && Array.isArray(result.data)) {
        setTvs(result.data);
      } else {
        console.error('Invalid TV data format:', result);
        setTvs([]);
      }
    } catch (error) {
      console.error('Error fetching TVs:', error);
      setError('Failed to fetch TV data');
      setTvs([]);
    }
  }, []);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/hospitality/dashboard/stats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setStats(result.data);
      } else {
        console.error('Invalid stats data format:', result);
        setStats(null);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setStats(null);
    }
  }, []);

  // Check all TVs status
  const checkAllTVs = useCallback(async () => {
    if (refreshing) return;
    
    setRefreshing(true);
    try {
      setError(null);
      const response = await fetch(`${API_BASE_URL}/api/hospitality/tvs/check-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        await Promise.all([fetchTVs(), fetchStats()]);
      } else {
        throw new Error(result.message || 'Failed to check TV status');
      }
    } catch (error) {
      console.error('Error checking all TVs:', error);
      setError('Failed to check all TVs');
    } finally {
      setRefreshing(false);
    }
  }, [refreshing, fetchTVs, fetchStats]);

  // Check individual TV status
  const checkTVStatus = useCallback(async (tvId: number) => {
    if (!tvId) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/hospitality/tvs/${tvId}/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setTvs(prev => prev.map(tv => 
          tv.id === tvId ? { ...tv, ...result.data } : tv
        ));
      }
    } catch (error) {
      console.error('Error checking TV status:', error);
    }
  }, []);

  // Effect untuk mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Effect untuk initial data load dan auto-refresh
  useEffect(() => {
    if (!mounted) return;
    
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchTVs(), fetchStats()]);
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Auto-refresh setiap 3 menit
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && !refreshing) {
        fetchTVs();
        fetchStats();
      }
    }, 180000);

    return () => clearInterval(interval);
  }, [mounted, fetchTVs, fetchStats, refreshing]);

  // Filtered TVs dengan memoization
  const filteredTVs = useMemo(() => {
    return tvs.filter((tv) => {
      const matchesSearch = 
        tv.roomNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tv.ipAddress?.includes(searchTerm) ||
        false;
      
      const matchesStatus = 
        statusFilter === 'All' || 
        tv.status === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [tvs, searchTerm, statusFilter]);

  // Pagination data
  const paginationData = useMemo(() => {
    const totalPages = Math.ceil(filteredTVs.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedTVs = filteredTVs.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return {
      totalPages,
      startIndex,
      paginatedTVs,
      endIndex: Math.min(startIndex + ITEMS_PER_PAGE, filteredTVs.length)
    };
  }, [filteredTVs, currentPage]);

  // Handle page change
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= paginationData.totalPages) {
      setCurrentPage(page);
    }
  }, [paginationData.totalPages]);

  // Reset page ketika filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // Utility functions
  const getStatusBadge = useCallback((status: string) => {
    const isOnline = status === 'online';
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
        isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}>
        {isOnline ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
        {isOnline ? 'Online' : 'Offline'}
      </div>
    );
  }, []);

  const formatLastChecked = useCallback((lastChecked?: string) => {
    if (!lastChecked || !mounted) return 'Never';
    try {
      const date = new Date(lastChecked);
      return date.toLocaleString('en-US', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    } catch {
      return 'Invalid Date';
    }
  }, [mounted]);

  const getResponseTimeColor = useCallback((responseTime?: number) => {
    if (!responseTime) return 'text-gray-500';
    if (responseTime < 100) return 'text-green-600';
    if (responseTime < 500) return 'text-yellow-600';
    return 'text-red-600';
  }, []);

  // Pagination component
  const Pagination = useCallback(() => {
    if (paginationData.totalPages <= 1) return null;

    const maxVisiblePages = 5;
    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(paginationData.totalPages, startPage + maxVisiblePages - 1);
    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);

    return (
      <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200">
        <div className="flex justify-between flex-1 sm:hidden">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === paginationData.totalPages}
            className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
        
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{paginationData.startIndex + 1}</span> to{' '}
              <span className="font-medium">{paginationData.endIndex}</span> of{' '}
              <span className="font-medium">{filteredTVs.length}</span> results
            </p>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Previous page"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {pages.map(page => (
              <button
                type="button"
                key={page}
                onClick={() => handlePageChange(page)}
                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                  page === currentPage
                    ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              type="button"
              title="Next page"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === paginationData.totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }, [paginationData, currentPage, handlePageChange, filteredTVs.length]);

  // Loading states
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
          {stats && (
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
          )}
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
                <label htmlFor="statusFilter" className="sr-only">
                  Filter by status
                </label>
                <select
                  id="statusFilter"
                  aria-label="Filter by status"
                  className="border border-gray-300 text-gray-800 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="All">All Status</option>
                  <option value="Online">Online Only</option>
                  <option value="Offline">Offline Only</option>
                </select>
              </div>
            </div>

            {/* Refresh Button */}
            <button
              onClick={checkAllTVs}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Checking...' : 'Check All TVs'}
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
                {paginationData.paginatedTVs.map((tv, index) => (
                  <tr key={tv.id || index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
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
                        onClick={() => checkTVStatus(tv.id)}
                        disabled={!tv.id}
                        className="flex items-center gap-1 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors disabled:opacity-50"
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
          <Pagination />
          
          {/* Empty State */}
          {filteredTVs.length === 0 && (
            <div className="text-center py-12">
              <Monitor className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                {searchTerm || statusFilter !== 'All' 
                  ? 'No TVs found matching your criteria' 
                  : 'No TVs available'
                }
              </p>
              {(searchTerm || statusFilter !== 'All') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('All');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Total: {filteredTVs.length} TVs • 
            Showing {paginationData.paginatedTVs.length} per page • 
            Auto-refresh every 3 minutes
          </p>
          {stats?.lastUpdated && (
            <p className="mt-1">Last updated: {formatLastChecked(stats.lastUpdated)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default TVHospitalityDashboard;