import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  BarChart3,
  PieChart,
  Download,
  RefreshCw
} from 'lucide-react';

export default function RevenueAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [stripeData, setStripeData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      // Load database analytics
      const analyticsResponse = await fetch('/api/admin/analytics');
      const analyticsData = await analyticsResponse.json();
      setAnalytics(analyticsData);

      // Load Stripe data
      const stripeResponse = await fetch('/api/admin/stripe-data');
      const stripeData = await stripeResponse.json();
      setStripeData(stripeData);
    } catch (error) {
      console.error('Error loading analytics:', error);
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

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="text-white text-center">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Revenue Analytics</h2>
        <div className="flex space-x-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-green-500">
                {stripeData ? formatCurrency(stripeData.totalRevenue) : '$0'}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Monthly Revenue</p>
              <p className="text-2xl font-bold text-blue-500">
                {stripeData ? formatCurrency(stripeData.monthlyRevenue) : '$0'}
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Avg Customer Value</p>
              <p className="text-2xl font-bold text-purple-500">
                {stripeData ? formatCurrency(stripeData.avgLifetimeValue) : '$0'}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Churn Rate</p>
              <p className="text-2xl font-bold text-red-500">
                {stripeData ? `${stripeData.churnRate}%` : '0%'}
              </p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Revenue Chart Placeholder */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4 text-white">Revenue Over Time</h3>
        <div className="h-64 bg-gray-700 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400">Revenue chart would go here</p>
            <p className="text-gray-500 text-sm">Integrate with Chart.js or similar</p>
          </div>
        </div>
      </div>

      {/* Subscription Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 p-6 rounded-lg">
          <h3 className="text-xl font-semibold mb-4 text-white flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Subscription Status
          </h3>
          <div className="space-y-3">
            {stripeData?.subscriptionStatuses && Object.entries(stripeData.subscriptionStatuses).map(([status, count]) => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-gray-300 capitalize">{status.replace('_', ' ')}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full" 
                      style={{ 
                        width: `${(count / stripeData.totalSubscriptions) * 100}%` 
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
          <h3 className="text-xl font-semibold mb-4 text-white">Plan Distribution</h3>
          <div className="space-y-3">
            {stripeData?.planBreakdown && Object.entries(stripeData.planBreakdown).map(([plan, count]) => (
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
                        width: `${(count / stripeData.totalSubscriptions) * 100}%` 
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
        <h3 className="text-xl font-semibold mb-4 text-white">Recent Activity</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">
              {stripeData?.recentCharges || 0}
            </div>
            <div className="text-gray-400">Recent Payments</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-500 mb-2">
              {stripeData?.recentSubscriptions || 0}
            </div>
            <div className="text-gray-400">New Subscriptions</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-500 mb-2">
              {stripeData?.canceledSubscriptions || 0}
            </div>
            <div className="text-gray-400">Canceled</div>
          </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <h3 className="text-xl font-semibold mb-4 text-white">Export Data</h3>
        <div className="flex space-x-4">
          <button className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Revenue Data</span>
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Customer Data</span>
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export Analytics Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
