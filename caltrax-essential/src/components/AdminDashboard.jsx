import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Calendar,
  RefreshCw,
  Download,
  Search,
  Filter,
  Eye,
  Ban,
  CreditCard,
  BarChart3,
  Settings,
  Database,
  Zap,
  Home,
  UserCheck,
  PieChart
} from 'lucide-react';
import RevenueAnalytics from './RevenueAnalytics';
import CustomerManagement from './CustomerManagement';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load analytics
      const analyticsResponse = await fetch('/api/admin/analytics');
      const analyticsData = await analyticsResponse.json();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Home },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'revenue', name: 'Revenue', icon: DollarSign },
    { id: 'analytics', name: 'Analytics', icon: BarChart3 }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400 mt-2">Manage customers, subscriptions, and revenue</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={loadDashboardData}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Customers</p>
                      <p className="text-2xl font-bold">{analytics.totalCustomers}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Active Subscriptions</p>
                      <p className="text-2xl font-bold text-green-500">{analytics.activeSubscriptions}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Monthly Revenue</p>
                      <p className="text-2xl font-bold text-green-500">{formatCurrency(analytics.monthlyRevenue)}</p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </div>

                <div className="bg-gray-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Trial Users</p>
                      <p className="text-2xl font-bold text-blue-500">{analytics.trialUsers}</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Subscription Status
                </h3>
                <div className="space-y-3">
                  {analytics?.statusBreakdown && Object.entries(analytics.statusBreakdown).map(([status, count]) => (
                    <div key={status} className="flex justify-between items-center">
                      <span className="text-gray-300 capitalize">{status.replace('_', ' ')}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ 
                              width: `${(count / analytics.totalCustomers) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-800 p-6 rounded-lg">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Plan Distribution
                </h3>
                <div className="space-y-3">
                  {analytics?.planBreakdown && Object.entries(analytics.planBreakdown).map(([plan, count]) => (
                    <div key={plan} className="flex justify-between items-center">
                      <span className="text-gray-300">
                        {plan === 'price_1S84cT2LmuiKVnPd3NXruhvk' ? 'Monthly ($5)' :
                         plan === 'price_1S84dS2LmuiKVnPdj6UCRzsN' ? 'Yearly ($30)' :
                         plan}
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ 
                              width: `${(count / analytics.totalCustomers) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="text-white font-medium">{count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-500 mb-2">
                    {analytics?.recentSignups || 0}
                  </div>
                  <div className="text-gray-400">New Signups (7 days)</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500 mb-2">
                    {analytics?.customersWithPayments || 0}
                  </div>
                  <div className="text-gray-400">Paid Customers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-500 mb-2">
                    {analytics?.churnedCustomers || 0}
                  </div>
                  <div className="text-gray-400">Churned (30 days)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Customers Tab */}
        {activeTab === 'customers' && <CustomerManagement />}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && <RevenueAnalytics />}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-4">Advanced Analytics</h3>
              <div className="text-gray-400">
                <p>Advanced analytics features would go here:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Customer lifetime value analysis</li>
                  <li>Cohort analysis</li>
                  <li>Churn prediction models</li>
                  <li>Revenue forecasting</li>
                  <li>Customer segmentation</li>
                  <li>A/B testing results</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}