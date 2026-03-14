import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { toast } from 'react-toastify';

const ProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [skuMode, setSkuMode] = useState('auto'); // 'auto' or 'manual'
  const [previewSku, setPreviewSku] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitOfMeasure: 'Units',
    totalStock: 0,
    reorderLevel: 10,
    reorderQty: 50,
    description: ''
  });

  const uomOptions = ['Units', 'Kg', 'Liters', 'Meters', 'Boxes', 'Pieces', 'Tons', 'Gallons'];

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const catRes = await api.get('/categories');
        setCategories(catRes.data);

        if (isEditing) {
          const prodRes = await api.get(`/products/${id}`);
          const p = prodRes.data;
          setFormData({
            name: p.name,
            sku: p.sku,
            category: p.category?._id || '',
            unitOfMeasure: p.unitOfMeasure,
            totalStock: p.totalStock,
            reorderLevel: p.reorderLevel,
            reorderQty: p.reorderQty,
            description: p.description || ''
          });
          setSkuMode('manual');
        } else if (catRes.data.length > 0) {
           setFormData(prev => ({...prev, category: catRes.data[0]._id}));
        }
      } catch (err) {
        toast.error('Failed to load form data');
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [id, isEditing]);

  useEffect(() => {
    if (skuMode === 'auto' && formData.name && formData.category) {
      const getSkuPreview = async () => {
        try {
          const res = await api.post('/products/preview-sku', {
            categoryId: formData.category,
            productName: formData.name
          });
          setPreviewSku(res.data.sku);
        } catch (e) {
          console.error(e);
        }
      };
      
      const timeoutId = setTimeout(getSkuPreview, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [formData.name, formData.category, skuMode]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const payload = { ...formData };
      if (skuMode === 'auto' && !isEditing) {
        delete payload.sku; // Let backend generate it
      }

      if (isEditing) {
        await api.put(`/products/${id}`, payload);
        toast.success('Product updated successfully');
      } else {
        await api.post('/products', payload);
        toast.success('Product created successfully');
      }
      navigate('/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate('/products')} className="text-slate-400 hover:text-slate-200">← Back</button>
        <h1 className="text-2xl font-bold text-white">{isEditing ? '✏️ Edit Product' : '➕ New Product'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel rounded-xl shadow-md p-6 space-y-6">
        {/* Row 1 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Product Name *</label>
            <input 
              type="text" required name="name"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
              value={formData.name} onChange={handleChange} placeholder="e.g. Premium Widget"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-slate-200">SKU / Code</label>
              {!isEditing && (
                <button type="button" onClick={() => setSkuMode(skuMode === 'auto' ? 'manual' : 'auto')} className={`text-xs px-2 py-1 rounded-md font-medium ${skuMode === 'auto' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'glass-panel/10 text-slate-300'}`}>
                  {skuMode === 'auto' ? '🤖 Auto' : '✏️ Manual'}
                </button>
              )}
            </div>
            
            {skuMode === 'auto' && !isEditing ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono px-4 py-2 rounded-lg pb-6 relative">
                 {previewSku || 'Waiting for name/category...'}
                 <span className="absolute bottom-1 right-2 text-[10px] text-emerald-400/70">Auto-generated</span>
              </div>
            ) : (
              <input 
                type="text" name="sku" required={!isEditing && skuMode === 'manual'}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                value={formData.sku} onChange={handleChange} placeholder="Custom SKU..."
                disabled={isEditing && formData.sku} 
              />
            )}
          </div>
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Category *</label>
            <select name="category" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={formData.category} onChange={handleChange}>
              {categories.length === 0 ? (
                <option value="" disabled>No categories available... Please create one first!</option>
              ) : (
                <option value="" disabled>Select Category</option>
              )}
              {categories.map(c => <option key={c._id} value={c._id}>{c.icon} {c.name} ({c.code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Unit of Measure *</label>
            <select name="unitOfMeasure" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={formData.unitOfMeasure} onChange={handleChange}>
              {uomOptions.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        {/* Row 3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 glass-panel/5 p-4 rounded-lg border border-white/5">
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">Initial Stock</label>
            <input type="number" name="totalStock" min="0" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={formData.totalStock} onChange={handleChange} disabled={isEditing} />
            {isEditing && <p className="text-xs text-orange-500 mt-1">Use Adjustment/Receipts to change stock safely.</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">⚠️ Reorder Level</label>
            <input type="number" name="reorderLevel" min="0" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none" value={formData.reorderLevel} onChange={handleChange} />
            <p className="text-xs text-slate-400 mt-1">Alert below this qty</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-200 mb-1">📦 Reorder Qty</label>
            <input type="number" name="reorderQty" min="1" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={formData.reorderQty} onChange={handleChange} />
            <p className="text-xs text-slate-400 mt-1">Suggested order qty</p>
          </div>
        </div>

        {/* Row 4 */}
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-1">Description</label>
          <textarea name="description" rows="3" className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" value={formData.description} onChange={handleChange}></textarea>
        </div>

        <div className="flex justify-end space-x-4 pt-4 border-t">
          <button type="button" onClick={() => navigate('/products')} className="px-6 py-2 border border-white/20 rounded-lg text-slate-200 hover:glass-panel/5 font-medium">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className="px-6 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-medium shadow-sm disabled:opacity-50">
            {submitting ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;