import React, { useEffect, useMemo, useRef, useState } from 'react';
import advertiserAPI from '../apis/advertiserAPI';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Plus, Search, Filter, ChevronDown, ChevronUp, RefreshCw, Pencil, Trash2, Eye, EyeOff, UploadCloud, Play, Loader, FileText } from 'lucide-react';
import adAPI from '../apis/adAPI';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';


const bytesToMB = (bytes) => {
  if (!bytes && bytes !== 0) return '—';
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const secondsToHMS = (seconds) => {
  if (!seconds && seconds !== 0) return '—';
  const s = Math.round(seconds);
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}:${rem.toString().padStart(2, '0')}`;
};

const ManageAds = () => {
  const { themeColors } = useTheme();
  const auth = useSelector((state) => state.auth.user);
  const token = auth?.token;
  const navigate = useNavigate()

  const [ads, setAds] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ advertiser: '', category: '', isActive: 'all' });
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState({ key: 'createdAt', dir: 'desc' });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [selectedAd, setSelectedAd] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    advertiser: '',
    categories: '',
    isActive: true,
    file: null,
  });
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  // View type toggle: 'grid' (cards) or 'table'
  const [viewType, setViewType] = useState('table');

  const [uploading, setUploading] = useState(false);
  const isFormValid = () => {
    return formData.title.trim() && formData.file;
  };
  const [updating, setUpdating] = useState(false);
  const isEditFormValid = () => {
    return formData.title.trim();
  };

  const fetchAdvertisers = async () => {
    try {
      const res = await advertiserAPI.getAdvertisers({}, token);
      setAdvertisers(res.data.data.advertisers || []);
    } catch (e) {
      toast.error('Failed to fetch advertisers');
    }
  };

  useEffect(() => {
    fetchAds();
    fetchAdvertisers();
  }, []);

  const fetchAds = async () => {
    try {
      setLoading(true);
      const params = {};
      const res = await adAPI.getAds(params, token);
      setAds(res.data.data || []);
    } catch (e) {
      toast.error('Failed to fetch ads');
    } finally {
      setLoading(false);
    }
  };

  const filteredAds = useMemo(() => {
    let data = [...ads];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter((ad) =>
        (ad.title || '').toLowerCase().includes(q) ||
        (ad.description || '').toLowerCase().includes(q) ||
        (ad.advertiser?.name || '').toLowerCase().includes(q)
      );
    }
    if (filters.advertiser) data = data.filter((ad) => ad.advertiser?._id === filters.advertiser);
    if (filters.category) {
      const category = filters.category.toLowerCase();
      data = data.filter((ad) =>
        (ad.categories || []).some(
          (c) => c.toLowerCase().includes(category)
        )
      );
    }

    if (filters.isActive !== 'all') data = data.filter((ad) => (filters.isActive === 'active' ? ad.isActive : !ad.isActive));
    // sort
    data.sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1;
      const av = sort.key === 'title' ? (a.title || '')
        : sort.key === 'advertiser' ? (a.advertiser?.name || '')
          : sort.key === 'size' ? (a.videoSize || 0)
            : sort.key === 'duration' ? (a.duration || 0)
              : sort.key === 'createdAt' ? new Date(a.createdAt || 0).getTime()
                : (a.title || '');
      const bv = sort.key === 'title' ? (b.title || '')
        : sort.key === 'advertiser' ? (b.advertiser?.name || '')
          : sort.key === 'size' ? (b.videoSize || 0)
            : sort.key === 'duration' ? (b.duration || 0)
              : sort.key === 'createdAt' ? new Date(b.createdAt || 0).getTime()
                : (b.title || '');
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return data;
  }, [ads, searchTerm, filters, sort]);

  const pagedAds = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredAds.slice(start, start + pageSize);
  }, [filteredAds, page, pageSize]);

  const resetFilters = () => {
    setFilters({ advertiser: '', category: '', isActive: 'all' });
    setSearchTerm('');
  };

  const openEditModal = (ad) => {
    setSelectedAd(ad);
    setFormData({
      title: ad.title || '',
      description: ad.description || '',
      advertiser: ad.advertiser?._id || '',
      categories: (ad.categories || []).join(','),
      isActive: ad.isActive !== false,
      file: null,
    });
    setErrors({});
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowPreviewModal(false);
    setPreviewUrl('');
    setSelectedAd(null);
    setFormData({ title: '', description: '', advertiser: '', categories: '', isActive: true, file: null });
    setErrors({});
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false); // End uploading (success or error)
    setUploading(false);
  };

  const openPreview = (url) => {
    setPreviewUrl(url || '');
    setShowPreviewModal(true);
  };

  const validate = (values, requireFile) => {
    const e = {};
    if (!values.title.trim()) e.title = 'Title is required';
    if (requireFile && !values.file) e.file = 'Video file is required';
    return e;
  };

  const handleCreate = async (ev) => {
    ev.preventDefault();
    const e = validate(formData, true);
    if (Object.keys(e).length) { setErrors(e); return; }
    setUploading(true); // Start uploading
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      if (formData.description) payload.append('description', formData.description);
      if (formData.advertiser) payload.append('advertiser', formData.advertiser);
      if (formData.categories) payload.append('categories', formData.categories);
      payload.append('isActive', String(formData.isActive));
      payload.append('video', formData.file);
      const res = await adAPI.createAd(payload, token);
      console.log(res)
      console.log(res)
      toast.success('Ad created successfully');
      setAds((prev) => [res.data.data, ...prev]);
      closeModals();
      await fetchAds();
    } catch (err) {
      console.log(err)
      toast.error(err.response?.data?.message || 'Failed to create ad');
    } finally {
      setUploading(false); // End uploading (success or error)
    }

  };

  // const handleUpdate = async (ev) => {
  //   ev.preventDefault();
  //   const e = validate(formData, false);
  //   if (Object.keys(e).length) { setErrors(e); return; }
  //   setUpdating(true); // Start updating
  //   try {
  //     const payload = {
  //       title: formData.title,
  //       description: formData.description,
  //       advertiser: formData.advertiser || undefined,
  //       categories: formData.categories,
  //       isActive: formData.isActive,

  //     };
  //     const res = await adAPI.updateAd(selectedAd._id, payload, token);
  //     setAds((prev) => prev.map((ad) => (ad._id === selectedAd._id ? res.data.data : ad)));
  //     toast.success('Ad updated successfully');
  //     closeModals();
  //     await fetchAds();
  //   } catch (err) {
  //     toast.error(err.response?.data?.message || 'Failed to update ad');
  //   } finally {
  //     setUpdating(false); // End updating (success or error)
  //   }
  // };


  const handleUpdate = async (ev) => {
    ev.preventDefault();
    const e = validate(formData, false);
    if (Object.keys(e).length) { setErrors(e); return; }

    setUpdating(true);
    try {
      const payload = new FormData();
      payload.append('title', formData.title);
      if (formData.description) payload.append('description', formData.description);
      if (formData.advertiser) payload.append('advertiser', formData.advertiser);
      if (formData.categories) payload.append('categories', formData.categories);
      payload.append('isActive', String(formData.isActive));
      if (formData.file) {
        payload.append('video', formData.file); // new video
      }

      const res = await adAPI.updateAd(selectedAd._id, payload, token);
      setAds((prev) => prev.map((ad) => (ad._id === selectedAd._id ? res.data.data : ad)));
      toast.success('Ad updated successfully');
      closeModals();
      await fetchAds();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update ad');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this ad?')) return;
    try {
      await adAPI.deleteAd(id, token);
      setAds((prev) => prev.filter((ad) => ad._id !== id));
      toast.success('Ad deleted successfully');
      await fetchAds();
    } catch (err) {
      toast.error('Failed to delete ad');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await adAPI.toggleAdStatus(id, token);
      const updated = res.data.data;
      setAds((prev) => prev.map((ad) => (ad._id === id ? updated : ad)));
      toast.success(`Ad ${updated.isActive ? 'activated' : 'deactivated'} successfully`);
      await fetchAds();
    } catch (err) {
      toast.error('Failed to toggle ad');
    }
  };

  const handleReportClick = (ad) => {
    navigate(`/dashboard/${ad._id}/ad-logs-analysis`)
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 256 }}>
        <RefreshCw className="animate-spin" style={{ height: 32, width: 32, color: themeColors.primary }} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: themeColors.surface, borderRadius: 16, boxShadow: `0 2px 16px ${themeColors.primary}10` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: themeColors.primary, textShadow: `0 2px 8px ${themeColors.primary}22`, letterSpacing: 1 }}>Manage Ads</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setViewType('grid')} style={{ padding: '6px 12px', borderRadius: 6, background: viewType === 'grid' ? themeColors.primary : themeColors.surface, color: viewType === 'grid' ? themeColors.surface : themeColors.text, border: `1px solid ${themeColors.border}`, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}>Grid View</button>
          <button onClick={() => setViewType('table')} style={{ padding: '6px 12px', borderRadius: 6, background: viewType === 'table' ? themeColors.primary : themeColors.surface, color: viewType === 'table' ? themeColors.surface : themeColors.text, border: `1px solid ${themeColors.border}`, fontWeight: 500, cursor: 'pointer', transition: 'background 0.2s' }}>Table View</button>
          <button
            onClick={() => setShowCreateModal(true)}
            style={{ background: themeColors.primary, color: themeColors.surface, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, border: 'none', boxShadow: `0 2px 8px ${themeColors.primary}20`, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.background = themeColors.active.background}
            onMouseLeave={(e) => e.currentTarget.style.background = themeColors.primary}
          >
            <Plus style={{ height: 20, width: 20, marginRight: 8 }} />
            Upload Ad
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: themeColors.text, height: 18, width: 18 }} />
          <input
            type="text"
            placeholder="Search by title, description, advertiser..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 40, paddingRight: 12, paddingTop: 8, paddingBottom: 8, width: '100%', border: `1px solid ${themeColors.border}`, borderRadius: 8, background: themeColors.background, color: themeColors.text, outline: 'none' }}
          />
        </div>

        {/* Quick filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setFilters((f) => ({ ...f, isActive: 'all' }))} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${themeColors.border}`, background: filters.isActive === 'all' ? themeColors.primary : themeColors.surface, color: filters.isActive === 'all' ? themeColors.surface : themeColors.text, fontSize: 12, fontWeight: 500 }}>All</button>
          <button onClick={() => setFilters((f) => ({ ...f, isActive: 'active' }))} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${themeColors.border}`, background: filters.isActive === 'active' ? themeColors.success : themeColors.surface, color: filters.isActive === 'active' ? themeColors.surface : themeColors.text, fontSize: 12, fontWeight: 500 }}>Active</button>
          <button onClick={() => setFilters((f) => ({ ...f, isActive: 'inactive' }))} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${themeColors.border}`, background: filters.isActive === 'inactive' ? themeColors.danger : themeColors.surface, color: filters.isActive === 'inactive' ? themeColors.surface : themeColors.text, fontSize: 12, fontWeight: 500 }}>Inactive</button>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
            <label style={{ color: themeColors.text }}>Rows:</label>
            <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
        </div>

        <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: 8, overflow: 'hidden', background: themeColors.background }}>
          <button onClick={() => setShowFilters(!showFilters)} style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', color: themeColors.text }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Filter style={{ height: 16, width: 16, marginRight: 8, color: themeColors.text }} />Filters</div>
            {showFilters ? <ChevronUp style={{ height: 16, width: 16, color: themeColors.text }} /> : <ChevronDown style={{ height: 16, width: 16, color: themeColors.text }} />}
          </button>
          {showFilters && (
            <div style={{ padding: 16, borderTop: `1px solid ${themeColors.border}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Advertiser</label>
                <select value={filters.advertiser} onChange={(e) => setFilters({ ...filters, advertiser: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All Advertisers</option>
                  {advertisers.map((adv) => (
                    <option key={adv._id} value={adv._id}>{adv.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Category</label>
                <input value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} placeholder="e.g. ad" style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Status</label>
                <select value={filters.isActive} onChange={(e) => setFilters({ ...filters, isActive: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={resetFilters} style={{ padding: '8px 12px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>Reset Filters</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive grid/table view toggle */}
      {viewType === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {filteredAds.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: themeColors.text, borderRadius: 12, border: `1px solid ${themeColors.border}`, background: themeColors.background, gridColumn: '1 / -1' }}>No ads found</div>
          ) : (
            pagedAds.map((ad) => (
              <div key={ad._id} style={{ background: themeColors.background, border: `1px solid ${themeColors.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: `0 1px 4px ${themeColors.primary}10` }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: themeColors.text, wordBreak: 'break-word' }}>{ad.title}</div>
                      <div style={{ fontSize: 12, color: themeColors.text, wordBreak: 'break-word' }}>{ad.description || ''}</div>
                      <div style={{ fontSize: 12, color: themeColors.text }}>By: {ad.advertiser?.name || ''}</div>
                    </div>
                    <span style={{ padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 999, background: ad.isActive ? themeColors.success : themeColors.danger, color: ad.isActive ? themeColors.text : themeColors.surfaceDark }}>{ad.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, fontSize: 12, color: themeColors.text, marginBottom: 12 }}>
                    <div><span style={{ color: themeColors.primary, fontWeight: 600 }}>Format:</span> {ad.videoFormat || ''}</div>
                    <div><span style={{ color: themeColors.primary, fontWeight: 600 }}>Size:</span> {bytesToMB(ad.videoSize)}</div>
                    <div><span style={{ color: themeColors.primary, fontWeight: 600 }}>Duration:</span> {secondsToHMS(ad.duration)}</div>
                    <div style={{ gridColumn: '1 / -1', wordBreak: 'break-word' }}><span style={{ color: themeColors.primary, fontWeight: 600 }}>Categories:</span> {(ad.categories || []).join(', ') || ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => openPreview(ad.videoUrl)} style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${themeColors.border}`, color: themeColors.text, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>Preview</button>
                  <button onClick={() => handleReportClick(ad)} style={{
                    padding: '6px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${themeColors.border}`, color: themeColors.text, background: themeColors.surface, cursor: 'pointer'
                  }}>
                    <FileText style={{ height: 14, width: 14 }} />
                  </button>
                  <button onClick={() => handleToggleActive(ad._id)} style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${themeColors.border}`, color: themeColors.text, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>{ad.isActive ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => openEditModal(ad)} style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${themeColors.primary}`, color: themeColors.primary, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>Edit</button>
                  <button onClick={() => handleDelete(ad._id)} style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${themeColors.danger}`, color: themeColors.danger, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ minWidth: '100%', background: themeColors.surface, border: `1px solid ${themeColors.border}`, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: themeColors.background }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text, cursor: 'pointer' }} onClick={() => setSort((s) => ({ key: 'title', dir: s.key === 'title' && s.dir === 'asc' ? 'desc' : 'asc' }))}>Title</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text, cursor: 'pointer' }} onClick={() => setSort((s) => ({ key: 'advertiser', dir: s.key === 'advertiser' && s.dir === 'asc' ? 'desc' : 'asc' }))}>Advertiser</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Format</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text, cursor: 'pointer' }} onClick={() => setSort((s) => ({ key: 'size', dir: s.key === 'size' && s.dir === 'asc' ? 'desc' : 'asc' }))}>Size</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text, cursor: 'pointer' }} onClick={() => setSort((s) => ({ key: 'duration', dir: s.key === 'duration' && s.dir === 'asc' ? 'desc' : 'asc' }))}>Duration</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Categories</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text, cursor: 'pointer' }} onClick={() => setSort((s) => ({ key: 'createdAt', dir: s.key === 'createdAt' && s.dir === 'asc' ? 'desc' : 'asc' }))}>Created</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAds.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ padding: 24, textAlign: 'center', color: themeColors.text, borderTop: `1px solid ${themeColors.border}` }}>No ads found</td>
                </tr>
              ) : (
                pagedAds.map((ad) => (
                  <tr key={ad._id} style={{ borderTop: `1px solid ${themeColors.border}` }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <UploadCloud style={{ height: 20, width: 20, color: themeColors.text, marginRight: 8 }} />
                        <div>
                          <div style={{ fontWeight: 600, color: themeColors.text }}>{ad.title}</div>
                          <div style={{ fontSize: 12, color: themeColors.text }}>Ad ID: <span style={{ fontFamily: 'monospace', color: themeColors.primary }}>{ad.adId || '-'}</span></div>
                          <div style={{ fontSize: 12, color: themeColors.text, maxWidth: 360, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ad.description || ''}>{ad.description || '�'}</div>
                          <a href={ad.videoUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: themeColors.primary }}>Preview</a>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>{ad.advertiser?.name || ''}</td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>{ad.videoFormat || ''}</td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>{bytesToMB(ad.videoSize)}</td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>{secondsToHMS(ad.duration)}</td>
                    <td style={{ padding: '12px 16px', color: themeColors.text, maxWidth: 280 }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(ad.categories || []).length
                          ? (ad.categories || []).map((c, idx) => (
                            <span key={idx} style={{ padding: '4px 8px', fontSize: 10, borderRadius: 999, background: themeColors.background, color: themeColors.text, border: `1px solid ${themeColors.border}` }}>{c}</span>
                          ))
                          : <span style={{ color: themeColors.text }}></span>}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>{ad.createdAt ? new Date(ad.createdAt).toLocaleDateString() : ''}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: ad.isActive ? themeColors.success : themeColors.danger, color: ad.isActive ? themeColors.text : themeColors.surfaceDark }}>{ad.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => openPreview(ad.videoUrl)} style={{ color: themeColors.text }} title="Preview">
                          <Play style={{ height: 16, width: 16, color: themeColors.text }} />
                        </button>
                        <button onClick={() => handleReportClick(ad)} style={{
                          color: themeColors.accent, background: 'none', border: 'none', cursor: 'pointer'
                        }}>
                          <FileText  style={{ height: 16, width: 16, color: themeColors.text }}/>
                        </button>
                        <button onClick={() => handleToggleActive(ad._id)} style={{ color: themeColors.text }} title={ad.isActive ? 'Deactivate' : 'Activate'}>
                          {ad.isActive ? <EyeOff style={{ height: 16, width: 16, color: themeColors.text }} /> : <Eye style={{ height: 16, width: 16, color: themeColors.text }} />}
                        </button>
                        <button onClick={() => openEditModal(ad)} style={{ color: themeColors.primary }} title="Edit">
                          <Pencil style={{ height: 16, width: 16, color: themeColors.primary }} />
                        </button>
                        <button onClick={() => handleDelete(ad._id)} style={{ color: themeColors.danger }} title="Delete">
                          <Trash2 style={{ height: 16, width: 16, color: themeColors.danger }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, color: themeColors.text }}>
        <div>Showing {(filteredAds.length === 0) ? 0 : ((page - 1) * pageSize + 1)} - {Math.min(page * pageSize, filteredAds.length)} of {filteredAds.length}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ padding: '6px 12px', border: `1px solid ${themeColors.border}`, borderRadius: 6, background: themeColors.background, color: themeColors.text, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>Prev</button>
          <span>Page {page} / {Math.max(1, Math.ceil(filteredAds.length / pageSize))}</span>
          <button disabled={page >= Math.ceil(filteredAds.length / pageSize)} onClick={() => setPage((p) => Math.min(Math.ceil(filteredAds.length / pageSize), p + 1))} style={{ padding: '6px 12px', border: `1px solid ${themeColors.border}`, borderRadius: 6, background: themeColors.background, color: themeColors.text, cursor: page >= Math.ceil(filteredAds.length / pageSize) ? 'not-allowed' : 'pointer', opacity: page >= Math.ceil(filteredAds.length / pageSize) ? 0.5 : 1 }}>Next</button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary }}>Upload New Ad</h2>
              <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Title *</label>
                  <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.title ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                  {errors.title && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.title}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Advertiser</label>
                  <select value={formData.advertiser} onChange={(e) => setFormData({ ...formData, advertiser: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select Advertiser</option>
                    {advertisers.map((adv) => (
                      <option key={adv._id} value={adv._id}>{adv.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Categories (comma separated)</label>
                  <input value={formData.categories} onChange={(e) => setFormData({ ...formData, categories: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ height: 18, width: 18, accentColor: themeColors.primary, borderRadius: 4, marginRight: 8 }} />
                  <label htmlFor="isActive" style={{ color: themeColors.text }}>Active</label>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Video *</label>
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) setFormData({ ...formData, file: f }); }}
                    style={{ border: `2px dashed ${errors.file ? themeColors.danger : themeColors.border}`, borderRadius: 8, padding: 16, textAlign: 'center' }}
                  >
                    <input ref={fileInputRef} type="file" accept="video/*" onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })} style={{ display: 'none' }} id="ad-video-input" />
                    <label htmlFor="ad-video-input" style={{ color: themeColors.primary, cursor: 'pointer' }}>Click to choose</label>
                    <span style={{ color: themeColors.text }}> or drag & drop</span>
                    {formData.file && (
                      <div style={{ marginTop: 12, textAlign: 'left' }}>
                        <div style={{ fontSize: 12, color: themeColors.text }}>Selected: <b>{formData.file.name}</b> ({bytesToMB(formData.file.size)})</div>
                        <video style={{ marginTop: 8, width: '100%', borderRadius: 8 }} src={URL.createObjectURL(formData.file)} controls />
                      </div>
                    )}
                  </div>
                  {errors.file && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.file}</p>}
                </div>


                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    type="button"
                    onClick={closeModals}
                    style={{ padding: '8px 16px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}
                    disabled={uploading} // Disable cancel button during upload
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      color: isFormValid() ? themeColors.surface : themeColors.surfaceDark,
                      background: isFormValid() ? themeColors.primary : themeColors.disabled,
                      borderRadius: 8,
                      border: `1px solid ${themeColors.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: isFormValid() && !uploading ? 'pointer' : 'not-allowed',
                      opacity: isFormValid() && !uploading ? 1 : 0.7
                    }}
                    disabled={!isFormValid() || uploading} // Disable if form invalid or uploading
                  >
                    {uploading ? (
                      <>
                        <Loader className="animate-spin" style={{ height: 16, width: 16 }} />
                        Uploading...
                      </>
                    ) : (
                      'Upload'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {/* {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary }}>Edit Ad</h2>
              <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Title *</label>
                  <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.title ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                  {errors.title && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.title}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Advertiser</label>
                  <select value={formData.advertiser} onChange={(e) => setFormData({ ...formData, advertiser: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select Advertiser</option>
                    {advertisers.map((adv) => (
                      <option key={adv._id} value={adv._id}>{adv.name}</option>
                    ))}
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Description</label>
                  <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Categories (comma separated)</label>
                  <input value={formData.categories} onChange={(e) => setFormData({ ...formData, categories: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" id="editIsActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ height: 18, width: 18, accentColor: themeColors.primary, borderRadius: 4, marginRight: 8 }} />
                  <label htmlFor="editIsActive" style={{ color: themeColors.text }}>Active</label>
                </div>

                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button
                    type="button"
                    onClick={closeModals}
                    style={{ padding: '8px 16px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}
                    disabled={updating} // Disable cancel button during update
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '8px 16px',
                      color: themeColors.surface,
                      background: isEditFormValid() ? themeColors.primary : themeColors.disabled,
                      borderRadius: 8,
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: isEditFormValid() && !updating ? 'pointer' : 'not-allowed',
                      opacity: isEditFormValid() && !updating ? 1 : 0.7
                    }}
                    disabled={!isEditFormValid() || updating} // Disable if form invalid or updating
                  >
                    {updating ? (
                      <>
                        <Loader className="animate-spin" style={{ height: 16, width: 16 }} />
                        Updating...
                      </>
                    ) : (
                      'Update'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )} */}

      {/* Edit Modal */}
      {showEditModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: themeColors.overlay || "#0008",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            style={{
              background: themeColors.surface,
              borderRadius: 16,
              boxShadow: `0 4px 24px ${themeColors.primary}20`,
              width: "100%",
              maxWidth: 600,
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div style={{ padding: 24 }}>
              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  marginBottom: 16,
                  color: themeColors.primary,
                }}
              >
                Edit Ad
              </h2>
              <form
                onSubmit={handleUpdate}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 16,
                }}
              >
                {/* Title */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 16,
                      fontWeight: 600,
                      color: themeColors.primary,
                      marginBottom: 6,
                    }}
                  >
                    Title *
                  </label>
                  <input
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${errors.title ? themeColors.danger : themeColors.border
                        }`,
                      outline: "none",
                      fontSize: 15,
                      color: themeColors.text,
                      background: themeColors.background,
                    }}
                  />
                  {errors.title && (
                    <p style={{ marginTop: 6, color: themeColors.danger }}>
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Advertiser */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 16,
                      fontWeight: 600,
                      color: themeColors.primary,
                      marginBottom: 6,
                    }}
                  >
                    Advertiser
                  </label>
                  <select
                    value={formData.advertiser}
                    onChange={(e) =>
                      setFormData({ ...formData, advertiser: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${themeColors.border}`,
                      outline: "none",
                      fontSize: 15,
                      color: themeColors.text,
                      background: themeColors.background,
                    }}
                  >
                    <option value="">Select Advertiser</option>
                    {advertisers.map((adv) => (
                      <option key={adv._id} value={adv._id}>
                        {adv.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 16,
                      fontWeight: 600,
                      color: themeColors.primary,
                      marginBottom: 6,
                    }}
                  >
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${themeColors.border}`,
                      outline: "none",
                      fontSize: 15,
                      color: themeColors.text,
                      background: themeColors.background,
                    }}
                  />
                </div>

                {/* Categories */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 16,
                      fontWeight: 600,
                      color: themeColors.primary,
                      marginBottom: 6,
                    }}
                  >
                    Categories (comma separated)
                  </label>
                  <input
                    value={formData.categories}
                    onChange={(e) =>
                      setFormData({ ...formData, categories: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${themeColors.border}`,
                      outline: "none",
                      fontSize: 15,
                      color: themeColors.text,
                      background: themeColors.background,
                    }}
                  />
                </div>

                {/* Active checkbox */}
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    id="editIsActive"
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                    style={{
                      height: 18,
                      width: 18,
                      accentColor: themeColors.primary,
                      borderRadius: 4,
                      marginRight: 8,
                    }}
                  />
                  <label htmlFor="editIsActive" style={{ color: themeColors.text }}>
                    Active
                  </label>
                </div>

                {/* Current Video Preview */}
                {selectedAd?.videoUrl && (
                  <div style={{ gridColumn: "1 / -1" }}>
                    <label
                      style={{
                        display: "block",
                        fontSize: 16,
                        fontWeight: 600,
                        color: themeColors.primary,
                        marginBottom: 6,
                      }}
                    >
                      Current Video
                    </label>
                    <video
                      src={selectedAd.videoUrl}
                      controls
                      style={{
                        width: "100%",
                        maxHeight: 200,
                        borderRadius: 8,
                        border: `1px solid ${themeColors.border}`,
                      }}
                    />
                  </div>
                )}

                {/* Replace Video */}
                <div style={{ gridColumn: "1 / -1" }}>
                  <label
                    style={{
                      display: "block",
                      fontSize: 16,
                      fontWeight: 600,
                      color: themeColors.primary,
                      marginBottom: 6,
                    }}
                  >
                    Replace Video
                  </label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) =>
                      setFormData({ ...formData, file: e.target.files[0] })
                    }
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1px solid ${themeColors.border}`,
                      outline: "none",
                      fontSize: 15,
                      color: themeColors.text,
                      background: themeColors.background,
                    }}
                  />
                  <p style={{ fontSize: 13, marginTop: 4, color: themeColors.muted }}>
                    Leave empty if you don’t want to change the video.
                  </p>
                </div>

                {/* Footer buttons */}
                <div
                  style={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 12,
                  }}
                >
                  <button
                    type="button"
                    onClick={closeModals}
                    style={{
                      padding: "8px 16px",
                      color: themeColors.text,
                      background: themeColors.surface,
                      borderRadius: 8,
                      border: `1px solid ${themeColors.border}`,
                    }}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: "8px 16px",
                      color: themeColors.surface,
                      background: isEditFormValid()
                        ? themeColors.primary
                        : themeColors.disabled,
                      borderRadius: 8,
                      border: "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      cursor:
                        isEditFormValid() && !updating ? "pointer" : "not-allowed",
                      opacity: isEditFormValid() && !updating ? 1 : 0.7,
                    }}
                    disabled={!isEditFormValid() || updating}
                  >
                    {updating ? (
                      <>
                        <Loader
                          className="animate-spin"
                          style={{ height: 16, width: 16 }}
                        />
                        Updating...
                      </>
                    ) : (
                      "Update"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}


      {/* Preview Modal */}
      {showPreviewModal && (
        <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }} onClick={() => setShowPreviewModal(false)}>
          <div style={{ background: themeColors.surface, borderRadius: 16, padding: 16, width: '100%', maxWidth: 800, maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, color: themeColors.text }}>Preview</h3>
              <button onClick={() => setShowPreviewModal(false)} style={{ color: themeColors.text, background: 'transparent', border: 'none', cursor: 'pointer' }}>✕</button>
            </div>
            {previewUrl ? (
              <video src={previewUrl} controls style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
            ) : (
              <div style={{ textAlign: 'center', color: themeColors.text, padding: 32 }}>No preview available</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAds;