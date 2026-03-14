import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const TransferForm = () => {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        sourceLocation: 'WH/Stock',
        destinationLocation: '',
        scheduledDate: new Date().toISOString().split('T')[0],
        items: [{ product: '', demandQty: 1, doneQty: 0 }]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // For simplicity, destinations could be warehouse names or internal rack locs.
                // We'll load products for the select dropdowns.
                const [prRes] = await Promise.all([
                    api.get('/products')
                ]);
                setProducts(prRes.data);

                if (isEditing) {
                    const res = await api.get(`/transfers/${id}`);
                    const d = res.data;
                    setFormData({
                        sourceLocation: d.sourceLocation,
                        destinationLocation: d.destinationLocation,
                        scheduledDate: d.scheduledDate ? d.scheduledDate.split('T')[0] : '',
                        items: d.items.map(item => ({
                            product: item.product?._id || '',
                            demandQty: item.demandQty,
                            doneQty: item.doneQty || 0
                        }))
                    });
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
        newItems[index][field] = (field === 'demandQty' || field === 'doneQty') ? Number(value) : value;
        setFormData({...formData, items: newItems});
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { product: '', demandQty: 1, doneQty: 0 }]
        });
    };

    const handlePincodeChange = async (type, pincode) => {
        if (pincode.length === 6) {
            try {
                const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                const data = await res.json();
                if (data && data[0] && data[0].Status === 'Success') {
                    const city = data[0].PostOffice[0].District;
                    const locationString = `WH/${city}`;
                    if (type === 'source') {
                        setFormData(prev => ({ ...prev, sourceLocation: locationString }));
                    } else {
                        setFormData(prev => ({ ...prev, destinationLocation: locationString }));
                    }
                    toast.success(`Location auto-filled: ${city}`);
                } else {
                    toast.error('Invalid Pincode');
                }
            } catch (err) {
                toast.error('Failed to fetch Pincode details');
            }
        }
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
                await api.put(`/transfers/${id}`, formData);
                toast.success('Transfer Updated Successfully');
            } else {
                await api.post('/transfers', formData);
                toast.success('Transfer Created Successfully');
            }
            navigate('/transfers');
        } catch (err) {
             toast.error(err.response?.data?.message || 'Failed to save Transfer');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center space-x-4 mb-6">
            <button onClick={() => navigate('/transfers')} className="text-slate-400 hover:text-slate-200">← Back</button>
            <h1 className="text-2xl font-bold text-white">{isEditing ? '📝 Edit Internal Transfer' : '🔄 New Internal Transfer'}</h1>
          </div>
    
          <form onSubmit={handleSubmit} className="glass-panel rounded-xl shadow-md p-6 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                     <label className="block text-sm font-medium text-slate-200 mb-1">Source Pincode</label>
                     <input type="text" maxLength="6" className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 outline-none" placeholder="e.g. 110001" onChange={(e) => handlePincodeChange('source', e.target.value)} />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-slate-200 mb-1">Dest. Pincode</label>
                     <input type="text" maxLength="6" className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 outline-none" placeholder="e.g. 400001" onChange={(e) => handlePincodeChange('dest', e.target.value)} />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-slate-200 mb-1">Source Location *</label>
                     <input required type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 outline-none" value={formData.sourceLocation} onChange={(e) => setFormData({...formData, sourceLocation: e.target.value})} placeholder="e.g. WH/Stock" />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-slate-200 mb-1">Destination Location *</label>
                     <input required type="text" className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 outline-none" value={formData.destinationLocation} onChange={(e) => setFormData({...formData, destinationLocation: e.target.value})} placeholder="e.g. WH/StoreFront" />
                 </div>
                 <div>
                     <label className="block text-sm font-medium text-slate-200 mb-1">Scheduled Date</label>
                     <input type="date" required className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 outline-none" value={formData.scheduledDate} onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})} />
                 </div>
             </div>

             <div className="pt-6 border-t">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-medium text-white">Products to Transfer</h3>
                     <button type="button" onClick={addItem} className="text-sm glass-panel/10 hover:bg-white/20 hover:scale-105 transition-all text-white px-3 py-1 rounded"> + Add Item </button>
                 </div>
                 
                 <div className="space-y-4">
                     {formData.items.map((item, index) => (
                         <div key={index} className="flex flex-wrap md:flex-nowrap gap-4 items-end glass-panel/5 p-4 rounded-lg">
                             <div className="flex-1">
                                 <label className="block text-xs font-medium text-slate-400 mb-1">Product</label>
                                 <select required className="w-full px-4 py-2 border rounded outline-none" value={item.product} onChange={(e) => handleItemChange(index, 'product', e.target.value)}>
                                       {products.length === 0 ? (
                                           <option value="" disabled>No products available... Please create one first!</option>
                                       ) : (
                                           <option value="" disabled>Select Product...</option>
                                       )}
                                     {products.map(p => <option key={p._id} value={p._id}>{p.name} ({p.sku}) [Stock: {p.quantity}]</option>)}
                                 </select>
                             </div>
                             <div className="w-24">
                                <label className="block text-xs font-medium text-slate-400 mb-1">Demand Qty</label>
                                <input type="number" required min="1" className="w-full px-4 py-2 border rounded outline-none" value={item.demandQty} onChange={(e) => handleItemChange(index, 'demandQty', e.target.value)} />
                             </div>
                             {isEditing && (
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-slate-400 mb-1">Done (Actual)</label>
                                    <input type="number" required min="0" className="w-full px-4 py-2 border rounded outline-none" value={item.doneQty} onChange={(e) => handleItemChange(index, 'doneQty', e.target.value)} />
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
               <button type="button" onClick={() => navigate('/transfers')} className="px-6 py-2 border border-white/20 rounded-lg text-slate-200 hover:glass-panel/5 font-medium"> Cancel </button>
               <button type="submit" disabled={submitting} className="px-6 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-medium shadow-sm disabled:opacity-50"> {submitting ? 'Saving...' : isEditing ? 'Update Transfer' : 'Create Transfer'} </button>
             </div>
          </form>
        </div>
    );
};

export default TransferForm;