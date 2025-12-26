import React, { useState, useEffect } from 'react';
import { FileText, Download, Loader2, Users, CreditCard } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`
});

export default function AdminReports() {
  const [membersData, setMembersData] = useState([]);
  const [paymentsData, setPaymentsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const [membersRes, paymentsRes] = await Promise.all([
        axios.get(`${API}/admin/reports/members`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/reports/payments`, { headers: getAuthHeaders() })
      ]);
      setMembersData(membersRes.data.members);
      setPaymentsData(paymentsRes.data.payments);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let cell = row[header] ?? '';
          // Escape quotes and wrap in quotes if contains comma
          if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
            cell = `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Report exported successfully');
  };

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
        <h1 className="font-heading text-4xl text-white mb-2">REPORTS</h1>
        <p className="text-zinc-500">Export and analyze gym data</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Total Members</p>
            <p className="font-heading text-3xl text-white">{membersData.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Active Members</p>
            <p className="font-heading text-3xl text-green-500">
              {membersData.filter(m => m.status === 'Active').length}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Total Transactions</p>
            <p className="font-heading text-3xl text-white">{paymentsData.length}</p>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <p className="text-zinc-500 text-xs uppercase tracking-wider">Total Revenue</p>
            <p className="font-heading text-3xl text-green-500">
              ₹{paymentsData.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
          <TabsTrigger 
            value="members"
            className="data-[state=active]:bg-red-500 data-[state=active]:text-white rounded-sm"
            data-testid="tab-members"
          >
            <Users className="w-4 h-4 mr-2" />
            Members Report
          </TabsTrigger>
          <TabsTrigger 
            value="payments"
            className="data-[state=active]:bg-red-500 data-[state=active]:text-white rounded-sm"
            data-testid="tab-payments"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Payments Report
          </TabsTrigger>
        </TabsList>

        {/* Members Report */}
        <TabsContent value="members">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-2xl text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                MEMBERS REPORT
              </CardTitle>
              <Button
                onClick={() => exportToCSV(membersData, 'members_report')}
                className="bg-red-500 hover:bg-red-600 text-white rounded-sm"
                data-testid="export-members"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-500 uppercase text-xs">Name</TableHead>
                      <TableHead className="text-zinc-500 uppercase text-xs">Email</TableHead>
                      <TableHead className="text-zinc-500 uppercase text-xs">Phone</TableHead>
                      <TableHead className="text-zinc-500 uppercase text-xs">Plan</TableHead>
                      <TableHead className="text-zinc-500 uppercase text-xs">Expiry</TableHead>
                      <TableHead className="text-zinc-500 uppercase text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {membersData.slice(0, 10).map((member, index) => (
                      <TableRow key={index} className="border-zinc-800">
                        <TableCell className="text-white">{member.full_name}</TableCell>
                        <TableCell className="text-zinc-400">{member.email}</TableCell>
                        <TableCell className="text-zinc-400">{member.phone}</TableCell>
                        <TableCell className="text-zinc-400">{member.plan_name}</TableCell>
                        <TableCell className="text-zinc-400 font-mono text-sm">
                          {new Date(member.membership_expiry_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-sm text-xs ${
                            member.status === 'Active' 
                              ? 'bg-green-500/10 text-green-500' 
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {member.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {membersData.length > 10 && (
                <p className="text-zinc-500 text-sm text-center mt-4">
                  Showing 10 of {membersData.length} members. Export to see all.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Report */}
        <TabsContent value="payments">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-heading text-2xl text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-red-500" />
                PAYMENTS REPORT
              </CardTitle>
              <Button
                onClick={() => exportToCSV(paymentsData, 'payments_report')}
                className="bg-red-500 hover:bg-red-600 text-white rounded-sm"
                data-testid="export-payments"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-800">
                      <TableHead className="text-zinc-500 uppercase text-xs">Order ID</TableHead>
                      <TableHead className="text-zinc-500 uppercase text-xs">Member</TableHead>
                      <TableHead className="text-zinc-500 uppercase text-xs">Amount</TableHead>
                      <TableHead className="text-zinc-500 uppercase text-xs">Method</TableHead>
                      <TableHead className="text-zinc-500 uppercase text-xs">Date</TableHead>
                      <TableHead className="text-zinc-500 uppercase text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsData.slice(0, 10).map((payment, index) => (
                      <TableRow key={index} className="border-zinc-800">
                        <TableCell className="font-mono text-sm text-zinc-400">{payment.order_id}</TableCell>
                        <TableCell className="text-white">{payment.member_name}</TableCell>
                        <TableCell className="text-green-500 font-mono">₹{payment.amount?.toLocaleString()}</TableCell>
                        <TableCell className="text-zinc-400">{payment.payment_method || 'Online'}</TableCell>
                        <TableCell className="text-zinc-400 font-mono text-sm">
                          {payment.payment_date 
                            ? new Date(payment.payment_date).toLocaleDateString()
                            : new Date(payment.created_at).toLocaleDateString()
                          }
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-sm text-xs ${
                            payment.status === 'PAID' 
                              ? 'bg-green-500/10 text-green-500' 
                              : payment.status === 'PENDING'
                              ? 'bg-yellow-500/10 text-yellow-500'
                              : 'bg-red-500/10 text-red-500'
                          }`}>
                            {payment.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {paymentsData.length > 10 && (
                <p className="text-zinc-500 text-sm text-center mt-4">
                  Showing 10 of {paymentsData.length} payments. Export to see all.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
