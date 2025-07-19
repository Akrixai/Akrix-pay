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

const reminderSchema = z.object({
  paymentId: z.string().min(1, 'Payment required'),
  channel: z.string().min(1, 'Channel required'),
  message: z.string().min(1, 'Message required'),
});

type ReminderForm = z.infer<typeof reminderSchema>;

export default function AdminRemindersPage() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{type: string, data?: any} | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Real-time subscription
  useEffect(() => {
    let sub: any;
    async function fetchData() {
      setLoading(true);
      // Assume reminders are stored in a 'reminders' table
      const { data: remindersData } = await supabase.from('reminders').select('*');
      setReminders(remindersData || []);
      const { data: paymentsData } = await supabase.from('payments').select('*');
      setPayments(paymentsData || []);
      const { data: usersData } = await supabase.from('users').select('*');
      setUsers(usersData || []);
      setLoading(false);
    }
    fetchData();
    sub = supabase
      .channel('reminders-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reminders' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  // Modal handlers
  const openAdd = () => setModal({type: 'add'});
  const closeModal = () => setModal(null);

  // Form logic
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReminderForm>({
    resolver: zodResolver(reminderSchema),
    defaultValues: { paymentId: '', channel: 'email', message: '' },
  });
  useEffect(() => {
    if (modal?.type === 'add') {
      reset({ paymentId: '', channel: 'email', message: '' });
    }
  }, [modal, reset]);

  // Add reminder
  const onAdd = async (data: ReminderForm) => {
    setActionLoading(true);
    const response = await fetch('/api/admin/send-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    setActionLoading(false);
    if (!result.success) {
      alert(result.message || 'Failed to send reminder');
      return;
    }
    closeModal();
  };

  // Filter reminders
  const filteredReminders = reminders.filter(r => {
    if (!search) return true;
    const user = users.find(u => u.id === payments.find(p => p.id === r.paymentId)?.userId);
    return (
      r.channel.toLowerCase().includes(search.toLowerCase()) ||
      r.status?.toLowerCase().includes(search.toLowerCase()) ||
      user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      payments.find(p => p.id === r.paymentId)?.amount?.toString().includes(search)
    );
  });

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-pink-200 via-blue-200 to-purple-200 animate-gradient-move">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <svg className="absolute animate-float-slow left-10 top-10 opacity-30" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#a5b4fc" /></svg>
        <svg className="absolute animate-float-fast right-20 top-32 opacity-20" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="20" fill="#f472b6" /></svg>
        <svg className="absolute animate-float-medium left-1/2 bottom-10 opacity-20" width="100" height="100" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="50" ry="30" fill="#38bdf8" /></svg>
      </div>
      <div className="relative z-10 w-full max-w-5xl mx-auto">
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl shadow-2xl px-8 py-14 flex flex-col items-center animate-fade-in">
          <div className="mb-6 animate-bounce-slow">
            <img src="/akrix-logo.png" alt="Akrix Logo" className="h-20 w-20 drop-shadow-xl" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-700 via-blue-600 to-purple-500 animate-gradient-text mb-4 text-center drop-shadow-lg">
            Reminders
          </h1>
          <p className="text-lg text-gray-700 text-center mb-8 animate-fade-in-delayed">
            View and manage all payment reminders. Send new reminders to clients instantly.
          </p>
          <div className="flex justify-between items-center w-full mb-6">
            <button className="bg-gradient-to-r from-pink-500 via-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200 animate-pop" onClick={openAdd}>Send New Reminder</button>
            <input type="text" placeholder="Search reminders..." value={search} onChange={e => setSearch(e.target.value)} className="ml-4 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-black" />
          </div>
          {loading ? <p>Loading...</p> : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full bg-white text-black rounded-lg shadow">
                <thead>
                  <tr>
                    <th className="px-4 py-2">User</th>
                    <th className="px-4 py-2">Amount</th>
                    <th className="px-4 py-2">Channel</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Sent At</th>
                    <th className="px-4 py-2">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReminders.map(reminder => {
                    const payment = payments.find(p => p.id === reminder.paymentId);
                    const user = users.find(u => u.id === payment?.userId);
                    return (
                      <tr key={reminder.id} className="border-t">
                        <td className="px-4 py-2">{user?.name || '-'}</td>
                        <td className="px-4 py-2">₹{payment?.amount || '-'}</td>
                        <td className="px-4 py-2">{reminder.channel}</td>
                        <td className="px-4 py-2">{reminder.status}</td>
                        <td className="px-4 py-2">{reminder.sentAt ? new Date(reminder.sentAt).toLocaleString() : '-'}</td>
                        <td className="px-4 py-2 max-w-xs truncate" title={reminder.message}>{reminder.message}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {/* Add Reminder Modal */}
          <Modal isOpen={!!modal && modal.type === 'add'} onClose={closeModal} title="Send New Reminder">
            <form onSubmit={handleSubmit(onAdd)} className="space-y-4">
              <div>
                <label className="block text-black">Payment</label>
                <select {...register('paymentId')} className="w-full border rounded px-3 py-2 text-black">
                  <option value="">Select Payment</option>
                  {payments.map(p => {
                    const user = users.find(u => u.id === p.userId);
                    return <option key={p.id} value={p.id}>{user?.name} - ₹{p.amount}</option>;
                  })}
                </select>
                {errors.paymentId && <p className="text-red-600 text-sm">{errors.paymentId.message}</p>}
              </div>
              <div>
                <label className="block text-black">Channel</label>
                <select {...register('channel')} className="w-full border rounded px-3 py-2 text-black">
                  <option value="email">Email</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
                {errors.channel && <p className="text-red-600 text-sm">{errors.channel.message}</p>}
              </div>
              <div>
                <label className="block text-black">Message</label>
                <textarea {...register('message')} className="w-full border rounded px-3 py-2 text-black" rows={4} />
                {errors.message && <p className="text-red-600 text-sm">{errors.message.message}</p>}
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={closeModal}>Cancel</button>
                <button type="submit" className="bg-pink-600 text-white px-4 py-2 rounded" disabled={actionLoading}>{actionLoading ? 'Sending...' : 'Send'}</button>
              </div>
            </form>
          </Modal>
        </div>
      </div>
      <style jsx global>{`
        @keyframes gradient-move {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-move {
          background-size: 200% 200%;
          animation: gradient-move 12s ease-in-out infinite;
        }
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-30px); }
        }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        @keyframes float-fast {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-50px); }
        }
        .animate-float-fast { animation: float-fast 5s ease-in-out infinite; }
        @keyframes float-medium {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        .animate-float-medium { animation: float-medium 7s ease-in-out infinite; }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 1s cubic-bezier(.4,0,.2,1) both; }
        .animate-fade-in-delayed { animation: fade-in 1.5s cubic-bezier(.4,0,.2,1) both; animation-delay: 0.5s; }
        @keyframes gradient-text {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-text {
          background-size: 200% 200%;
          animation: gradient-text 6s ease-in-out infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .animate-bounce-slow { animation: bounce-slow 2.5s infinite; }
      `}</style>
    </div>
  );
} 