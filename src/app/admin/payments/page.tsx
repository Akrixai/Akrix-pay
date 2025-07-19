"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Modal from '@/components/Modal';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const paymentSchema = z.object({
  userId: z.string().min(1, 'User required'),
  amount: z.number().min(1, 'Amount required'),
  paymentMode: z.string().min(1, 'Mode required'),
  status: z.string().min(1, 'Status required'),
});

type PaymentForm = z.infer<typeof paymentSchema>;

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{type: string, data?: any} | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Real-time subscription
  useEffect(() => {
    let sub: any, userSub: any;
    async function fetchData() {
      setLoading(true);
      const { data: paymentsData } = await supabase.from('payments').select('*');
      setPayments(paymentsData || []);
      const { data: usersData } = await supabase.from('users').select('*');
      setUsers(usersData || []);
      setLoading(false);
    }
    fetchData();
    sub = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchData)
      .subscribe();
    userSub = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(sub); supabase.removeChannel(userSub); };
  }, []);

  // Modal handlers
  const openAdd = () => setModal({type: 'add'});
  const openEdit = (payment: any) => setModal({type: 'edit', data: payment});
  const openDelete = (payment: any) => setModal({type: 'delete', data: payment});
  const openReminder = (payment: any) => setModal({type: 'reminder', data: payment});
  const closeModal = () => setModal(null);

  // Form logic
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: { userId: '', amount: 0, paymentMode: '', status: '' },
  });
  useEffect(() => {
    if (modal?.type === 'edit' && modal.data) {
      reset({ userId: modal.data.userId, amount: modal.data.amount, paymentMode: modal.data.paymentMode, status: modal.data.status });
    } else if (modal?.type === 'add') {
      reset({ userId: '', amount: 0, paymentMode: '', status: '' });
    }
  }, [modal, reset]);

  // CRUD actions
  const onAdd = async (data: PaymentForm) => {
    setActionLoading(true);
    await supabase.from('payments').insert([{...data, amount: Number(data.amount)}]);
    setActionLoading(false);
    closeModal();
  };
  const onEdit = async (data: PaymentForm) => {
    setActionLoading(true);
    await supabase.from('payments').update({...data, amount: Number(data.amount)}).eq('id', modal?.data.id);
    setActionLoading(false);
    closeModal();
  };
  const onDelete = async () => {
    setActionLoading(true);
    await supabase.from('payments').delete().eq('id', modal?.data.id);
    setActionLoading(false);
    closeModal();
  };

  // Reminder logic
  const { register: reminderRegister, handleSubmit: handleReminderSubmit, reset: resetReminder, formState: { errors: reminderErrors } } = useForm<{ channel: string; message: string }>({
    defaultValues: { channel: 'email', message: '' },
  });
  const onSendReminder = async (data: { channel: string; message: string }) => {
    setActionLoading(true);
    await fetch('/api/admin/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentId: modal?.data.id, ...data }),
    });
    setActionLoading(false);
    closeModal();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-100 flex flex-col items-center justify-start">
      <div className="w-full max-w-5xl mx-auto mt-8 mb-12 px-2 sm:px-4 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Payments</h1>
          <Link href="/admin"><button className="bg-gray-200 px-4 py-2 rounded">Back to Dashboard</button></Link>
        </div>
        <button className="mb-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={openAdd}>Add Payment</button>
        {loading ? <p>Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white text-black rounded-lg shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-black">User</th>
                  <th className="px-4 py-2 text-black">Amount</th>
                  <th className="px-4 py-2 text-black">Mode</th>
                  <th className="px-4 py-2 text-black">Status</th>
                  <th className="px-4 py-2 text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment.id} className="border-t">
                    <td className="px-4 py-2 text-black">{users.find(u => u.id === payment.userId)?.name || '-'}</td>
                    <td className="px-4 py-2 text-black">₹{payment.amount}</td>
                    <td className="px-4 py-2 text-black">{payment.paymentMode}</td>
                    <td className="px-4 py-2 text-black">{payment.status}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => openEdit(payment)}>Edit</button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => openDelete(payment)}>Delete</button>
                      <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => openReminder(payment)}>Send Reminder</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Add/Edit Modal */}
        <Modal isOpen={!!modal && (modal.type === 'add' || modal.type === 'edit')} onClose={closeModal} title={modal?.type === 'add' ? 'Add Payment' : 'Edit Payment'}>
          <form onSubmit={handleSubmit(modal?.type === 'add' ? onAdd : onEdit)} className="space-y-4">
            <div>
              <label className="block text-black">User</label>
              <select {...register('userId')} className="w-full border rounded px-3 py-2 text-black">
                <option value="">Select User</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
              {errors.userId && <p className="text-red-600 text-sm">{errors.userId.message}</p>}
            </div>
            <div>
              <label className="block text-black">Amount</label>
              <input type="number" {...register('amount', { valueAsNumber: true })} className="w-full border rounded px-3 py-2 text-black" />
              {errors.amount && <p className="text-red-600 text-sm">{errors.amount.message}</p>}
            </div>
            <div>
              <label className="block text-black">Mode</label>
              <input {...register('paymentMode')} className="w-full border rounded px-3 py-2 text-black" />
              {errors.paymentMode && <p className="text-red-600 text-sm">{errors.paymentMode.message}</p>}
            </div>
            <div>
              <label className="block text-black">Status</label>
              <input {...register('status')} className="w-full border rounded px-3 py-2 text-black" />
              {errors.status && <p className="text-red-600 text-sm">{errors.status.message}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={closeModal}>Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </Modal>
        {/* Delete Modal */}
        <Modal isOpen={!!modal && modal.type === 'delete'} onClose={closeModal} title="Delete Payment">
          <p>Are you sure you want to delete this payment?</p>
          <div className="flex gap-2 mt-4 justify-end">
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={closeModal}>Cancel</button>
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={onDelete} disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete'}</button>
          </div>
        </Modal>
        {/* Reminder Modal */}
        <Modal isOpen={!!modal && modal.type === 'reminder'} onClose={closeModal} title="Send Reminder">
          <form onSubmit={handleReminderSubmit(onSendReminder)} className="space-y-4">
            <div>
              <label className="block text-black">Channel</label>
              <select {...reminderRegister('channel')} className="w-full border rounded px-3 py-2 text-black">
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
              </select>
            </div>
            <div>
              <label className="block text-black">Message</label>
              <textarea {...reminderRegister('message')} className="w-full border rounded px-3 py-2 text-black" rows={4} />
              {reminderErrors.message && <p className="text-red-600 text-sm">{reminderErrors.message.message}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={closeModal}>Cancel</button>
              <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded" disabled={actionLoading}>{actionLoading ? 'Sending...' : 'Send'}</button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
} 