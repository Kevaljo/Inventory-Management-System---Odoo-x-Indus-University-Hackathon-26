import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const AdjustmentForm = () => {
    const { id } = useParams();
    const isEditing = Boolean(id);
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        location: 'WH/Stock',
        reason: 'Initial Inventory',
        items: [{ product: '', countedQty: 0 }]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const prodRes = await api.get('/products');
                setProducts(prodRes.data);

                if (isEditing) {
                    const res = await api.get(`/adjustments/${id}`);
                    const d = res.data;
                    setFormData({
                        location: d.location || '',
                        reason: d.reason || '',
                        items: d.items.map(i => ({
                            product: i.product?._id || '',
                            countedQty: i.countedQty || 0
                        }))
                    });
                }
            } catch (err) {
                toast.error('Failed to load data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, isEditing]);

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = field === 'countedQty' ? Number(value) : value;
        setFormData({ ...formData, items: newItems });
    };

    const addItem = () => setFormData({ ...formData, items: [...formData.items, { product: '', countedQty: 0 }] });
    const removeItem = (index) => setFormData({ ...formData, items: formData.items.filter((_, i) => i !== index) });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (isEditing) {
                await api.put(`/adjustments/${id}`, formData);
                toast.success('Adjustment updated');
            } else {
                await api.post('/adjustments', formData);
                toast.success('Adjustment created');
            }
            navigate('/adjustments');
        } catch (err) {
            toast.error('Failed to save adjustment');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4 mb-6">
                <button onClick={() => navigate('/adjustments')} className="text-slate-400">← Back</button>
                <h1 className="text-2xl font-bold">⚖️ {isEditing ? 'Edit' : 'New'} Stock Adjustment</h1>
            </div>

            <form onSubmit={handleSubmit} className="glass-panel rounded-xl shadow-md p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium mb-1">Location</label>
                        <input required type="text" className="w-full px-4 py-2 border rounded-lg" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Reason / Note</label>
                        <input required type="text" className="w-full px-4 py-2 border rounded-lg" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})} placeholder="e.g. Annual Audit, Damage" />
                    </div>
                </div>

                <div className="pt-6 border-t">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium">Counted Products</h3>
                        <button type="button" onClick={addItem} className="text-sm glass-panel/10 px-3 py-1 rounded">+ Add Row</button>
                    </div>

                    <div className="space-y-4">
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex gap-4 items-end glass-panel/5 p-4 rounded-lg">
                                <div className="flex-1">
                                    <label className="block text-xs text-slate-400 mb-1">Product</label>
                                    <select required className="w-full px-4 py-2 border rounded" value={item.product} onChange={e => handleItemChange(index, 'product', e.target.value)}>
                                        <option value="">Select...</option>
                                        {products.map(p => <option key={p._id} value={p._id}>{p.name} (Sys Qty: {p.quantity})</option>)}
                                    </select>
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs text-slate-400 mb-1">New Physical Qty</label>
                                    <input type="number" required min="0" className="w-full px-4 py-2 border rounded" value={item.countedQty} onChange={e => handleItemChange(index, 'countedQty', e.target.value)} />
                                </div>
                                {formData.items.length > 1 && (
                                    <button type="button" onClick={() => removeItem(index)} className="text-red-500 p-2 font-bold mb-1">✕</button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4 border-t">
                    <button type="button" onClick={() => navigate('/adjustments')} className="px-6 py-2 border rounded-lg">Cancel</button>
                    <button type="submit" disabled={submitting} className="px-6 py-2 bg-red-600 text-white rounded-lg">{submitting ? 'Saving' : 'Save Adjustment'}</button>
                </div>
            </form>
        </div>
    );
};

export default AdjustmentForm;