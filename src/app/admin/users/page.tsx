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

const userSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  mobile: z.string().min(10, 'Mobile required'),
});

type UserForm = z.infer<typeof userSchema>;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{type: string, data?: any} | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState<{type: 'success'|'error', message: string}|null>(null);
  // Add state for error toast
  const [errorToast, setErrorToast] = useState<string | null>(null);

  // Real-time subscription
  useEffect(() => {
    let sub: any;
    async function fetchUsers() {
      setLoading(true);
      const { data } = await supabase.from('users').select('*');
      setUsers(data || []);
      setLoading(false);
    }
    fetchUsers();
    sub = supabase
      .channel('users-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchUsers)
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, []);

  // Modal handlers
  const openAdd = () => setModal({type: 'add'});
  const openEdit = (user: any) => setModal({type: 'edit', data: user});
  const openDelete = (user: any) => setModal({type: 'delete', data: user});
  const closeModal = () => setModal(null);

  // Form logic
  const { register, handleSubmit, reset, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { name: '', email: '', mobile: '' },
  });
  useEffect(() => {
    if (modal?.type === 'edit' && modal.data) {
      reset({ name: modal.data.name, email: modal.data.email, mobile: modal.data.mobile });
    } else if (modal?.type === 'add') {
      reset({ name: '', email: '', mobile: '' });
    }
  }, [modal, reset]);

  // CRUD actions
  const onAdd = async (data: UserForm) => {
    setActionLoading(true);
    try {
      // Check for duplicate email or mobile
      const { data: existing } = await supabase.from('users').select('*').or(`email.eq.${data.email},mobile.eq.${data.mobile}`);
      if (existing && existing.length > 0) {
        setErrorToast('A user with this email or mobile already exists.');
        setActionLoading(false);
        return;
      }
      await supabase.from('users').insert([data]);
      setToast({type: 'success', message: 'User added successfully!'});
    } catch (e: any) {
      setErrorToast(e.message || 'Failed to add user');
    }
    setActionLoading(false);
    closeModal();
  };
  const onEdit = async (data: UserForm) => {
    setActionLoading(true);
    try {
      await supabase.from('users').update(data).eq('id', modal?.data.id);
      setToast({type: 'success', message: 'User updated successfully!'});
    } catch (e: any) {
      setToast({type: 'error', message: e.message || 'Failed to update user'});
    }
    setActionLoading(false);
    closeModal();
  };
  const onDelete = async () => {
    setActionLoading(true);
    try {
      // Check for related payments or receipts
      const userId = modal?.data.id;
      const { data: payments } = await supabase.from('payments').select('id').eq('userId', userId);
      const { data: receipts } = await supabase.from('receipts').select('id').eq('userId', userId);
      if ((payments && payments.length > 0) || (receipts && receipts.length > 0)) {
        setErrorToast('Cannot delete user with existing payments or receipts. Please delete related records first.');
        setActionLoading(false);
        closeModal();
        return;
      }
      await supabase.from('users').delete().eq('id', userId);
      setToast({type: 'success', message: 'User deleted successfully!'});
    } catch (e: any) {
      setErrorToast(e.message || 'Failed to delete user');
    }
    setActionLoading(false);
    closeModal();
  };

  // Toast auto-hide
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  // Toast auto-hide
  useEffect(() => {
    if (errorToast) {
      const t = setTimeout(() => setErrorToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [errorToast]);

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-200 via-purple-200 to-pink-200 animate-gradient-move">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <svg className="absolute animate-float-slow left-10 top-10 opacity-30" width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="60" fill="#a5b4fc" /></svg>
        <svg className="absolute animate-float-fast right-20 top-32 opacity-20" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="20" fill="#f472b6" /></svg>
        <svg className="absolute animate-float-medium left-1/2 bottom-10 opacity-20" width="100" height="100" viewBox="0 0 100 100"><ellipse cx="50" cy="50" rx="50" ry="30" fill="#38bdf8" /></svg>
      </div>
      <div className="relative z-10 w-full max-w-4xl mx-auto">
        <div className="backdrop-blur-xl bg-white/60 border border-white/40 rounded-3xl shadow-2xl px-8 py-14 flex flex-col items-center animate-fade-in">
          <div className="mb-6 animate-bounce-slow">
            <img src="/akrix-logo.png" alt="Akrix Logo" className="h-20 w-20 drop-shadow-xl" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500 animate-gradient-text mb-4 text-center drop-shadow-lg">
            Users
          </h1>
          <p className="text-lg text-gray-700 text-center mb-8 animate-fade-in-delayed">
            Manage all users in real-time. Add, edit, or delete users instantly.
          </p>
          <div className="flex justify-between items-center w-full mb-6">
            <button className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg hover:scale-105 transition-all duration-200 animate-pop" onClick={openAdd}>Add User</button>
            <Link href="/admin"><button className="ml-4 bg-gray-200 px-4 py-2 rounded">Back to Dashboard</button></Link>
          </div>
          {loading ? <p>Loading...</p> : (
            <div className="overflow-x-auto w-full">
              <table className="min-w-full bg-white text-black rounded-lg shadow">
                <thead>
                  <tr>
                    <th className="px-4 py-2">Name</th>
                    <th className="px-4 py-2">Mobile</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-t">
                      <td className="px-4 py-2">{user.name}</td>
                      <td className="px-4 py-2">{user.mobile}</td>
                      <td className="px-4 py-2">{user.email}</td>
                      <td className="px-4 py-2 flex gap-2">
                        <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 font-bold" onClick={() => openEdit(user)}>Edit</button>
                        <button className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 font-bold" onClick={() => openDelete(user)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Add/Edit Modal */}
          <Modal isOpen={!!modal && (modal.type === 'add' || modal.type === 'edit')} onClose={closeModal} title={modal?.type === 'add' ? 'Add User' : 'Edit User'}>
            <form onSubmit={handleSubmit(modal?.type === 'add' ? onAdd : onEdit)} className="space-y-4">
              <div>
                <label className="block text-black">Name</label>
                <input {...register('name')} className="w-full border rounded px-3 py-2 text-black" />
                {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-black">Email</label>
                <input {...register('email')} className="w-full border rounded px-3 py-2 text-black" />
                {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
              </div>
              <div>
                <label className="block text-black">Mobile</label>
                <input {...register('mobile')} className="w-full border rounded px-3 py-2 text-black" />
                {errors.mobile && <p className="text-red-600 text-sm">{errors.mobile.message}</p>}
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={closeModal}>Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </Modal>
          {/* Delete Modal */}
          <Modal isOpen={!!modal && modal.type === 'delete'} onClose={closeModal} title="Delete User">
            <p>Are you sure you want to delete this user?</p>
            <div className="flex gap-2 mt-4 justify-end">
              <button className="bg-gray-300 px-4 py-2 rounded" onClick={closeModal}>Cancel</button>
              <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={onDelete} disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete'}</button>
            </div>
          </Modal>
          {/* Toast */}
          {toast && (
            <div className={`fixed bottom-8 right-8 z-50 px-6 py-4 rounded-xl shadow-lg text-white font-bold text-lg animate-pop ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
              {toast.message}
            </div>
          )}
          {errorToast && (
            <div className="fixed bottom-20 right-8 z-50 px-6 py-4 rounded-xl shadow-lg text-white font-bold text-lg animate-pop bg-red-500">
              {errorToast}
            </div>
          )}
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
        @keyframes pop {
          0% { transform: scale(0.95); }
          60% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
        .animate-pop { animation: pop 0.5s cubic-bezier(.4,0,.2,1) both; }
      `}</style>
    </div>
  );
} 