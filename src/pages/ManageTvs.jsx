import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';
import { toast } from 'react-toastify';
import {
  Pencil, Trash2, Plus, Search, Eye, EyeOff, RefreshCw, Filter,
  ChevronDown, ChevronUp, Monitor as TvIcon, X, MapPin, Wifi,
  FileText
} from 'lucide-react';
import tvAPI from '../apis/tvAPI';
import countryAPI from '../apis/countryAPI';
import stateAPI from '../apis/stateAPI';
import cityAPI from '../apis/cityAPI';
import zoneAPI from '../apis/zoneAPI';
import storeAPI from '../apis/storeAPI';
import { useNavigate } from 'react-router-dom';

const ManageTVs = () => {
  const auth = useSelector((state) => state.auth.user);
  const token = auth?.token;
  const { themeColors } = useTheme();
  const navigate = useNavigate()
  // States
  const [tvs, setTvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [modalType, setModalType] = useState(null); // 'create' | 'edit' | 'view'
  const [selectedTV, setSelectedTV] = useState(null);
  const [viewType, setViewType] = useState('table');

  // Dropdown data
  const [dropdownData, setDropdownData] = useState({
    countries: [], states: [], cities: [], zones: [], stores: []
  });

  const [filters, setFilters] = useState({
    country: '', state: '', city: '', zone: '', store: '', status: 'all', isActive: 'all'
  });

  const [formData, setFormData] = useState({
    store: '', zone: '', city: '', state: '', country: '', macAddress: '',
    serialNumber: '', screenSize: '', resolution: '', manufacturer: '', model: '',
    ipAddress: '', locationAddress: '', locationFloor: '', locationLat: '',
    locationLng: '', installationNotes: '', isActive: true, status: 'offline'
  });
  const [errors, setErrors] = useState({});

  // Initialize data
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [tvsRes, countriesRes, statesRes, citiesRes, zonesRes, storesRes] = await Promise.all([
        tvAPI.getTVs({}, token),
        countryAPI.getCountries(token),
        stateAPI.getStates({}, token),
        cityAPI.getCities({}, token),
        zoneAPI.getZones({}, token),
        storeAPI.getStores({}, token)
      ]);
      
      setTvs(tvsRes.data.data || []);
      setDropdownData({
        countries: countriesRes.data.data || [],
        states: statesRes.data.data || [],
        cities: citiesRes.data.data || [],
        zones: zonesRes.data.data || [],
        stores: storesRes.data.data || []
      });
    } catch (e) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Filter TVs
  const filteredTVs = useMemo(() => {
    let data = [...tvs];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      data = data.filter((tv) =>
        (tv.tvId || '').toLowerCase().includes(q) ||
        (tv.macAddress || '').toLowerCase().includes(q) ||
        (tv.serialNumber || '').toLowerCase().includes(q) ||
        (tv.ipAddress || '').toLowerCase().includes(q) ||
        (tv.model || '').toLowerCase().includes(q)
      );
    }
    if (filters.country) data = data.filter((tv) => tv.country?._id === filters.country);
    if (filters.state) data = data.filter((tv) => tv.state?._id === filters.state);
    if (filters.city) data = data.filter((tv) => tv.city?._id === filters.city);
    if (filters.zone) data = data.filter((tv) => tv.zone?._id === filters.zone);
    if (filters.store) data = data.filter((tv) => tv.store?._id === filters.store);
    if (filters.status !== 'all') data = data.filter((tv) => tv.status === filters.status);
    if (filters.isActive !== 'all') data = data.filter((tv) => 
      filters.isActive === 'active' ? tv.isActive : !tv.isActive
    );
    return data;
  }, [tvs, searchTerm, filters]);

  // Reset form and close modal
  const closeModal = () => {
    setModalType(null);
    setSelectedTV(null);
    setFormData({
      store: '', zone: '', city: '', state: '', country: '', macAddress: '',
      serialNumber: '', screenSize: '', resolution: '', manufacturer: '', model: '',
      ipAddress: '', locationAddress: '', locationFloor: '', locationLat: '',
      locationLng: '', installationNotes: '', isActive: true, status: 'offline'
    });
    setErrors({});
  };

  // Open modals
  const openCreateModal = () => {
    closeModal();
    setModalType('create');
  };

  const openEditModal = (tv) => {
    setSelectedTV(tv);
    setFormData({
      store: tv.store?._id || '', zone: tv.zone?._id || '', city: tv.city?._id || '',
      state: tv.state?._id || '', country: tv.country?._id || '',
      macAddress: tv.macAddress || '', serialNumber: tv.serialNumber || '',
      screenSize: tv.screenSize || '', resolution: tv.resolution || '',
      manufacturer: tv.manufacturer || '', model: tv.model || '',
      ipAddress: tv.ipAddress || '', locationAddress: tv.location?.address || '',
      locationFloor: tv.location?.floor || '', 
      locationLat: tv.location?.coordinates?.[1] ?? '',
      locationLng: tv.location?.coordinates?.[0] ?? '',
      installationNotes: tv.installationNotes || tv.location?.installationNotes || '',
      isActive: !!tv.isActive, status: tv.status || 'offline'
    });
    setErrors({});
    setModalType('edit');
  };

  const openViewModal = (tv) => {
    setSelectedTV(tv);
    setModalType('view');
  };
  const handleReportClick = (tv) => {
    setSelectedTV(tv);
    navigate(`/dashboard/${tv._id}/tv-logs-analysis`)
  };

  // Validation
  const validateTV = (data) => {
    const vErrors = {};
    if (!data.country) vErrors.country = 'Country is required';
    if (!data.state) vErrors.state = 'State is required';
    if (!data.city) vErrors.city = 'City is required';
    if (!data.zone) vErrors.zone = 'Zone is required';
    if (!data.store) vErrors.store = 'Store is required';
    if (!data.screenSize) vErrors.screenSize = 'Screen size is required';
    if (!data.resolution) vErrors.resolution = 'Resolution is required';
    return vErrors;
  };

  // CRUD Operations
  const handleSubmit = async (e) => {
    e.preventDefault();
    const vErrors = validateTV(formData);
    if (Object.keys(vErrors).length) {
      setErrors(vErrors);
      return;
    }

    try {
      const location = formData.locationLat && formData.locationLng ? {
        type: 'Point',
        coordinates: [Number(formData.locationLng), Number(formData.locationLat)],
        address: formData.locationAddress || undefined,
        floor: formData.locationFloor || undefined,
        installationNotes: formData.installationNotes || undefined,
      } : undefined;

      const payload = {
        store: formData.store, zone: formData.zone, city: formData.city,
        state: formData.state, country: formData.country,
        macAddress: formData.macAddress || undefined,
        serialNumber: formData.serialNumber || undefined,
        screenSize: formData.screenSize, resolution: formData.resolution,
        manufacturer: formData.manufacturer || undefined,
        model: formData.model || undefined,
        ipAddress: formData.ipAddress || undefined,
        location, isActive: formData.isActive, status: formData.status,
        installationNotes: formData.installationNotes || undefined,
      };

      if (modalType === 'create') {
        await tvAPI.createTV(payload, token);
        toast.success('TV created successfully');
      } else {
        await tvAPI.updateTV(selectedTV._id, payload, token);
        toast.success('TV updated successfully');
      }
      
      await fetchAll();
      closeModal();
    } catch (e) {
      toast.error(e.response?.data?.message || `Failed to ${modalType} TV`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this TV?')) return;
    try {
      await tvAPI.deleteTV(id, token);
      toast.success('TV deleted successfully');
      await fetchAll();
    } catch (e) {
      toast.error('Failed to delete TV');
    }
  };

  const handleToggleActive = async (id) => {
    try {
      const res = await tvAPI.toggleTVStatus(id, token);
      toast.success(`TV ${res.data.data.isActive ? 'activated' : 'deactivated'} successfully`);
      await fetchAll();
    } catch (e) {
      toast.error('Failed to toggle TV status');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await tvAPI.updateTVStatus(id, { status }, token);
      toast.success('Status updated successfully');
      await fetchAll();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  // Filtered dropdown options based on selection
  const getFilteredOptions = (type) => {
    const { countries, states, cities, zones, stores } = dropdownData;
    const { country, state, city, zone } = modalType === 'view' ? selectedTV || {} : formData;
    
    switch (type) {
      case 'states':
        return states.filter(s => !country || s.country._id === country);
      case 'cities':
        return cities.filter(c => !state || c.state._id === state);
      case 'zones':
        return zones.filter(z => !city || z.city._id === city);
      case 'stores':
        return stores.filter(s => !zone || s.zone._id === zone);
      default:
        return [];
    }
  };

  const resetFilters = () => {
    setFilters({ country: '', state: '', city: '', zone: '', store: '', status: 'all', isActive: 'all' });
    setSearchTerm('');
  };

  // Status badge component
  const StatusBadge = ({ status, size = 'sm' }) => {
    const colors = {
      online: { bg: themeColors.success || '#10b981', text: themeColors.surface },
      offline: { bg: themeColors.danger || '#ef4444', text: themeColors.surface },
      maintenance: { bg: themeColors.warning || '#f59e0b', text: themeColors.surface }
    };
    const color = colors[status] || colors.offline;
    
    return (
      <span style={{
        padding: size === 'sm' ? '4px 8px' : '6px 12px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontWeight: 700, borderRadius: 999,
        background: color.bg, color: color.text
      }}>
        {status || 'offline'}
      </span>
    );
  };

  // Active badge component
  const ActiveBadge = ({ isActive }) => (
    <span style={{
      padding: '4px 8px', fontSize: '11px', fontWeight: 700, borderRadius: 999,
      background: isActive ? (themeColors.success || '#10b981') : (themeColors.danger || '#ef4444'),
      color: themeColors.surface
    }}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 256 }}>
        <RefreshCw className="animate-spin" style={{ height: 32, width: 32, color: themeColors.primary }} />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', maxWidth: '100vw', display: 'flex', justifyContent: 'center' }}>
      <div style={{ 
        width: '100%', maxWidth: '95vw', overflowX: 'hidden', padding: 16,
        background: themeColors.surface, borderRadius: 12,
        boxShadow: `0 4px 18px ${themeColors.primary}20`
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 24, flexWrap: 'wrap', gap: 12
        }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: themeColors.primary }}>
            Manage TVs ({filteredTVs.length})
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setViewType('grid')} style={{
              padding: '6px 12px', borderRadius: 999, border: `1px solid ${themeColors.border}`,
              background: viewType === 'grid' ? themeColors.primary : themeColors.surface,
              color: viewType === 'grid' ? themeColors.surface : themeColors.text,
              fontSize: 12, cursor: 'pointer'
            }}>Grid</button>
            <button onClick={() => setViewType('table')} style={{
              padding: '6px 12px', borderRadius: 999, border: `1px solid ${themeColors.border}`,
              background: viewType === 'table' ? themeColors.primary : themeColors.surface,
              color: viewType === 'table' ? themeColors.surface : themeColors.text,
              fontSize: 12, cursor: 'pointer'
            }}>Table</button>
            <button onClick={openCreateModal} style={{
              background: themeColors.primary, color: themeColors.surface,
              padding: '8px 14px', borderRadius: 8, display: 'flex',
              alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer'
            }}>
              <Plus style={{ height: 18, width: 18 }} />
              Add TV
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ marginBottom: 24, display: 'grid', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ 
              position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
              color: themeColors.muted, height: 18, width: 18
            }} />
            <input
              type="text" placeholder="Search by TV ID, MAC, Serial, IP, Model..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                paddingLeft: 40, paddingRight: 12, paddingTop: 8, paddingBottom: 8, width: '100%',
                border: `1px solid ${themeColors.border}`, borderRadius: 8,
                background: themeColors.background, color: themeColors.text
              }}
            />
          </div>

          <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: 8, overflow: 'hidden', background: themeColors.background }}>
            <button onClick={() => setShowFilters(!showFilters)} style={{
              width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', background: 'transparent', border: 'none',
              cursor: 'pointer', color: themeColors.text
            }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Filter style={{ height: 16, width: 16, marginRight: 8 }} />Filters
              </div>
              {showFilters ? <ChevronUp style={{ height: 16, width: 16 }} /> : <ChevronDown style={{ height: 16, width: 16 }} />}
            </button>

            {showFilters && (
              <div style={{ padding: 16, borderTop: `1px solid ${themeColors.border}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {['country', 'state', 'city', 'zone', 'store'].map((field) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </label>
                    <select
                      value={filters[field]}
                      onChange={(e) => {
                        const newFilters = { ...filters, [field]: e.target.value };
                        if (field === 'country') newFilters.state = newFilters.city = newFilters.zone = newFilters.store = '';
                        if (field === 'state') newFilters.city = newFilters.zone = newFilters.store = '';
                        if (field === 'city') newFilters.zone = newFilters.store = '';
                        if (field === 'zone') newFilters.store = '';
                        setFilters(newFilters);
                      }}
                      disabled={field !== 'country' && !filters[field === 'state' ? 'country' : field === 'city' ? 'state' : field === 'zone' ? 'city' : 'zone']}
                      style={{
                        width: '100%', padding: '8px 10px', borderRadius: 8,
                        border: `1px solid ${themeColors.border}`,
                        background: themeColors.background, color: themeColors.text
                      }}
                    >
                      <option value="">All {field}s</option>
                      {(field === 'country' ? dropdownData.countries :
                        field === 'state' ? getFilteredOptions('states') :
                        field === 'city' ? getFilteredOptions('cities') :
                        field === 'zone' ? getFilteredOptions('zones') :
                        getFilteredOptions('stores')).map((item) => (
                        <option key={item._id} value={item._id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                ))}
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Status</label>
                  <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: `1px solid ${themeColors.border}`,
                    background: themeColors.background, color: themeColors.text
                  }}>
                    <option value="all">All</option>
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Active</label>
                  <select value={filters.isActive} onChange={(e) => setFilters({ ...filters, isActive: e.target.value })} style={{
                    width: '100%', padding: '8px 10px', borderRadius: 8,
                    border: `1px solid ${themeColors.border}`,
                    background: themeColors.background, color: themeColors.text
                  }}>
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button onClick={resetFilters} style={{
                    padding: '8px 12px', color: themeColors.text,
                    background: themeColors.surface, borderRadius: 8,
                    border: `1px solid ${themeColors.border}`, width: '100%', cursor: 'pointer'
                  }}>Reset Filters</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TVs Display */}
        {viewType === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
            {filteredTVs.length === 0 ? (
              <div style={{ 
                gridColumn: '1 / -1', padding: 32, textAlign: 'center', color: themeColors.text,
                borderRadius: 8, border: `1px dashed ${themeColors.border}`, background: themeColors.background
              }}>
                No TVs found
              </div>
            ) : (
              filteredTVs.map((tv) => (
                <div key={tv._id} style={{
                  background: themeColors.background, border: `1px solid ${themeColors.border}`,
                  borderRadius: 10, padding: 16, display: 'flex', flexDirection: 'column', gap: 12
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: 10, minWidth: 0, flex: 1 }}>
                      <TvIcon style={{ height: 20, width: 20, color: themeColors.primary, marginTop: 2, flexShrink: 0 }} />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, color: themeColors.primary, fontSize: 14, wordBreak: 'break-word' }}>
                          #{tv.tvId || 'N/A'}
                        </div>
                        <div style={{ fontSize: 12, color: themeColors.text, marginTop: 2 }}>
                          {tv.manufacturer} {tv.model}
                        </div>
                        <div style={{ fontSize: 11, color: themeColors.muted, marginTop: 1 }}>
                          {tv.screenSize} • {tv.resolution}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={tv.status} />
                  </div>

                  <div style={{ display: 'grid', gap: 4, fontSize: 12 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
                      <MapPin style={{ height: 12, width: 12, color: themeColors.muted }} />
                      <span style={{ color: themeColors.text }}>
                        {tv.store?.name}, {tv.city?.name}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 8, alignItems: 'center' }}>
                      <Wifi style={{ height: 12, width: 12, color: themeColors.muted }} />
                      <span style={{ color: themeColors.text }}>
                        {tv.ipAddress || 'No IP'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, borderTop: `1px solid ${themeColors.border}` }}>
                    <ActiveBadge isActive={tv.isActive} />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => openViewModal(tv)} style={{
                        padding: '6px 8px', borderRadius: 6, border: `1px solid ${themeColors.border}`,
                        background: themeColors.surface, color: themeColors.text, cursor: 'pointer', fontSize: 12
                      }}>
                        View
                      </button>
                      <button onClick={() => openEditModal(tv)} style={{
                        padding: '6px 8px', borderRadius: 6, border: `1px solid ${themeColors.primary}`,
                        background: themeColors.surface, color: themeColors.primary, cursor: 'pointer'
                      }}>
                        <Pencil style={{ height: 12, width: 12 }} />
                      </button>
                      <button onClick={() => handleDelete(tv._id)} style={{
                        padding: '6px 8px', borderRadius: 6, border: `1px solid ${themeColors.danger}`,
                        background: themeColors.surface, color: themeColors.danger, cursor: 'pointer'
                      }}>
                        <Trash2 style={{ height: 12, width: 12 }} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', background: themeColors.surface, border: `1px solid ${themeColors.border}`, borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: themeColors.background }}>
                  {['TV Info', 'Location', 'Network', 'Status', 'Last Sync', 'Actions'].map((header) => (
                    <th key={header} style={{
                      padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700,
                      color: themeColors.primary, borderBottom: `1px solid ${themeColors.border}`
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTVs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 32, textAlign: 'center', color: themeColors.text }}>
                      No TVs found
                    </td>
                  </tr>
                ) : (
                  filteredTVs.map((tv) => (
                    <tr key={tv._id} style={{ borderBottom: `1px solid ${themeColors.border}` }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <TvIcon style={{ height: 16, width: 16, color: themeColors.muted, flexShrink: 0 }} />
                          <div>
                            <div style={{ fontWeight: 600, color: themeColors.primary, fontSize: 13 }}>
                              #{tv.tvId || 'N/A'}
                            </div>
                            <div style={{ fontSize: 11, color: themeColors.text }}>
                              {tv.manufacturer} {tv.model}
                            </div>
                            <div style={{ fontSize: 10, color: themeColors.muted }}>
                              {tv.screenSize} • {tv.resolution}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: themeColors.text }}>
                        <div>{tv.store?.name}</div>
                        <div style={{ fontSize: 11, color: themeColors.muted }}>
                          {tv.city?.name}, {tv.state?.name}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: themeColors.text }}>
                        <div>IP: {tv.ipAddress || 'N/A'}</div>
                        <div style={{ fontSize: 11, color: themeColors.muted }}>
                          MAC: {tv.macAddress || 'N/A'}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <StatusBadge status={tv.status} />
                          <ActiveBadge isActive={tv.isActive} />
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: themeColors.text }}>
                        {tv.lastSyncTime ? new Date(tv.lastSyncTime).toLocaleString() : 'Never'}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => openViewModal(tv)} style={{
                            color: themeColors.accent, background: 'none', border: 'none', cursor: 'pointer'
                          }}>
                            <Eye style={{ height: 14, width: 14 }} />
                          </button>
                          <button onClick={() => handleReportClick(tv)} style={{
                            color: themeColors.accent, background: 'none', border: 'none', cursor: 'pointer'
                          }}>
                            <FileText  style={{ height: 14, width: 14 }} />
                          </button>
                          <button onClick={() => handleToggleActive(tv._id)} style={{
                            color: themeColors.text, background: 'none', border: 'none', cursor: 'pointer'
                          }}>
                            {tv.isActive ? <EyeOff style={{ height: 14, width: 14 }} /> : <Eye style={{ height: 14, width: 14 }} />}
                          </button>
                          <select
                            value={tv.status}
                            onChange={(e) => handleUpdateStatus(tv._id, e.target.value)}
                            style={{
                              fontSize: 11, padding: '4px 6px', borderRadius: 4,
                              border: `1px solid ${themeColors.border}`,
                              background: themeColors.background, color: themeColors.text
                            }}
                          >
                            <option value="online">Online</option>
                            <option value="offline">Offline</option>
                            <option value="maintenance">Maintenance</option>
                          </select>
                          <button onClick={() => openEditModal(tv)} style={{
                            color: themeColors.primary, background: 'none', border: 'none', cursor: 'pointer'
                          }}>
                            <Pencil style={{ height: 14, width: 14 }} />
                          </button>
                          <button onClick={() => handleDelete(tv._id)} style={{
                            color: themeColors.danger, background: 'none', border: 'none', cursor: 'pointer'
                          }}>
                            <Trash2 style={{ height: 14, width: 14 }} />
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

        {/* Unified Modal */}
        {modalType && (
          <div style={{ 
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50
          }}>
            <div style={{
              background: themeColors.surface, borderRadius: 12, padding: 0,
              width: '100%', maxWidth: modalType === 'view' ? 800 : 900,
              maxHeight: '90vh', overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: 20, borderBottom: `1px solid ${themeColors.border}`
              }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: themeColors.primary }}>
                  {modalType === 'create' && 'Create New TV'}
                  {modalType === 'edit' && 'Edit TV'}
                  {modalType === 'view' && `TV Details - ${selectedTV?.tvId || 'N/A'}`}
                </h2>
                <button onClick={closeModal} style={{
                  background: 'none', border: 'none', color: themeColors.text,
                  cursor: 'pointer', padding: 4
                }}>
                  <X style={{ height: 20, width: 20 }} />
                </button>
              </div>

              {/* Modal Content */}
              <div style={{ padding: 20 }}>
                {modalType === 'view' ? (
                  // View Modal Content
                  <div style={{ display: 'grid', gap: 20 }}>
                    {/* TV Overview */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16, alignItems: 'center',
                      padding: 16, background: themeColors.background, borderRadius: 8
                    }}>
                      <TvIcon style={{ height: 24, width: 24, color: themeColors.primary }} />
                      <div>
                        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: themeColors.primary }}>
                          {selectedTV?.manufacturer} {selectedTV?.model}
                        </h3>
                        <p style={{ margin: 0, fontSize: 14, color: themeColors.text }}>
                          ID: {selectedTV?.tvId} • {selectedTV?.screenSize} • {selectedTV?.resolution}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <StatusBadge status={selectedTV?.status} size="md" />
                        <ActiveBadge isActive={selectedTV?.isActive} />
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
                      {/* Hardware Info */}
                      <div style={{ padding: 16, background: themeColors.background, borderRadius: 8 }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: themeColors.primary }}>
                          Hardware Information
                        </h4>
                        <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>Manufacturer:</span>
                            <span style={{ color: themeColors.text }}>{selectedTV?.manufacturer || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>Model:</span>
                            <span style={{ color: themeColors.text }}>{selectedTV?.model || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>Screen Size:</span>
                            <span style={{ color: themeColors.text }}>{selectedTV?.screenSize || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>Resolution:</span>
                            <span style={{ color: themeColors.text }}>{selectedTV?.resolution || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>Serial No:</span>
                            <span style={{ color: themeColors.text, fontFamily: 'monospace', fontSize: 12 }}>
                              {selectedTV?.serialNumber || 'N/A'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>Firmware:</span>
                            <span style={{ color: themeColors.text }}>{selectedTV?.firmwareVersion || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Network Info */}
                      <div style={{ padding: 16, background: themeColors.background, borderRadius: 8 }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: themeColors.primary }}>
                          Network Information
                        </h4>
                        <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>IP Address:</span>
                            <span style={{ color: themeColors.text, fontFamily: 'monospace' }}>
                              {selectedTV?.ipAddress || 'N/A'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>MAC:</span>
                            <span style={{ color: themeColors.text, fontFamily: 'monospace', fontSize: 12 }}>
                              {selectedTV?.macAddress || 'N/A'}
                            </span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>Last Sync:</span>
                            <span style={{ color: themeColors.text }}>
                              {selectedTV?.lastSyncTime ? new Date(selectedTV.lastSyncTime).toLocaleString() : 'Never'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Location Info */}
                      <div style={{ padding: 16, background: themeColors.background, borderRadius: 8 }}>
                        <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: themeColors.primary }}>
                          Location Details
                        </h4>
                        <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>Country:</span>
                            <span style={{ color: themeColors.text }}>{selectedTV?.country?.name || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>State:</span>
                            <span style={{ color: themeColors.text }}>{selectedTV?.state?.name || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>City:</span>
                            <span style={{ color: themeColors.text }}>{selectedTV?.city?.name || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>Zone:</span>
                            <span style={{ color: themeColors.text }}>{selectedTV?.zone?.name || 'N/A'}</span>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                            <span style={{ color: themeColors.muted }}>Store:</span>
                            <span style={{ color: themeColors.text }}>{selectedTV?.store?.name || 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Physical Location */}
                      {selectedTV?.location && (
                        <div style={{ padding: 16, background: themeColors.background, borderRadius: 8 }}>
                          <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: themeColors.primary }}>
                            Physical Location
                          </h4>
                          <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                              <span style={{ color: themeColors.muted }}>Address:</span>
                              <span style={{ color: themeColors.text }}>{selectedTV.location.address || 'N/A'}</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                              <span style={{ color: themeColors.muted }}>Floor:</span>
                              <span style={{ color: themeColors.text }}>{selectedTV.location.floor || 'N/A'}</span>
                            </div>
                            {selectedTV.location.coordinates && (
                              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 8 }}>
                                <span style={{ color: themeColors.muted }}>Coordinates:</span>
                                <span style={{ color: themeColors.text, fontFamily: 'monospace', fontSize: 12 }}>
                                  {selectedTV.location.coordinates[1]}, {selectedTV.location.coordinates[0]}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Installation Notes */}
                    {(selectedTV?.installationNotes || selectedTV?.location?.installationNotes) && (
                      <div style={{ padding: 16, background: themeColors.background, borderRadius: 8 }}>
                        <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600, color: themeColors.primary }}>
                          Installation Notes
                        </h4>
                        <p style={{ margin: 0, fontSize: 13, color: themeColors.text, lineHeight: 1.5 }}>
                          {selectedTV?.installationNotes || selectedTV?.location?.installationNotes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  // Create/Edit Form
                  <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
                    {/* Location Fields */}
                    <div>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: themeColors.primary }}>
                        Location Information
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                        {[
                          { field: 'country', label: 'Country', options: dropdownData.countries, required: true },
                          { field: 'state', label: 'State', options: getFilteredOptions('states'), required: true, disabled: !formData.country },
                          { field: 'city', label: 'City', options: getFilteredOptions('cities'), required: true, disabled: !formData.state },
                          { field: 'zone', label: 'Zone', options: getFilteredOptions('zones'), required: true, disabled: !formData.city },
                          { field: 'store', label: 'Store', options: getFilteredOptions('stores'), required: true, disabled: !formData.zone }
                        ].map(({ field, label, options, required, disabled }) => (
                          <div key={field}>
                            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>
                              {label} {required && '*'}
                            </label>
                            <select
                              value={formData[field]}
                              onChange={(e) => {
                                const newData = { ...formData, [field]: e.target.value };
                                if (field === 'country') newData.state = newData.city = newData.zone = newData.store = '';
                                if (field === 'state') newData.city = newData.zone = newData.store = '';
                                if (field === 'city') newData.zone = newData.store = '';
                                if (field === 'zone') newData.store = '';
                                setFormData(newData);
                              }}
                              disabled={disabled}
                              style={{
                                width: '100%', padding: '8px 12px', borderRadius: 6,
                                border: `1px solid ${errors[field] ? themeColors.danger : themeColors.border}`,
                                background: themeColors.background, color: themeColors.text
                              }}
                            >
                              <option value="">Select {label}</option>
                              {options.map((item) => (
                                <option key={item._id} value={item._id}>{item.name}</option>
                              ))}
                            </select>
                            {errors[field] && <p style={{ color: themeColors.danger, fontSize: 11, marginTop: 4 }}>{errors[field]}</p>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* TV Specifications */}
<div>
  <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: themeColors.primary }}>
    TV Specifications
  </h3>
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
    {[
      { 
        field: 'screenSize', 
        label: 'Screen Size', 
        type: 'select',
        options: ['32 inch', '42 inch', '55 inch', '65 inch', '75 inch', '85 inch', 'other'],
        required: true 
      },
      { 
        field: 'resolution', 
        label: 'Resolution', 
        type: 'select',
        options: ['HD', 'Full HD', '2K', '4K', '8K', 'other'],
        required: true 
      },
      { field: 'manufacturer', label: 'Manufacturer', type: 'text', placeholder: 'e.g., Samsung' },
      { field: 'model', label: 'Model', type: 'text', placeholder: 'e.g., QN55Q80A' },
      { field: 'macAddress', label: 'MAC Address', type: 'text', placeholder: '00:11:22:33:44:55' },
      { field: 'serialNumber', label: 'Serial Number', type: 'text', placeholder: 'SN123456789' },
      { field: 'ipAddress', label: 'IP Address', type: 'text', placeholder: '192.168.1.100' }
    ].map(({ field, label, type, options, placeholder, required }) => (
      <div key={field}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>
          {label} {required && '*'}
        </label>
        
        {type === 'select' ? (
          <>
            <select
              value={formData[field] || ''}
              onChange={(e) => {
                const value = e.target.value;
                // Agar "other" select kiya toh, field ko "other" set karo
                setFormData({ ...formData, [field]: value });
              }}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 6,
                border: `1px solid ${errors[field] ? themeColors.danger : themeColors.border}`,
                background: themeColors.background, color: themeColors.text,
                marginBottom: (formData[field] === 'other') ? 8 : 0
              }}
            >
              <option value="">Select {label}</option>
              {options.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
            
            {/* Agar "other" select kiya hai toh custom input dikhao */}
            {(formData[field] === 'other') && (
              <input
                type="text"
                value={formData[`${field}Other`] || ''}
                onChange={(e) => setFormData({ ...formData, [`${field}Other`]: e.target.value })}
                placeholder={`Enter custom ${label.toLowerCase()}`}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 6,
                  border: `1px solid ${errors[`${field}Other`] ? themeColors.danger : themeColors.border}`,
                  background: themeColors.background, color: themeColors.text,
                  marginTop: 8
                }}
              />
            )}
          </>
        ) : (
          <input
            type="text"
            value={formData[field] || ''}
            onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
            placeholder={placeholder}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 6,
              border: `1px solid ${errors[field] ? themeColors.danger : themeColors.border}`,
              background: themeColors.background, color: themeColors.text
            }}
          />
        )}
        
        {errors[field] && <p style={{ color: themeColors.danger, fontSize: 11, marginTop: 4 }}>{errors[field]}</p>}
        {errors[`${field}Other`] && <p style={{ color: themeColors.danger, fontSize: 11, marginTop: 4 }}>{errors[`${field}Other`]}</p>}
      </div>
    ))}
  </div>
</div>

                    {/* Physical Location */}
                    <div>
                      <h3 style={{ margin: '0 0 12px 0', fontSize: 16, fontWeight: 600, color: themeColors.primary }}>
                        Physical Location (Optional)
                      </h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>
                            Address
                          </label>
                          <input
                            type="text"
                            value={formData.locationAddress}
                            onChange={(e) => setFormData({ ...formData, locationAddress: e.target.value })}
                            placeholder="Full address"
                            style={{
                              width: '100%', padding: '8px 12px', borderRadius: 6,
                              border: `1px solid ${themeColors.border}`,
                              background: themeColors.background, color: themeColors.text
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>
                            Floor
                          </label>
                          <input
                            type="text"
                            value={formData.locationFloor}
                            onChange={(e) => setFormData({ ...formData, locationFloor: e.target.value })}
                            placeholder="Ground Floor"
                            style={{
                              width: '100%', padding: '8px 12px', borderRadius: 6,
                              border: `1px solid ${themeColors.border}`,
                              background: themeColors.background, color: themeColors.text
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>
                            Latitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={formData.locationLat}
                            onChange={(e) => setFormData({ ...formData, locationLat: e.target.value })}
                            placeholder="12.9712"
                            style={{
                              width: '100%', padding: '8px 12px', borderRadius: 6,
                              border: `1px solid ${themeColors.border}`,
                              background: themeColors.background, color: themeColors.text
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>
                            Longitude
                          </label>
                          <input
                            type="number"
                            step="any"
                            value={formData.locationLng}
                            onChange={(e) => setFormData({ ...formData, locationLng: e.target.value })}
                            placeholder="77.5949"
                            style={{
                              width: '100%', padding: '8px 12px', borderRadius: 6,
                              border: `1px solid ${themeColors.border}`,
                              background: themeColors.background, color: themeColors.text
                            }}
                          />
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>
                            Installation Notes
                          </label>
                          <textarea
                            value={formData.installationNotes}
                            onChange={(e) => setFormData({ ...formData, installationNotes: e.target.value })}
                            placeholder="Additional notes about installation..."
                            rows={3}
                            style={{
                              width: '100%', padding: '8px 12px', borderRadius: 6,
                              border: `1px solid ${themeColors.border}`,
                              background: themeColors.background, color: themeColors.text,
                              resize: 'vertical'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Settings */}
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 12, background: themeColors.background, borderRadius: 6 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                          style={{ width: 16, height: 16, accentColor: themeColors.primary }}
                        />
                        <span style={{ color: themeColors.text, fontSize: 14, fontWeight: 500 }}>
                          Active TV
                        </span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <label style={{ fontSize: 13, fontWeight: 600, color: themeColors.primary }}>
                          Status:
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          style={{
                            padding: '6px 10px', borderRadius: 4,
                            border: `1px solid ${themeColors.border}`,
                            background: themeColors.background, color: themeColors.text, fontSize: 12
                          }}
                        >
                          <option value="offline">Offline</option>
                          <option value="online">Online</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                    </div>

                    {/* Form Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 12, borderTop: `1px solid ${themeColors.border}` }}>
                      <button type="button" onClick={closeModal} style={{
                        padding: '10px 16px', color: themeColors.text, background: themeColors.background,
                        borderRadius: 6, border: `1px solid ${themeColors.border}`, cursor: 'pointer'
                      }}>
                        Cancel
                      </button>
                      <button type="submit" style={{
                        padding: '10px 16px', color: themeColors.surface, background: themeColors.primary,
                        borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 600
                      }}>
                        {modalType === 'create' ? 'Create TV' : 'Update TV'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageTVs;