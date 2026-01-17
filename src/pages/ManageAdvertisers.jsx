// src/components/ManageAdvertisers.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { Plus, Search, Filter, ChevronDown, ChevronUp, RefreshCw, Pencil, Trash2, Eye, EyeOff, Building2, Link as LinkIcon } from 'lucide-react';
import advertiserAPI from '../apis/advertiserAPI';
import countryAPI from '../apis/countryAPI';
import stateAPI from '../apis/stateAPI';
import cityAPI from '../apis/cityAPI';
import { useTheme } from '../context/ThemeContext';

const ManageAdvertisers = () => {
  const { themeColors } = useTheme();
  const auth = useSelector((state) => state.auth.user);
  const token = auth?.token;

  const [advertisers, setAdvertisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ isActive: 'all', country: '', state: '', city: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selected, setSelected] = useState(null);

  // View type toggle: 'grid' (cards) or 'table'
  const [viewType, setViewType] = useState('table');

  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    country: '',
    state: '',
    city: '',
    street: '',
    postalCode: '',
    website: '',
    isActive: true,
  });
  const [errors, setErrors] = useState({});
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [filterStates, setFilterStates] = useState([]);
  const [filterCities, setFilterCities] = useState([]);

  useEffect(() => { fetchGeo(); }, []);

  useEffect(() => {
    fetchAdvertisers();
  }, [filters, searchTerm, page, pageSize]);

  // Debounced search: triggers automatically after typing, no page refresh
  useEffect(() => {
    const handle = setTimeout(() => {
      if (query.length === 0 || query.length >= 2) {
        setPage(1);
        setSearchTerm(query.trim());
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (formData.country) {
      const fs = states.filter(s => (s.country?._id || s.country) === formData.country);
      setFilteredStates(fs);
      if (formData.state && !fs.find(s => s._id === formData.state)) {
        setFormData(prev => ({ ...prev, state: '', city: '' }));
      }
    } else {
      setFilteredStates(states);
    }
  }, [formData.country, states]);

  useEffect(() => {
    if (formData.state) {
      const fc = cities.filter(c => (c.state?._id || c.state) === formData.state);
      setFilteredCities(fc);
      if (formData.city && !fc.find(c => c._id === formData.city)) {
        setFormData(prev => ({ ...prev, city: '' }));
      }
    } else {
      setFilteredCities(cities);
    }
  }, [formData.state, cities]);

  // Filter dropdown dependencies
  useEffect(() => {
    if (filters.country) {
      const fs = states.filter(s => (s.country?._id || s.country) === filters.country);
      setFilterStates(fs);
      if (filters.state && !fs.find(s => s._id === filters.state)) {
        setFilters(prev => ({ ...prev, state: '', city: '' }));
      }
    } else {
      setFilterStates(states);
    }
  }, [filters.country, states]);

  useEffect(() => {
    if (filters.state) {
      const fc = cities.filter(c => (c.state?._id || c.state) === filters.state);
      setFilterCities(fc);
      if (filters.city && !fc.find(c => c._id === filters.city)) {
        setFilters(prev => ({ ...prev, city: '' }));
      }
    } else {
      setFilterCities(cities);
    }
  }, [filters.state, cities]);

  const fetchAdvertisers = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
        search: searchTerm || undefined,
        city: filters.city || undefined,
        state: filters.state || undefined,
        country: filters.country || undefined,
      };
      if (filters.isActive !== 'all') params.isActive = String(filters.isActive === 'active');
      const res = await advertiserAPI.getAdvertisers(params, token);
      const items = res.data?.data?.advertisers || res.data?.data || [];
      setAdvertisers(items);
      const pagination = res.data?.data?.pagination;
      if (pagination) setTotal(pagination.total);
      else setTotal(items.length);
    } catch (e) {
      toast.error('Failed to fetch advertisers');
    } finally { setLoading(false); }
  };

  const fetchGeo = async () => {
    try {
      const [cRes, sRes, ciRes] = await Promise.all([
        countryAPI.getCountries(token),
        stateAPI.getStates({}, token),
        cityAPI.getCities({}, token),
      ]);
      setCountries(cRes.data.data || []);
      setStates(sRes.data.data || []);
      setFilteredStates(sRes.data.data || []);
      setCities(ciRes.data.data || []);
      setFilteredCities(ciRes.data.data || []);
    } catch (e) {
      // non-fatal
    }
  };

  const filtered = advertisers; // server-filtered

  const resetFilters = () => { setFilters({ isActive: 'all', country: '', state: '', city: '' }); setSearchTerm(''); setPage(1); };

  const openEdit = (a) => {
    setSelected(a);
    setFormData({
      name: a.name || '',
      companyName: a.companyName || '',
      email: a.email || '',
      phone: a.phone || '',
      country: (a.country && (a.country._id || a.country)) || '',
      state: (a.state && (a.state._id || a.state)) || '',
      city: (a.city && (a.city._id || a.city)) || '',
      street: a.street || '',
      postalCode: a.postalCode || '',
      website: a.website || '',
      isActive: a.isActive !== false,
    });
    setErrors({});
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelected(null);
    setFormData({ name: '', companyName: '', email: '', phone: '', country: '', state: '', city: '', street: '', postalCode: '', website: '', isActive: true });
    setErrors({});
  };

  const validate = (v) => {
    const e = {};
    if (!v.name.trim()) e.name = 'Name is required';
    if (!v.email.trim()) e.email = 'Email is required';
    return e;
  };

  const handleCreate = async (ev) => {
    ev.preventDefault();
    const e = validate(formData);
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      const payload = { ...formData };
      const res = await advertiserAPI.createAdvertiser(payload, token);
      toast.success('Advertiser created');
      setAdvertisers((prev) => [res.data.data, ...prev]);
      closeModals();
      await fetchAdvertisers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create'); }
  };

  const handleUpdate = async (ev) => {
    ev.preventDefault();
    const e = validate(formData);
    if (Object.keys(e).length) { setErrors(e); return; }
    try {
      const payload = { ...formData };
      const res = await advertiserAPI.updateAdvertiser(selected._id, payload, token);
      setAdvertisers((prev) => prev.map((a) => (a._id === selected._id ? res.data.data : a)));
      toast.success('Advertiser updated');
      closeModals();
      await fetchAdvertisers();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this advertiser?')) return;
    try {
      await advertiserAPI.deleteAdvertiser(id, token);
      setAdvertisers((prev) => prev.filter((a) => a._id !== id));
      toast.success('Advertiser deleted');
      await fetchAdvertisers();
    } catch { toast.error('Failed to delete'); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await advertiserAPI.toggleAdvertiserStatus(id, token);
      const updated = res.data.data;
      // setAdvertisers((prev) => prev.map((a) => (a._id === id ? updated : a)));
      toast.success(`Advertiser ${updated.isActive ? 'activated' : 'deactivated'}`);
      await fetchAdvertisers();
    } catch { toast.error('Failed to toggle'); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 256 }}>
        <RefreshCw className="animate-spin" style={{ height: 32, width: 32, color: themeColors.primary }} />
      </div>
    );
  }

  const getInitials = (fullName) => {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    const first = parts[0]?.[0] || '';
    const last = parts[parts.length - 1]?.[0] || '';
    return (first + last).toUpperCase();
  };

  return (
    <div style={{ padding: 24, background: themeColors.surface, borderRadius: 16, boxShadow: `0 2px 16px ${themeColors.primary}10` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: themeColors.primary, textShadow: `0 2px 8px ${themeColors.primary}22`, letterSpacing: 1 }}>Manage Advertisers</h1>
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
            Add Advertiser
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: themeColors.text, height: 18, width: 18 }} />
          <input 
            type="text" 
            placeholder="Search by name, company, email..." 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
            style={{ paddingLeft: 40, paddingRight: 12, paddingTop: 8, paddingBottom: 8, width: '100%', border: `1px solid ${themeColors.border}`, borderRadius: 8, background: themeColors.background, color: themeColors.text, outline: 'none' }} 
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSearchTerm(''); setPage(1); }}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: themeColors.text, background: 'transparent', border: 'none', cursor: 'pointer' }}
              title="Clear"
            >
              ×
            </button>
          )}
        </div>

        {/* Quick status filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          <button onClick={() => { setPage(1); setFilters((f) => ({ ...f, isActive: 'all' })); }} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${themeColors.border}`, background: filters.isActive === 'all' ? themeColors.primary : themeColors.surface, color: filters.isActive === 'all' ? themeColors.surface : themeColors.text, fontSize: 12, fontWeight: 500 }}>All</button>
          <button onClick={() => { setPage(1); setFilters((f) => ({ ...f, isActive: 'active' })); }} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${themeColors.border}`, background: filters.isActive === 'active' ? themeColors.success : themeColors.surface, color: filters.isActive === 'active' ? themeColors.surface : themeColors.text, fontSize: 12, fontWeight: 500 }}>Active</button>
          <button onClick={() => { setPage(1); setFilters((f) => ({ ...f, isActive: 'inactive' })); }} style={{ padding: '6px 12px', borderRadius: 999, border: `1px solid ${themeColors.border}`, background: filters.isActive === 'inactive' ? themeColors.danger : themeColors.surface, color: filters.isActive === 'inactive' ? themeColors.surface : themeColors.text, fontSize: 12, fontWeight: 500 }}>Inactive</button>
        </div>

        <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: 8, overflow: 'hidden', background: themeColors.background }}>
          <button onClick={() => setShowFilters((s) => !s)} style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', color: themeColors.text }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Filter style={{ height: 16, width: 16, marginRight: 8, color: themeColors.text }} />Filters</div>
            {showFilters ? <ChevronUp style={{ height: 16, width: 16, color: themeColors.text }} /> : <ChevronDown style={{ height: 16, width: 16, color: themeColors.text }} />}
          </button>
          {showFilters && (
            <div style={{ padding: 16, borderTop: `1px solid ${themeColors.border}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Country</label>
                <select value={filters.country} onChange={(e) => { setPage(1); setFilters({ ...filters, country: e.target.value, state: '', city: '' }); }} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All Countries</option>
                  {countries.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>State</label>
                <select value={filters.state} onChange={(e) => { setPage(1); setFilters({ ...filters, state: e.target.value, city: '' }); }} disabled={!filters.country} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All States</option>
                  {filterStates.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>City</label>
                <select value={filters.city} onChange={(e) => { setPage(1); setFilters({ ...filters, city: e.target.value }); }} disabled={!filters.state} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All Cities</option>
                  {filterCities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Status</label>
                <select value={filters.isActive} onChange={(e) => { setPage(1); setFilters({ ...filters, isActive: e.target.value }); }} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <button onClick={resetFilters} style={{ padding: '8px 12px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>Reset Filters</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Responsive grid/table view toggle */}
      {viewType === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: themeColors.text, borderRadius: 12, border: `1px solid ${themeColors.border}`, background: themeColors.background, gridColumn: '1 / -1' }}>No advertisers found</div>
          ) : (
            filtered.map((a) => (
              <div key={a._id} style={{ background: themeColors.background, border: `1px solid ${themeColors.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: `0 1px 4px ${themeColors.primary}10` }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <div style={{ height: 32, width: 32, borderRadius: '50%', background: themeColors.primary, color: themeColors.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600 }}>
                      {getInitials(a.name)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: themeColors.primary, fontSize: 16 }}>{a.name}</div>
                      <div style={{ fontSize: 13, color: themeColors.text }}>{a.companyName || ''}</div>
                    </div>
                    <span style={{ marginLeft: 'auto', padding: '4px 10px', fontSize: 11, fontWeight: 600, borderRadius: 999, background: a.isActive ? themeColors.success : themeColors.danger, color: a.isActive ? themeColors.text : themeColors.surfaceDark }}>{a.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                  <div style={{ display: 'grid', gap: 4, fontSize: 13, color: themeColors.text, marginBottom: 12 }}>
                    <div><span style={{ color: themeColors.primary, fontWeight: 600 }}>Email:</span> {a.email}</div>
                    <div><span style={{ color: themeColors.primary, fontWeight: 600 }}>Phone:</span> {a.phone || ''}</div>
                    <div><span style={{ color: themeColors.primary, fontWeight: 600 }}>Address:</span> {(a.city?.name || a.state?.name || a.country?.name) ? (
                      <span>{a.city?.name || 'City'}{a.state?.name ? `, ${a.state.name}` : ''}{a.country?.name ? `, ${a.country.name}` : ''}</span>
                    ) : ''}</div>
                    <div><span style={{ color: themeColors.primary, fontWeight: 600 }}>Website:</span> {a.website ? (
                      <a href={a.website} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: themeColors.primary }}>Visit</a>
                    ) : ''}</div>
                    <div><span style={{ color: themeColors.primary, fontWeight: 600 }}>Created:</span> {a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                  <button onClick={() => handleToggle(a._id)} style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${themeColors.border}`, color: themeColors.text, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>{a.isActive ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => openEdit(a)} style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${themeColors.primary}`, color: themeColors.primary, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>Edit</button>
                  <button onClick={() => handleDelete(a._id)} style={{ padding: '6px 10px', fontSize: 12, borderRadius: 6, border: `1px solid ${themeColors.danger}`, color: themeColors.danger, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>Delete</button>
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
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Advertiser</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Contact</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Address</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Website</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Created</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: 24, textAlign: 'center', color: themeColors.text, borderTop: `1px solid ${themeColors.border}` }}>
                    <div style={{ padding: 24, border: `1px solid ${themeColors.border}`, borderRadius: 12, background: themeColors.background }}>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>No advertisers found</div>
                      <button 
                        onClick={() => setShowCreateModal(true)} 
                        style={{ background: themeColors.primary, color: themeColors.surface, padding: '8px 16px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', fontWeight: 500, fontSize: 14, border: 'none', boxShadow: `0 2px 8px ${themeColors.primary}20`, cursor: 'pointer' }}
                      >
                        <Plus style={{ height: 16, width: 16, marginRight: 8 }} /> Add Advertiser
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a._id} style={{ borderTop: `1px solid ${themeColors.border}` }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ height: 32, width: 32, borderRadius: '50%', background: themeColors.primary, color: themeColors.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 600, marginRight: 12 }}>
                          {getInitials(a.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: themeColors.text }}>{a.name}</div>
                          <div style={{ fontSize: 12, color: themeColors.text }}>{a.companyName || ''}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>
                      <div>{a.email}</div>
                      <div style={{ fontSize: 12, color: themeColors.text }}>{a.phone || ''}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${a.street || ''}`}> 
                      {(a.city?.name || a.state?.name || a.country?.name) ? (
                        <span>{a.city?.name || 'City'}{a.state?.name ? `, ${a.state.name}` : ''}{a.country?.name ? `, ${a.country.name}` : ''}</span>
                      ) : ''}
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>
                      {a.website ? (
                        <a href={a.website} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: themeColors.primary }}>
                          <LinkIcon style={{ height: 16, width: 16 }} /> Visit
                        </a>
                      ) : ''}
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : ''}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: a.isActive ? themeColors.success : themeColors.danger, color: a.isActive ? themeColors.text : themeColors.surfaceDark }}>{a.isActive ? 'Active' : 'Inactive'}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <button onClick={() => handleToggle(a._id)} style={{ color: themeColors.text }} title={a.isActive ? 'Deactivate' : 'Activate'}>{a.isActive ? <EyeOff style={{ height: 16, width: 16, color: themeColors.text }} /> : <Eye style={{ height: 16, width: 16, color: themeColors.text }} />}</button>
                        <button onClick={() => openEdit(a)} style={{ color: themeColors.primary }} title="Edit"><Pencil style={{ height: 16, width: 16, color: themeColors.primary }} /></button>
                        <button onClick={() => handleDelete(a._id)} style={{ color: themeColors.danger }} title="Delete"><Trash2 style={{ height: 16, width: 16, color: themeColors.danger }} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, color: themeColors.text }}>
        <div>Showing {(filtered.length === 0) ? 0 : ((page - 1) * pageSize + 1)} - {Math.min(page * pageSize, total || filtered.length)} of {total || filtered.length}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontSize: 14, color: themeColors.text }}>Rows</label>
            <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </div>
          <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} style={{ padding: '6px 12px', border: `1px solid ${themeColors.border}`, borderRadius: 6, background: themeColors.background, color: themeColors.text, cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.5 : 1 }}>Prev</button>
          <span>Page {page} / {Math.max(1, Math.ceil((total || filtered.length) / pageSize))}</span>
          <button disabled={page >= Math.ceil((total || filtered.length) / pageSize)} onClick={() => setPage((p) => Math.min(Math.ceil((total || filtered.length) / pageSize), p + 1))} style={{ padding: '6px 12px', border: `1px solid ${themeColors.border}`, borderRadius: 6, background: themeColors.background, color: themeColors.text, cursor: page >= Math.ceil((total || filtered.length) / pageSize) ? 'not-allowed' : 'pointer', opacity: page >= Math.ceil((total || filtered.length) / pageSize) ? 0.5 : 1 }}>Next</button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary }}>Add New Advertiser</h2>
              <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Name *</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.name ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                  {errors.name && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.name}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Country</label>
                  <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '', city: '' })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select Country</option>
                    {countries.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>State</label>
                  <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })} disabled={!formData.country} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select State</option>
                    {filteredStates.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>City</label>
                  <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} disabled={!formData.state} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select City</option>
                    {filteredCities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Company</label>
                  <input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.email ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                  {errors.email && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.email}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Phone</label>
                  <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Street</label>
                  <input value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Postal Code</label>
                  <input value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Website</label>
                  <input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ height: 18, width: 18, accentColor: themeColors.primary, borderRadius: 4, marginRight: 8 }} />
                  <label htmlFor="isActive" style={{ color: themeColors.text }}>Active</label>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={closeModals} style={{ padding: '8px 16px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 16px', color: themeColors.surface, background: themeColors.primary, borderRadius: 8, border: 'none' }}>Create</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary }}>Edit Advertiser</h2>
              <form onSubmit={handleUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Name *</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.name ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                  {errors.name && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.name}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Country</label>
                  <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '', city: '' })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select Country</option>
                    {countries.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>State</label>
                  <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '' })} disabled={!formData.country} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select State</option>
                    {filteredStates.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>City</label>
                  <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} disabled={!formData.state} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select City</option>
                    {filteredCities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Company</label>
                  <input value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.email ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                  {errors.email && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.email}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Phone</label>
                  <input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Street</label>
                  <input value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Postal Code</label>
                  <input value={formData.postalCode} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Website</label>
                  <input value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" id="editIsActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ height: 18, width: 18, accentColor: themeColors.primary, borderRadius: 4, marginRight: 8 }} />
                  <label htmlFor="editIsActive" style={{ color: themeColors.text }}>Active</label>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={closeModals} style={{ padding: '8px 16px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 16px', color: themeColors.surface, background: themeColors.primary, borderRadius: 8, border: 'none' }}>Update</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAdvertisers;