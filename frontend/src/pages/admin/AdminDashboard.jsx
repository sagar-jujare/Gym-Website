import React, { useEffect, useState } from 'react';
import { Users, CreditCard, TrendingUp, Calendar, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const StatCard = ({ icon: Icon, title, value, subtitle, color = 'red' }) => (
  <Card className="bg-zinc-900 border-zinc-800 stat-card" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-zinc-500 mb-1">{title}</p>
          <p className="font-heading text-4xl text-white">{value}</p>
          {subtitle && <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 bg-${color}-500/10 rounded-sm flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${color}-500`} />
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${API}/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-red-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 page-transition">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-heading text-4xl text-white mb-2">DASHBOARD</h1>
        <p className="text-zinc-500">Welcome back! Here's an overview of your gym.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={Users}
          title="Total Members"
          value={stats?.total_members || 0}
          subtitle={`${stats?.active_members || 0} active`}
        />
        <StatCard
          icon={Users}
          title="Active Members"
          value={stats?.active_members || 0}
          subtitle={`${stats?.inactive_members || 0} inactive`}
          color="green"
        />
        <StatCard
          icon={CreditCard}
          title="Monthly Revenue"
          value={`₹${(stats?.monthly_revenue || 0).toLocaleString()}`}
          subtitle="This month"
          color="blue"
        />
        <StatCard
          icon={Calendar}
          title="Upcoming Renewals"
          value={stats?.upcoming_renewals || 0}
          subtitle="Next 7 days"
          color="yellow"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-500" />
              REVENUE TREND
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80" data-testid="revenue-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.revenue_by_month || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `₹${v/1000}k`} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#18181b', 
                      border: '1px solid #27272a',
                      borderRadius: '4px'
                    }}
                    labelStyle={{ color: '#fff' }}
                    itemStyle={{ color: '#ef4444' }}
                    formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#ef4444" 
                    fill="url(#colorRevenue)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="font-heading text-2xl text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-500" />
              RECENT PAYMENTS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" data-testid="recent-payments">
              {stats?.recent_payments && stats.recent_payments.length > 0 ? (
                stats.recent_payments.map((payment, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{payment.member_name}</p>
                      <p className="text-zinc-500 text-xs font-mono">{payment.order_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-500 font-mono text-sm">₹{payment.amount?.toLocaleString()}</p>
                      <p className="text-zinc-600 text-xs">{payment.payment_method || 'Online'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-zinc-500 text-sm text-center py-8">No recent payments</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
