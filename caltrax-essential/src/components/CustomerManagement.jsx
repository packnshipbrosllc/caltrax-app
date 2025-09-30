import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Ban, 
  CheckCircle, 
  Mail, 
  CreditCard,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Download,
  MoreVertical
} from 'lucide-react';

export default function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showCustomerDetails, setShowCustomerDetails] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/customers');
      const data = await response.json();
      setCustomers(data.customers || []);
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerAction = async (action, customer) => {
    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/customer-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          clerkUserId: customer.clerk_user_id,
          customerId: customer.customer_id,
          subscriptionId: customer.subscription_id
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(result.message);
        loadCustomers(); // Refresh the list
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Error performing action');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-100';
      case 'trialing': return 'text-blue-500 bg-blue-100';
      case 'past_due': return 'text-yellow-500 bg-yellow-100';
      case 'canceled': return 'text-red-500 bg-red-100';
      case 'incomplete': return 'text-gray-500 bg-gray-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'trialing': return <Calendar className="w-4 h-4" />;
      case 'past_due': return <AlertTriangle className="w-4 h-4" />;
      case 'canceled': return <Ban className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.clerk_user_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || customer.subscription_status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const exportCustomers = () => {
    const csvData = customers.map(customer => ({
      'Email': customer.email,
      'User ID': customer.clerk_user_id,
      'Plan': customer.plan || 'None',
      'Status': customer.subscription_status || 'None',
      'Payment Date': customer.payment_date ? formatDate(customer.payment_date) : 'Never',
      'Trial Used': customer.trial_used ? 'Yes' : 'No',
      'Customer ID': customer.customer_id || 'None',
      'Subscription ID': customer.subscription_id || 'None'
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="text-white text-center">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Customer Management</h2>
        <div className="flex space-x-4">
          <button
            onClick={loadCustomers}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={exportCustomers}
            className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-6 rounded-lg">
        <div className="flex space-x-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-700 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="trialing">Trialing</option>
            <option value="past_due">Past Due</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Payment Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Trial</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-white">{customer.email}</div>
                      <div className="text-sm text-gray-400">{customer.clerk_user_id}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white">
                    {customer.plan || 'None'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(customer.subscription_status)}`}>
                      {getStatusIcon(customer.subscription_status)}
                      <span className="ml-1">{customer.subscription_status || 'None'}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {customer.payment_date ? formatDate(customer.payment_date) : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {customer.trial_used ? (
                      <span className="text-red-400">Used</span>
                    ) : (
                      <span className="text-green-400">Available</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerDetails(true);
                        }}
                        className="text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      
                      {customer.subscription_status === 'active' && (
                        <button
                          onClick={() => handleCustomerAction('cancel_subscription', customer)}
                          disabled={actionLoading}
                          className="text-yellow-400 hover:text-yellow-300 flex items-center space-x-1"
                        >
                          <Ban className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      )}
                      
                      {customer.subscription_status === 'cancel_at_period_end' && (
                        <button
                          onClick={() => handleCustomerAction('reactivate_subscription', customer)}
                          disabled={actionLoading}
                          className="text-green-400 hover:text-green-300 flex items-center space-x-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>Reactivate</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Details Modal */}
      {showCustomerDetails && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-white">Customer Details</h3>
              <button
                onClick={() => setShowCustomerDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Email</label>
                  <p className="text-white">{selectedCustomer.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">User ID</label>
                  <p className="text-white font-mono text-sm">{selectedCustomer.clerk_user_id}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Plan</label>
                  <p className="text-white">{selectedCustomer.plan || 'None'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedCustomer.subscription_status)}`}>
                    {getStatusIcon(selectedCustomer.subscription_status)}
                    <span className="ml-1">{selectedCustomer.subscription_status || 'None'}</span>
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400">Payment Date</label>
                  <p className="text-white">{selectedCustomer.payment_date ? formatDate(selectedCustomer.payment_date) : 'Never'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Trial Used</label>
                  <p className="text-white">{selectedCustomer.trial_used ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Stripe Customer ID</label>
                  <p className="text-white font-mono text-sm">{selectedCustomer.customer_id || 'None'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-400">Subscription ID</label>
                  <p className="text-white font-mono text-sm">{selectedCustomer.subscription_id || 'None'}</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-700">
              <h4 className="text-lg font-semibold text-white mb-4">Actions</h4>
              <div className="flex space-x-4">
                <button
                  onClick={() => handleCustomerAction('send_payment_reminder', selectedCustomer)}
                  disabled={actionLoading}
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Reminder</span>
                </button>
                
                {selectedCustomer.customer_id && (
                  <button
                    onClick={() => handleCustomerAction('get_customer_details', selectedCustomer)}
                    disabled={actionLoading}
                    className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center space-x-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>View Stripe Data</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
