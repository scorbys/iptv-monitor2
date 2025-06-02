'use client'

import React, { useState, useEffect } from 'react'
import { 
  SignalIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  TvIcon
} from "@heroicons/react/24/outline"

interface Channel {
  id: number;
  channelNumber: number;
  channelName: string;
  category: string;
  ipMulticast: string;
  status: 'online' | 'offline';
  lastChecked: string;
  responseTime?: number;
}

interface DashboardStats {
  totalChannels: number;
  onlineChannels: number;
  offlineChannels: number;
  uptime: string;
  categoryStats: Record<string, { total: number; online: number; offline: number }>;
  lastUpdated: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      const [statsResponse, channelsResponse] = await Promise.all([
        fetch('http://localhost:3001/api/dashboard/stats'),
        fetch('http://localhost:3001/api/channels')
      ])
      
      const statsResult = await statsResponse.json()
      const channelsResult = await channelsResponse.json()
      
      if (statsResult.success) {
        setStats(statsResult.data)
      }
      
      if (channelsResult.success) {
        setChannels(channelsResult.data)
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // Get recent offline channels
  const recentOfflineChannels = channels
    .filter(ch => ch.status === 'offline')
    .sort((a, b) => new Date(b.lastChecked).getTime() - new Date(a.lastChecked).getTime())
    .slice(0, 5)

  // Get channels by category
  // const channelsByCategory = channels.reduce((acc, channel) => {
  //   if (!acc[channel.category]) {
  //     acc[channel.category] = []
  //   }
  //   acc[channel.category].push(channel)
  //   return acc
  // }, {} as Record<string, Channel[]>)

  if (loading) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading dashboard...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">IPTV System Dashboard</h1>
        <p className="text-gray-600">
          Real-time monitoring of IPTV channels and system status
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Last updated: {lastRefresh.toLocaleString()}
        </p>
      </div>

      {/* Main Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Channels</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalChannels}</p>
                <p className="text-sm text-gray-500 mt-1">Active monitoring</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <TvIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Online Channels</p>
                <p className="text-3xl font-bold text-green-600 mt-2">{stats.onlineChannels}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {((stats.onlineChannels / stats.totalChannels) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="w-8 h-8 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Offline Channels</p>
                <p className="text-3xl font-bold text-red-600 mt-2">{stats.offlineChannels}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {((stats.offlineChannels / stats.totalChannels) * 100).toFixed(1)}% of total
                </p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ExclamationTriangleIcon className="w-8 h-8 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Uptime</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{stats.uptime}%</p>
                <p className={`text-sm mt-1 ${
                  parseFloat(stats.uptime) >= 95 ? 'text-green-600' : 
                  parseFloat(stats.uptime) >= 80 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {parseFloat(stats.uptime) >= 95 ? 'Excellent' : 
                   parseFloat(stats.uptime) >= 80 ? 'Good' : 'Needs attention'}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <SignalIcon className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Category Breakdown */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Channel Categories</h2>
              <ChartBarIcon className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="space-y-4">
              {stats && Object.entries(stats.categoryStats).map(([category, data]) => (
                <div key={category} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900">{category}</h3>
                    <span className="text-sm text-gray-500">{data.total} channels</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-2">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Online: {data.online}</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm text-gray-600">Offline: {data.offline}</span>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(data.online / data.total) * 100}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-right mt-1">
                    <span className="text-sm font-medium text-gray-700">
                      {((data.online / data.total) * 100).toFixed(1)}% uptime
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Issues */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Recent Issues</h2>
              <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />
            </div>
            
            {recentOfflineChannels.length > 0 ? (
              <div className="space-y-3">
                {recentOfflineChannels.map((channel) => (
                  <div key={channel.id} className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {channel.channelName}
                      </p>
                      <p className="text-xs text-gray-500">
                        Channel {channel.channelNumber} • {channel.category}
                      </p>
                      <p className="text-xs text-red-600 mt-1">
                        Offline since {new Date(channel.lastChecked).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-sm text-gray-600">All channels are online!</p>
                <p className="text-xs text-gray-500 mt-1">No recent issues detected</p>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button 
                onClick={fetchDashboardData}
                className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <ClockIcon className="w-4 h-4 mr-2" />
                Refresh Data
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <ChartBarIcon className="w-4 h-4 mr-2" />
                View Reports
              </button>
              <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                <TvIcon className="w-4 h-4 mr-2" />
                Manage Channels
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status Footer */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-sm text-gray-600">System Status: Operational</span>
            </div>
            <div className="text-sm text-gray-500">
              Monitoring {channels.length} channels across {stats ? Object.keys(stats.categoryStats).length : 0} categories
            </div>
          </div>
          <div className="text-xs text-gray-400">
            Auto-refresh every 30 seconds
          </div>
        </div>
      </div>
    </div>
  )
}
