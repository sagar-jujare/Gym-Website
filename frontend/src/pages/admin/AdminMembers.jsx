import React, { useEffect, useState } from 'react';
import { Plus, Search, Edit, Trash2, Loader2, UserCheck, UserX, X } from 'lucide-react';
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

export default function AdminMembers() {
  const [members, setMembers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    membership_plan_id: '',
    membership_start_date: new Date().toISOString().split('T')[0],
    trainer_id: ''
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
    try {
      const payload = {
        ...formData,
        membership_start_date: new Date(formData.membership_start_date).toISOString(),
        trainer_id: formData.trainer_id || null
      };

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

  const filteredMembers = members.filter(member =>
    member.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.phone?.includes(searchTerm)
  );

  const getPlanName = (planId) => plans.find(p => p.id === planId)?.name || 'Unknown';
  const getTrainerName = (trainerId) => trainers.find(t => t.id === trainerId)?.name || '-';

  const getStatusBadge = (status) => {
    const variants = {
      Active: 'bg-green-500/10 text-green-500 border-green-500/20',
      Expired: 'bg-red-500/10 text-red-500 border-red-500/20',
      Suspended: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
    };
    return variants[status] || variants.Active;
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
              filteredMembers.map((member) => (
                <TableRow 
                  key={member.id} 
                  className="border-zinc-800 table-row-hover"
                  data-testid={`member-row-${member.id}`}
                >
                  <TableCell>
                    <div>
                      <p className="text-white font-medium">{member.full_name}</p>
                      <p className="text-zinc-500 text-xs">Trainer: {getTrainerName(member.trainer_id)}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-zinc-300 text-sm">{member.email}</p>
                    <p className="text-zinc-500 text-xs">{member.phone}</p>
                  </TableCell>
                  <TableCell className="text-zinc-300">{getPlanName(member.membership_plan_id)}</TableCell>
                  <TableCell className="text-zinc-400 text-sm font-mono">
                    {new Date(member.membership_expiry_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={`${getStatusBadge(member.status)} border rounded-sm`}>
                      {member.status === 'Active' ? (
                        <UserCheck className="w-3 h-3 mr-1" />
                      ) : (
                        <UserX className="w-3 h-3 mr-1" />
                      )}
                      {member.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenDialog(member)}
                      className="text-zinc-400 hover:text-white"
                      data-testid={`edit-member-${member.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(member.id)}
                      className="text-zinc-400 hover:text-red-500"
                      data-testid={`delete-member-${member.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
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

      {/* Add/Edit Dialog */}
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
                      <SelectItem value="Expired" className="text-white">Expired</SelectItem>
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
    </div>
  );
}
