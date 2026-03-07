import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, UserCheck, UserX, MessageCircle, RefreshCw } from 'lucide-react';
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
const GYM_NAME = "Iron & Neon Gym";

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`
});

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [renewDialogOpen, setRenewDialogOpen] = useState(false);
  const [selectedMemberForRenewal, setSelectedMemberForRenewal] = useState(null);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    emergency_contact: '',
    address: '',
    membership_plan_id: '',
    membership_start_date: new Date().toISOString().split('T')[0],
    trainer_id: ''
  });
  const [renewFormData, setRenewFormData] = useState({
    duration_months: 1,
    amount: 1999,
    payment_method: 'CASH'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [membersRes, plansRes, trainersRes] = await Promise.all([
        axios.get(`${API}/admin/members`, { headers: getAuthHeaders() }),
        axios.get(`${API}/plans`),
        axios.get(`${API}/trainers`)
      ]);
      setMembers(membersRes.data.members);
      setPlans(plansRes.data.plans);
      setTrainers(trainersRes.data.trainers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load members');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (member = null) => {
    if (member) {
      setEditingMember(member);
      setFormData({
        full_name: member.full_name,
        email: member.email,
        phone: member.phone,
        emergency_contact: member.emergency_contact || '',
        address: member.address,
        membership_plan_id: member.membership_plan_id,
        membership_start_date: member.membership_start_date?.split('T')[0] || '',
        trainer_id: member.trainer_id || '',
        status: member.status
      });
    } else {
      setEditingMember(null);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        emergency_contact: '',
        address: '',
        membership_plan_id: '',
        membership_start_date: new Date().toISOString().split('T')[0],
        trainer_id: ''
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.membership_plan_id) {
      toast.error('Please select a membership plan');
      return;
    }
    
    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        emergency_contact: formData.emergency_contact || null,
        address: formData.address,
        membership_plan_id: formData.membership_plan_id,
        membership_start_date: new Date(formData.membership_start_date).toISOString(),
        trainer_id: (formData.trainer_id && formData.trainer_id !== 'none') ? formData.trainer_id : null
      };
      
      // Add status for updates
      if (editingMember && formData.status) {
        payload.status = formData.status;
      }

      if (editingMember) {
        await axios.put(
          `${API}/admin/members/${editingMember.id}`,
          payload,
          { headers: getAuthHeaders() }
        );
        toast.success('Member updated successfully');
      } else {
        await axios.post(
          `${API}/admin/members`,
          payload,
          { headers: getAuthHeaders() }
        );
        toast.success('Member created successfully');
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving member:', error);
      toast.error(error.response?.data?.detail || 'Failed to save member');
    }
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      await axios.delete(`${API}/admin/members/${memberId}`, { headers: getAuthHeaders() });
      toast.success('Member deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting member:', error);
      toast.error('Failed to delete member');
    }
  };

  // Open renewal dialog for inactive/expired members
  const handleOpenRenewDialog = (member) => {
    setSelectedMemberForRenewal(member);
    setRenewFormData({
      duration_months: 1,
      amount: 1999,
      payment_method: 'CASH'
    });
    setRenewDialogOpen(true);
  };

  // Handle membership renewal
  const handleRenewMembership = async (e) => {
    e.preventDefault();
    if (!selectedMemberForRenewal) return;

    try {
      await axios.post(
        `${API}/admin/members/renew`,
        {
          member_id: selectedMemberForRenewal.id,
          duration_months: parseInt(renewFormData.duration_months),
          amount: parseFloat(renewFormData.amount),
          payment_method: renewFormData.payment_method
        },
        { headers: getAuthHeaders() }
      );
      toast.success(`Membership renewed for ${renewFormData.duration_months} month(s)`);
      setRenewDialogOpen(false);
      setSelectedMemberForRenewal(null);
      fetchData();
    } catch (error) {
      console.error('Error renewing membership:', error);
      toast.error(error.response?.data?.detail || 'Failed to renew membership');
    }
  };

  // Open WhatsApp chat with prefilled message
  const handleChatWithMember = (member) => {
    const expiryDate = new Date(member.membership_expiry_date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    
    const isExpired = new Date(member.membership_expiry_date) < new Date();
    
    let message;
    if (isExpired) {
      message = `Hi ${member.full_name},\n\nThis is a reminder from ${GYM_NAME}.\n\nYour gym membership expired on ${expiryDate}.\n\nWe would love to have you back! Please visit us or reply to this message to renew your membership and continue your fitness journey.\n\nThank you,\n${GYM_NAME} Team`;
    } else {
      message = `Hi ${member.full_name},\n\nThis is a reminder from ${GYM_NAME}.\n\nYour gym membership is expiring on ${expiryDate}.\n\nPlease renew your membership before the expiry date to continue enjoying our facilities without interruption.\n\nThank you,\n${GYM_NAME} Team`;
    }
    
    // Format phone number (remove spaces, dashes, and ensure it starts with country code)
    let phone = member.phone.replace(/[\s-]/g, '');
    if (!phone.startsWith('+')) {
      // Assume Indian number if no country code
      if (phone.startsWith('0')) {
        phone = '91' + phone.substring(1);
      } else if (!phone.startsWith('91')) {
        phone = '91' + phone;
      }
    } else {
      phone = phone.substring(1); // Remove the + for WhatsApp URL
    }
    
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredMembers = members.filter(member =>
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone?.includes(searchTerm)
  );

  const getPlanName = (planId) => plans.find(p => p.id === planId)?.name || 'Unknown';
  const getTrainerName = (trainerId) => trainers.find(t => t.id === trainerId)?.name || '-';

  const getStatusBadge = (status, expiryDate) => {
    // Check if membership is expired
    const isExpired = new Date(expiryDate) < new Date();
    const displayStatus = isExpired ? 'Inactive' : status;
    
    const variants = {
      Active: 'bg-green-500/10 text-green-500 border-green-500/20',
      Inactive: 'bg-red-500/10 text-red-500 border-red-500/20',
      Expired: 'bg-red-500/10 text-red-500 border-red-500/20',
      Suspended: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    };
    return { className: variants[displayStatus] || variants.Inactive, status: displayStatus };
  };

  const isExpiredOrInactive = (member) => {
    return new Date(member.membership_expiry_date) < new Date() || 
           member.status === 'Inactive' || 
           member.status === 'Expired';
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-4xl text-white mb-2">MEMBERS</h1>
          <p className="text-zinc-500">Manage gym members and their memberships</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="bg-red-500 hover:bg-red-600 text-white rounded-sm uppercase tracking-wider"
          data-testid="add-member-btn"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Member
        </Button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <Input
          placeholder="Search by name, email, or phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-white rounded-sm"
          data-testid="member-search"
        />
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-500 uppercase text-xs tracking-wider">Name</TableHead>
              <TableHead className="text-zinc-500 uppercase text-xs tracking-wider">Contact</TableHead>
              <TableHead className="text-zinc-500 uppercase text-xs tracking-wider">Plan</TableHead>
              <TableHead className="text-zinc-500 uppercase text-xs tracking-wider">Expiry</TableHead>
              <TableHead className="text-zinc-500 uppercase text-xs tracking-wider">Status</TableHead>
              <TableHead className="text-zinc-500 uppercase text-xs tracking-wider text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMembers.length > 0 ? (
              filteredMembers.map((member) => {
                const statusInfo = getStatusBadge(member.status, member.membership_expiry_date);
                const showRenewButton = isExpiredOrInactive(member);
                
                return (
                  <TableRow 
                    key={member.id} 
                    className="border-zinc-800 table-row-hover"
                    data-testid={`member-row-${member.id}`}
                  >
                    <TableCell>
                      <div>
                        <p className="text-white font-medium">{member.full_name}</p>
                        <p className="text-zinc-500 text-xs">Trainer: {member.trainer_name || getTrainerName(member.trainer_id)}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-zinc-300 text-sm">{member.email}</p>
                      <p className="text-zinc-500 text-xs">{member.phone}</p>
                      {member.emergency_contact && (
                        <p className="text-yellow-500 text-xs">Emergency: {member.emergency_contact}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-zinc-300">{getPlanName(member.membership_plan_id)}</TableCell>
                    <TableCell className="text-zinc-400 text-sm font-mono">
                      {new Date(member.membership_expiry_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${statusInfo.className} border rounded-sm`}>
                        {statusInfo.status === 'Active' ? (
                          <UserCheck className="w-3 h-3 mr-1" />
                        ) : (
                          <UserX className="w-3 h-3 mr-1" />
                        )}
                        {statusInfo.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Chat Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleChatWithMember(member)}
                          className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                          data-testid={`chat-member-${member.id}`}
                          title="Chat on WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        
                        {/* Renew Button (only for expired/inactive) */}
                        {showRenewButton && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenRenewDialog(member)}
                            className="text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                            data-testid={`renew-member-${member.id}`}
                            title="Renew Membership"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {/* Edit Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(member)}
                          className="text-zinc-400 hover:text-white"
                          data-testid={`edit-member-${member.id}`}
                          title="Edit Member"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        
                        {/* Delete Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(member.id)}
                          className="text-zinc-400 hover:text-red-500"
                          data-testid={`delete-member-${member.id}`}
                          title="Delete Member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-zinc-500">
                  No members found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Member Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {editingMember ? 'EDIT MEMBER' : 'ADD NEW MEMBER'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-zinc-400 text-xs uppercase">Full Name *</Label>
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm"
                  data-testid="member-form-name"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase">Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm"
                  data-testid="member-form-email"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase">Phone *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  required
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm"
                  data-testid="member-form-phone"
                />
              </div>
              <div className="col-span-2">
                <Label className="text-zinc-400 text-xs uppercase">Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm"
                  data-testid="member-form-address"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase">Membership Plan *</Label>
                <Select
                  value={formData.membership_plan_id}
                  onValueChange={(value) => setFormData({...formData, membership_plan_id: value})}
                >
                  <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm" data-testid="member-form-plan">
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id} className="text-white">
                        {plan.name} - ₹{plan.price}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase">Start Date *</Label>
                <Input
                  type="date"
                  value={formData.membership_start_date}
                  onChange={(e) => setFormData({...formData, membership_start_date: e.target.value})}
                  required
                  className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm"
                  data-testid="member-form-date"
                />
              </div>
              <div>
                <Label className="text-zinc-400 text-xs uppercase">Trainer (Optional)</Label>
                <Select
                  value={formData.trainer_id || 'none'}
                  onValueChange={(value) => setFormData({...formData, trainer_id: value === 'none' ? '' : value})}
                >
                  <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm" data-testid="member-form-trainer">
                    <SelectValue placeholder="Select trainer" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="none" className="text-white">No Trainer</SelectItem>
                    {trainers.map(trainer => (
                      <SelectItem key={trainer.id} value={trainer.id} className="text-white">
                        {trainer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editingMember && (
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({...formData, status: value})}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm" data-testid="member-form-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="Active" className="text-white">Active</SelectItem>
                      <SelectItem value="Inactive" className="text-white">Inactive</SelectItem>
                      <SelectItem value="Suspended" className="text-white">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                data-testid="member-form-submit"
              >
                {editingMember ? 'Update Member' : 'Add Member'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Renew Membership Dialog */}
      <Dialog open={renewDialogOpen} onOpenChange={setRenewDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              RENEW MEMBERSHIP
            </DialogTitle>
          </DialogHeader>
          {selectedMemberForRenewal && (
            <div className="mt-4">
              <div className="bg-zinc-800 rounded-sm p-4 mb-4">
                <p className="text-white font-medium">{selectedMemberForRenewal.full_name}</p>
                <p className="text-zinc-500 text-sm">{selectedMemberForRenewal.email}</p>
                <p className="text-red-500 text-sm mt-2">
                  Expired: {new Date(selectedMemberForRenewal.membership_expiry_date).toLocaleDateString()}
                </p>
              </div>
              
              <form onSubmit={handleRenewMembership} className="space-y-4">
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">Duration</Label>
                  <Select
                    value={renewFormData.duration_months.toString()}
                    onValueChange={(value) => {
                      const months = parseInt(value);
                      let amount = 1999;
                      if (months === 3) amount = 4999;
                      if (months === 12) amount = 14999;
                      setRenewFormData({...renewFormData, duration_months: months, amount});
                    }}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="1" className="text-white">1 Month - ₹1,999</SelectItem>
                      <SelectItem value="3" className="text-white">3 Months - ₹4,999</SelectItem>
                      <SelectItem value="12" className="text-white">12 Months - ₹14,999</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">Amount (₹)</Label>
                  <Input
                    type="number"
                    value={renewFormData.amount}
                    onChange={(e) => setRenewFormData({...renewFormData, amount: e.target.value})}
                    className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm"
                  />
                </div>
                
                <div>
                  <Label className="text-zinc-400 text-xs uppercase">Payment Method</Label>
                  <Select
                    value={renewFormData.payment_method}
                    onValueChange={(value) => setRenewFormData({...renewFormData, payment_method: value})}
                  >
                    <SelectTrigger className="mt-1 bg-zinc-800 border-zinc-700 text-white rounded-sm">
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
                    onClick={() => setRenewDialogOpen(false)}
                    className="flex-1 border-zinc-700 text-zinc-400 hover:bg-zinc-800 rounded-sm"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white rounded-sm"
                    data-testid="renew-form-submit"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Renew & Record Payment
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
