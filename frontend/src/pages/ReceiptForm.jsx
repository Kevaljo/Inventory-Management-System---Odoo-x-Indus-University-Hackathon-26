import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ReceiptForm = () => {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        supplier: '',
        warehouse: '',
        location: 'Receiving Dock',
        scheduledDate: new Date().toISOString().split('T')[0],
        items: [{ product: '', orderedQty: 1, receivedQty: 0 }]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [whRes, prRes] = await Promise.all([
                    api.get('/warehouses'),
                    api.get('/products')
                ]);
                setWarehouses(whRes.data);
                setProducts(prRes.data);

                if (isEditing) {
                    const res = await api.get(`/receipts/${id}`);
                    const d = res.data;
                    setFormData({
                        supplier: d.supplier,
                        warehouse: d.warehouse?._id || '',
                        location: d.location || '',
                        scheduledDate: d.scheduledDate ? d.scheduledDate.split('T')[0] : '',
                        items: d.items.map(item => ({
                            product: item.product?._id || '',
                            orderedQty: item.orderedQty,
                            receivedQty: item.receivedQty || 0
                        }))
                    });
                } else if (whRes.data.length > 0) {
                    setFormData(prev => ({...prev, warehouse: whRes.data[0]._id}));
                }
            } catch (err) {
                toast.error('Failed to load required data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEditing]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = (field === 'orderedQty' || field === 'receivedQty') ? Number(value) : value;
        setFormData({...formData, items: newItems});
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { product: '', orderedQty: 1, receivedQty: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({...formData, items: newItems});
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing) {
                await api.put(`/receipts/${id}`, formData);
                toast.success('Receipt Updated Successfully');
            } else {
                await api.post('/receipts', formData);
                toast.success('Receipt Created Successfully');
            }
            navigate('/receipts');
        } catch (err) {
             toast.error(err.response?.data?.message || 'Failed to save Receipt');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center space-x-4 mb-6">
            <button onClick={() => navigate('/receipts')} className="text-slate-400 hover:text-slate-200">← Back</button>
            <h1 className="text-2xl font-bold text-white">{isEditing ? '📝 Edit Receipt' : '📥 New Receipt (Incoming)'}</h1>
          </div>
    
          <form onSubmit={handleSubmit} className="glass-panel rounded-xl shadow-md p-6 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">Supplier Name *</label>
                    <input required type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 outline-none" value={formData.supplier} onChange={(e) => setFormData({...formData, supplier: e.target.value})} placeholder="e.g. Globex Corp"/>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-200 mb-1">Destination Warehouse *</label>
                    <select required className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 outline-none" value={formData.warehouse} onChange={(e) => setFormData({...formData, warehouse: e.target.value})}>
                          {warehouses.length === 0 ? (
                              <option value="" disabled>No warehouses available... Please create one first!</option>
                          ) : (
                              <option value="" disabled>Select Warehouse</option>
                          )}
                        {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
                    </select>
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-slate-200 mb-1">Internal Location</label>
                     <input type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 outline-none" value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} placeholder="e.g. Receiving Dock" />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-slate-200 mb-1">Scheduled Date</label>
                     <input type="date" required className="w-full px-4 py-2 border rounded-lg focus:ring-purple-500 outline-none" value={formData.scheduledDate} onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})} />
                 </div>
             </div>

             <div className="pt-6 border-t">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-medium text-white">Products Receiving</h3>
                     <button type="button" onClick={addItem} className="text-sm glass-panel/10 hover:bg-white/20 hover:scale-105 transition-all text-white px-3 py-1 rounded"> + Add Item </button>
                 </div>
                 
                 <div className="space-y-4">
                     {formData.items.map((item, index) => (
                         <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-end glass-panel/5 p-4 rounded-lg">
                             <div className="flex-1">
                                 <label className="block text-xs font-medium text-slate-400 mb-1">Product</label>
                                 <select required className="w-full px-4 py-2 border rounded outline-none" value={item.product} onChange={(e) => handleItemChange(index, 'product', e.target.value)}>
                                     <option value="">Select Product...</option>
                                     {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>)}
                                 </select>
                             </div>
                             <div className="w-24">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Ordered Qty</label>
                                <input type="number" required min="1" className="w-full px-4 py-2 border rounded outline-none" value={item.orderedQty} onChange={(e) => handleItemChange(index, 'orderedQty', e.target.value)} />
                             </div>
                             {isEditing && (
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Received (Actual)</label>
                                    <input type="number" required min="0" className="w-full px-4 py-2 border rounded outline-none" value={item.receivedQty} onChange={(e) => handleItemChange(index, 'receivedQty', e.target.value)} />
                                </div>
                             )}
                             {formData.items.length > 1 && (
                                 <button type="button" onClick={() => removeItem(index)} className="text-red-500 hover:text-rose-400 p-2 font-bold mb-1">✕</button>
                             )}
                         </div>
                     ))}
                 </div>
             </div>

             <div className="flex justify-end space-x-4 pt-4 border-t">
               <button type="button" onClick={() => navigate('/receipts')} className="px-6 py-2 border border-white/20 rounded-lg text-slate-200 hover:glass-panel/5 font-medium"> Cancel </button>
               <button type="submit" disabled={submitting} className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-medium shadow-sm disabled:opacity-50"> {submitting ? 'Saving...' : isEditing ? 'Update Receipt' : 'Create Receipt'} </button>
             </div>
          </form>
        </div>
    );
};

export default ReceiptForm;