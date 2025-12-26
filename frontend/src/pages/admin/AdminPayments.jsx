import React, { useEffect, useState } from 'react';
import { Plus, Search, Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Badge } from '../../components/ui/badge';
import axios from 'axios';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`
});

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    member_id: '',
    amount: '',
    payment_method: 'CASH'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [paymentsRes, membersRes] = await Promise.all([
        axios.get(`${API}/admin/payments`, { headers: getAuthHeaders() }),
        axios.get(`${API}/admin/members`, { headers: getAuthHeaders() })
      ]);
      setPayments(paymentsRes.data.payments);
      setMembers(membersRes.data.members);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${API}/admin/payments/record?member_id=${formData.member_id}&amount=${formData.amount}&payment_method=${formData.payment_method}`,
        {},
        { headers: getAuthHeaders() }
      );
      toast.success('Payment recorded successfully');
      setDialogOpen(false);
      setFormData({ member_id: '', amount: '', payment_method: 'CASH' });
      fetchData();
    } catch (error) {
      console.error('Error recording payment:', error);
      toast.error('Failed to record payment');
    }
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member?.full_name || 'Unknown';
  };

  const getStatusBadge = (status) => {
    const config = {
      PAID: { icon: CheckCircle, class: 'bg-green-500/10 text-green-500 border-green-500/20' },
      PENDING: { icon: Clock, class: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
      FAILED: { icon: XCircle, class: 'bg-red-500/10 text-red-500 border-red-500/20' }
    };
    const { icon: Icon, class: cls } = config[status] || config.PENDING;
    return (
      <Badge className={`${cls} border rounded-sm`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const filteredPayments = payments.filter(payment => {
    const memberName = getMemberName(payment.member_id).toLowerCase();
    return memberName.includes(searchTerm.toLowerCase()) ||
           payment.order_id?.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl text-white mb-2">PAYMENTS</h1>
          <p className="text-zinc-500">View and record membership payments</p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-red-500 hover:bg-red-600 text-white rounded-sm uppercase tracking-wider"
          data-testid="record-payment-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">Total Collected</p>
          <p className="font-heading text-3xl text-green-500">
            ₹{payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">Pending</p>
          <p className="font-heading text-3xl text-yellow-500">
            ₹{payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + (p.amount || 0), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
          <p className="text-zinc-500 text-xs uppercase tracking-wider">Total Transactions</p>
          <p className="font-heading text-3xl text-white">{payments.length}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <Input
          placeholder="Search by member name or order ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-white rounded-sm"
          data-testid="payment-search"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500 uppercase text-xs tracking-wider">Order ID</TableHead>
              <TableHead className="text-zinc-500 uppercase text-xs tracking-wider">Member</TableHead>
              <TableHead className="text-zinc-500 uppercase text-xs tracking-wider">Amount</TableHead>
              <TableHead className="text-zinc-500 uppercase text-xs tracking-wider">Method</TableHead>
              <TableHead className="text-zinc-500 uppercase text-xs tracking-wider">Date</TableHead>
              <TableHead className="text-zinc-500 uppercase text-xs tracking-wider">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <TableRow 
                  key={payment.id} 
                  className="border-zinc-800 table-row-hover"
                  data-testid={`payment-row-${payment.id}`}
                >
                  <TableCell className="font-mono text-sm text-zinc-400">
                    {payment.order_id}
                  </TableCell>
                  <TableCell className="text-white">
                    {getMemberName(payment.member_id)}
                  </TableCell>
                  <TableCell className="font-mono text-green-500">
                    ₹{payment.amount?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-zinc-400 text-sm">
                    {payment.payment_method || 'Online'}
                  </TableCell>
                  <TableCell className="text-zinc-500 text-sm font-mono">
                    {payment.payment_date 
                      ? new Date(payment.payment_date).toLocaleDateString()
                      : new Date(payment.created_at).toLocaleDateString()
                    }
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(payment.status)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                  No payments found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Record Payment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">RECORD PAYMENT</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4 mt-4">
            <div>
              <Label className="text-zinc-400 text-xs uppercase">Member *</Label>
              <Select
                value={formData.member_id}
                onValueChange={(value) => setFormData({...formData, member_id: value})}
              >
                <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm" data-testid="payment-form-member">
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                  {members.map(member => (
                    <SelectItem key={member.id} value={member.id} className="text-white">
                      {member.full_name} - {member.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-400 text-xs uppercase">Amount (₹) *</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                required
                min="1"
                className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm"
                data-testid="payment-form-amount"
              />
            </div>
            <div>
              <Label className="text-zinc-400 text-xs uppercase">Payment Method *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) => setFormData({...formData, payment_method: value})}
              >
                <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm" data-testid="payment-form-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="CASH" className="text-white">Cash</SelectItem>
                  <SelectItem value="CARD" className="text-white">Card</SelectItem>
                  <SelectItem value="UPI" className="text-white">UPI</SelectItem>
                  <SelectItem value="NET_BANKING" className="text-white">Net Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800 rounded-sm"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-sm"
                data-testid="payment-form-submit"
              >
                Record Payment
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
