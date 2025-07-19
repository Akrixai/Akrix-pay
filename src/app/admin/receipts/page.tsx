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

const receiptSchema = z.object({
  paymentId: z.string().min(1, 'Payment required'),
  receiptNumber: z.string().min(1, 'Receipt # required'),
  generatedAt: z.string().min(1, 'Date required'),
});

type ReceiptForm = z.infer<typeof receiptSchema>;

export default function AdminReceiptsPage() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{type: string, data?: any} | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Real-time subscription
  useEffect(() => {
    let sub: any, paySub: any;
    async function fetchData() {
      setLoading(true);
      const { data: receiptsData } = await supabase.from('receipts').select('*');
      setReceipts(receiptsData || []);
      const { data: paymentsData } = await supabase.from('payments').select('*');
      setPayments(paymentsData || []);
      setLoading(false);
    }
    fetchData();
    sub = supabase
      .channel('receipts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'receipts' }, fetchData)
      .subscribe();
    paySub = supabase
      .channel('payments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(sub); supabase.removeChannel(paySub); };
  }, []);

  // Modal handlers
  const openAdd = () => setModal({type: 'add'});
  const openEdit = (receipt: any) => setModal({type: 'edit', data: receipt});
  const openDelete = (receipt: any) => setModal({type: 'delete', data: receipt});
  const closeModal = () => setModal(null);

  // Form logic
  const { register, handleSubmit, reset, formState: { errors } } = useForm<ReceiptForm>({
    resolver: zodResolver(receiptSchema),
    defaultValues: { paymentId: '', receiptNumber: '', generatedAt: '' },
  });
  useEffect(() => {
    if (modal?.type === 'edit' && modal.data) {
      reset({ paymentId: modal.data.paymentId, receiptNumber: modal.data.receiptNumber, generatedAt: modal.data.generatedAt });
    } else if (modal?.type === 'add') {
      reset({ paymentId: '', receiptNumber: '', generatedAt: '' });
    }
  }, [modal, reset]);

  // CRUD actions
  const onAdd = async (data: ReceiptForm) => {
    setActionLoading(true);
    await supabase.from('receipts').insert([data]);
    setActionLoading(false);
    closeModal();
  };
  const onEdit = async (data: ReceiptForm) => {
    setActionLoading(true);
    await supabase.from('receipts').update(data).eq('id', modal?.data.id);
    setActionLoading(false);
    closeModal();
  };
  const onDelete = async () => {
    setActionLoading(true);
    await supabase.from('receipts').delete().eq('id', modal?.data.id);
    setActionLoading(false);
    closeModal();
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-white to-purple-100 flex flex-col items-center justify-start">
      <div className="w-full max-w-5xl mx-auto mt-8 mb-12 px-2 sm:px-4 md:px-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Receipts</h1>
          <Link href="/admin"><button className="bg-gray-200 px-4 py-2 rounded">Back to Dashboard</button></Link>
        </div>
        <button className="mb-4 bg-blue-600 text-white px-4 py-2 rounded" onClick={openAdd}>Add Receipt</button>
        {loading ? <p>Loading...</p> : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white text-black rounded-lg shadow">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-black">Receipt #</th>
                  <th className="px-4 py-2 text-black">Payment</th>
                  <th className="px-4 py-2 text-black">Generated At</th>
                  <th className="px-4 py-2 text-black">Actions</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map(receipt => (
                  <tr key={receipt.id} className="border-t">
                    <td className="px-4 py-2 text-black">{receipt.receiptNumber}</td>
                    <td className="px-4 py-2 text-black">{payments.find(p => p.id === receipt.paymentId)?.amount || '-'}</td>
                    <td className="px-4 py-2 text-black">{receipt.generatedAt}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => openEdit(receipt)}>Edit</button>
                      <button className="bg-red-600 text-white px-3 py-1 rounded" onClick={() => openDelete(receipt)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Add/Edit Modal */}
        <Modal isOpen={!!modal && (modal.type === 'add' || modal.type === 'edit')} onClose={closeModal} title={modal?.type === 'add' ? 'Add Receipt' : 'Edit Receipt'}>
          <form onSubmit={handleSubmit(modal?.type === 'add' ? onAdd : onEdit)} className="space-y-4">
            <div>
              <label className="block text-black">Payment</label>
              <select {...register('paymentId')} className="w-full border rounded px-3 py-2 text-black">
                <option value="">Select Payment</option>
                {payments.map(p => <option key={p.id} value={p.id}>{p.amount}</option>)}
              </select>
              {errors.paymentId && <p className="text-red-600 text-sm">{errors.paymentId.message}</p>}
            </div>
            <div>
              <label className="block text-black">Receipt #</label>
              <input {...register('receiptNumber')} className="w-full border rounded px-3 py-2 text-black" />
              {errors.receiptNumber && <p className="text-red-600 text-sm">{errors.receiptNumber.message}</p>}
            </div>
            <div>
              <label className="block text-black">Generated At</label>
              <input type="datetime-local" {...register('generatedAt')} className="w-full border rounded px-3 py-2 text-black" />
              {errors.generatedAt && <p className="text-red-600 text-sm">{errors.generatedAt.message}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" className="bg-gray-300 px-4 py-2 rounded" onClick={closeModal}>Cancel</button>
              <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={actionLoading}>{actionLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </Modal>
        {/* Delete Modal */}
        <Modal isOpen={!!modal && modal.type === 'delete'} onClose={closeModal} title="Delete Receipt">
          <p>Are you sure you want to delete this receipt?</p>
          <div className="flex gap-2 mt-4 justify-end">
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={closeModal}>Cancel</button>
            <button className="bg-red-600 text-white px-4 py-2 rounded" onClick={onDelete} disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete'}</button>
          </div>
        </Modal>
      </div>
    </div>
  );
} 