import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Pencil,
  Trash2,
  Plus,
  Search,
  Eye,
  EyeOff,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  Store as StoreIcon
} from 'lucide-react';
import storeAPI from '../apis/storeAPI';
import countryAPI from '../apis/countryAPI';
import stateAPI from '../apis/stateAPI';
import cityAPI from '../apis/cityAPI';
import zoneAPI from '../apis/zoneAPI';
import { useSelector } from 'react-redux';
import { useTheme } from '../context/ThemeContext';

const ManageStores = () => {
  const { themeColors } = useTheme();
  const [viewType, setViewType] = useState('grid'); // 'grid' or 'table'
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [zones, setZones] = useState([]);
  const [filteredStates, setFilteredStates] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [filteredZones, setFilteredZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    country: '',
    state: '',
    city: '',
    zone: '',
    status: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    state: '',
    city: '',
    zone: '',
    isActive: true
  });
  const [errors, setErrors] = useState({});
  const auth = useSelector((state) => state.auth.user);
  const token = auth?.token;

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterStores();
  }, [searchTerm, filters, stores]);

  useEffect(() => {
    // Filter states based on selected country
    if (filters.country) {
      const filtered = states.filter(state => state.country._id === filters.country);
      setFilteredStates(filtered);
    } else {
      setFilteredStates(states);
    }
  }, [filters.country, states]);

  useEffect(() => {
    // Filter cities based on selected state
    if (filters.state) {
      const filtered = cities.filter(city => city.state._id === filters.state);
      setFilteredCities(filtered);
    } else {
      setFilteredCities(cities);
    }
  }, [filters.state, cities]);

  useEffect(() => {
    // Filter zones based on selected city
    if (filters.city) {
      const filtered = zones.filter(zone => zone.city._id === filters.city);
      setFilteredZones(filtered);
    } else {
      setFilteredZones(zones);
    }
  }, [filters.city, zones]);

  useEffect(() => {
    // When country changes in form, reset state and filter states
    if (formData.country) {
      const filtered = states.filter(state => state.country._id === formData.country);
      setFilteredStates(filtered);
      // Reset state selection if it doesn't belong to the new country
      if (formData.state) {
        const currentState = states.find(s => s._id === formData.state);
        if (!currentState || currentState.country._id !== formData.country) {
          setFormData(prev => ({ ...prev, state: '', city: '', zone: '' }));
        }
      }
    } else {
      setFilteredStates(states);
    }
  }, [formData.country, states]);

  useEffect(() => {
    // When state changes in form, reset city and filter cities
    if (formData.state) {
      const filtered = cities.filter(city => city.state._id === formData.state);
      setFilteredCities(filtered);
      // Reset city selection if it doesn't belong to the new state
      if (formData.city) {
        const currentCity = cities.find(c => c._id === formData.city);
        if (!currentCity || currentCity.state._id !== formData.state) {
          setFormData(prev => ({ ...prev, city: '', zone: '' }));
        }
      }
    } else {
      setFilteredCities(cities);
    }
  }, [formData.state, cities]);

  useEffect(() => {
    // When city changes in form, reset zone and filter zones
    if (formData.city) {
      const filtered = zones.filter(zone => zone.city._id === formData.city);
      setFilteredZones(filtered);
      // Reset zone selection if it doesn't belong to the new city
      if (formData.zone) {
        const currentZone = zones.find(z => z._id === formData.zone);
        if (!currentZone || currentZone.city._id !== formData.city) {
          setFormData(prev => ({ ...prev, zone: '' }));
        }
      }
    } else {
      setFilteredZones(zones);
    }
  }, [formData.city, zones]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchStores(),
        fetchCountries(),
        fetchStates(),
        fetchCities(),
        fetchZones()
      ]);
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const response = await storeAPI.getStores({}, token);
      setStores(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch stores');
    }
  };

  const fetchCountries = async () => {
    try {
      const response = await countryAPI.getCountries(token);
      setCountries(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch countries');
    }
  };

  const fetchStates = async () => {
    try {
      const response = await stateAPI.getStates({}, token);
      setStates(response.data.data);
      setFilteredStates(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch states');
    }
  };

  const fetchCities = async () => {
    try {
      const response = await cityAPI.getCities({}, token);
      setCities(response.data.data);
      setFilteredCities(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch cities');
    }
  };

  const fetchZones = async () => {
    try {
      const response = await zoneAPI.getZones({}, token);
      setZones(response.data.data);
      setFilteredZones(response.data.data);
    } catch (error) {
      toast.error('Failed to fetch zones');
    }
  };

  const filterStores = () => {
    let filtered = stores;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.zone?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.city?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.state?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.country?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by country
    if (filters.country) {
      filtered = filtered.filter(store => store.country._id === filters.country);
    }

    // Filter by state
    if (filters.state) {
      filtered = filtered.filter(store => store.state._id === filters.state);
    }

    // Filter by city
    if (filters.city) {
      filtered = filtered.filter(store => store.city._id === filters.city);
    }

    // Filter by zone
    if (filters.zone) {
      filtered = filtered.filter(store => store.zone._id === filters.zone);
    }

    // Filter by status
    if (filters.status === 'active') {
      filtered = filtered.filter(store => store.isActive);
    } else if (filters.status === 'inactive') {
      filtered = filtered.filter(store => !store.isActive);
    }

    setFilteredStores(filtered);
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Store name is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.zone) newErrors.zone = 'Zone is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await storeAPI.createStore(formData, token);
      setStores([...stores, response.data.data]);
      setShowCreateModal(false);
      setFormData({ name: '', country: '', state: '', city: '', zone: '', isActive: true });
      toast.success('Store created successfully');
      fetchStores();
    } catch (error) {
      if (error.response?.data?.message === 'Store already exists in this zone') {
        setErrors({ name: 'Store already exists in this zone' });
      } else if (error.response?.data?.message === 'State not found or doesn\'t belong to the specified country') {
        setErrors({ state: 'State does not belong to the selected country' });
      } else if (error.response?.data?.message === 'City not found or doesn\'t belong to the specified state') {
        setErrors({ city: 'City does not belong to the selected state' });
      } else if (error.response?.data?.message === 'Zone not found or doesn\'t belong to the specified city') {
        setErrors({ zone: 'Zone does not belong to the selected city' });
      } else {
        toast.error('Failed to create store');
      }
    }
  };

  const handleUpdateStore = async (e) => {
    e.preventDefault();

    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Store name is required';
    if (!formData.country) newErrors.country = 'Country is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.zone) newErrors.zone = 'Zone is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const response = await storeAPI.updateStore(
        selectedStore._id,
        formData,
        token
      );

      const updatedStores = stores.map(store =>
        store._id === selectedStore._id ? response.data.data : store
      );

      setStores(updatedStores);
      setShowEditModal(false);
      setSelectedStore(null);
      toast.success('Store updated successfully');
      fetchStores();
    } catch (error) {
      if (error.response?.data?.message === 'Store with this name already exists in the zone') {
        setErrors({ name: 'Store name already exists in this zone' });
      } else if (error.response?.data?.message === 'State not found or doesn\'t belong to the specified country') {
        setErrors({ state: 'State does not belong to the selected country' });
      } else if (error.response?.data?.message === 'City not found or doesn\'t belong to the specified state') {
        setErrors({ city: 'City does not belong to the selected state' });
      } else if (error.response?.data?.message === 'Zone not found or doesn\'t belong to the specified city') {
        setErrors({ zone: 'Zone does not belong to the selected city' });
      } else {
        toast.error('Failed to update store');
      }
    }
  };

  const handleDeleteStore = async (id) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;

    try {
      await storeAPI.deleteStore(id, token);
      const updatedStores = stores.filter(store => store._id !== id);
      setStores(updatedStores);
      toast.success('Store deleted successfully');
      fetchStores();
    } catch (error) {
      toast.error('Failed to delete store');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const response = await storeAPI.toggleStoreStatus(id, token);
      const updatedStores = stores.map(store =>
        store._id === id ? response.data.data : store
      );
      // setStores(updatedStores);
      fetchStores();
      toast.success(`Store ${response.data.data.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      toast.error('Failed to update store status');
    }
  };

  const openEditModal = (store) => {
    setSelectedStore(store);
    setFormData({
      name: store.name,
      country: store.country._id,
      state: store.state._id,
      city: store.city._id,
      zone: store.zone._id,
      isActive: store.isActive
    });
    setErrors({});
    setShowEditModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedStore(null);
    setFormData({ name: '', country: '', state: '', city: '', zone: '', isActive: true });
    setErrors({});
  };

  const resetFilters = () => {
    setFilters({ country: '', state: '', city: '', zone: '', status: 'all' });
    setSearchTerm('');
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 256 }}>
      <RefreshCw className="animate-spin" style={{ height: 32, width: 32, color: themeColors.primary }} />
    </div>
  );

  return (
    <div style={{ padding: 24, background: themeColors.surface, borderRadius: 16, boxShadow: `0 2px 16px ${themeColors.primary}10` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: themeColors.primary }}>Manage Stores</h1>
        <button onClick={() => setShowCreateModal(true)} style={{ background: themeColors.primary, color: themeColors.surface, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, border: 'none', boxShadow: `0 2px 8px ${themeColors.primary}20`, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.active.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.primary}>
          <Plus style={{ height: 20, width: 20, marginRight: 8 }} />
          Add Store
        </button>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => setViewType('grid')} style={{ padding: '6px 12px', borderRadius: 6, background: viewType === 'grid' ? themeColors.primary : themeColors.surface, color: viewType === 'grid' ? themeColors.surface : themeColors.text, border: `1px solid ${themeColors.border}`, fontWeight: 500, cursor: 'pointer' }}>Grid View</button>
          <button onClick={() => setViewType('table')} style={{ padding: '6px 12px', borderRadius: 6, background: viewType === 'table' ? themeColors.primary : themeColors.surface, color: viewType === 'table' ? themeColors.surface : themeColors.text, border: `1px solid ${themeColors.border}`, fontWeight: 500, cursor: 'pointer' }}>Table View</button>
        </div>
      </div>

      {/* Search & Filters */}
      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: themeColors.text, height: 18, width: 18 }} />
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search stores, zones, cities, states, or countries..." style={{ paddingLeft: 40, paddingRight: 12, paddingTop: 8, paddingBottom: 8, width: '100%', border: `1px solid ${themeColors.border}`, borderRadius: 8, background: themeColors.background, color: themeColors.text, outline: 'none' }} />
        </div>

        <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: 8, overflow: 'hidden', background: themeColors.background }}>
          <button onClick={() => setShowFilters((s) => !s)} style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', color: themeColors.text }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Filter style={{ height: 16, width: 16, marginRight: 8, color: themeColors.text }} />Filters</div>
            {showFilters ? <ChevronUp style={{ height: 16, width: 16, color: themeColors.text }} /> : <ChevronDown style={{ height: 16, width: 16, color: themeColors.text }} />}
          </button>
          {showFilters && (
            <div style={{ padding: 16, borderTop: `1px solid ${themeColors.border}`, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Country</label>
                <select value={filters.country} onChange={(e) => setFilters({ ...filters, country: e.target.value, state: '', city: '', zone: '' })} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All Countries</option>
                  {countries.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>State</label>
                <select value={filters.state} onChange={(e) => setFilters({ ...filters, state: e.target.value, city: '', zone: '' })} disabled={!filters.country} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All States</option>
                  {states.filter((s) => !filters.country || s.country._id === filters.country).map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>City</label>
                <select value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value, zone: '' })} disabled={!filters.state} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All Cities</option>
                  {cities.filter((c) => !filters.state || c.state._id === filters.state).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Zone</label>
                <select value={filters.zone} onChange={(e) => setFilters({ ...filters, zone: e.target.value })} disabled={!filters.city} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All Zones</option>
                  {zones.filter((z) => !filters.city || z.city._id === filters.city).map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Status</label>
                <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
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

      {viewType === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {filteredStores.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: themeColors.text, borderRadius: 12, border: `1px solid ${themeColors.border}`, background: themeColors.background }}>No stores found</div>
          ) : filteredStores.map((store) => (
            <div key={store._id} style={{ background: themeColors.background, border: `1px solid ${themeColors.border}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: `0 1px 4px ${themeColors.primary}10` }}>
              <div>
                <div style={{ fontWeight: 700, color: themeColors.primary, fontSize: 18, marginBottom: 6 }}>{store.name}</div>
                <div style={{ fontSize: 13, color: themeColors.text, marginBottom: 4 }}>Zone: <span style={{ fontWeight: 600 }}>{store.zone?.name || 'N/A'}</span></div>
                <div style={{ fontSize: 13, color: themeColors.text, marginBottom: 4 }}>City: <span style={{ fontWeight: 600 }}>{store.city?.name || 'N/A'}</span></div>
                <div style={{ fontSize: 13, color: themeColors.text, marginBottom: 4 }}>State: <span style={{ fontWeight: 600 }}>{store.state?.name || 'N/A'}</span></div>
                <div style={{ fontSize: 13, color: themeColors.text }}>Country: <span style={{ fontWeight: 600 }}>{store.country?.name || 'N/A'}</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                <span style={{ padding: '4px 10px', fontSize: 13, fontWeight: 600, borderRadius: 8, background: store.isActive ? themeColors.success : themeColors.danger, color: store.isActive ? themeColors.text : themeColors.surfaceDark }}>{store.isActive ? 'Active' : 'Inactive'}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleToggleStatus(store._id)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.border}`, color: themeColors.text, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>{store.isActive ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => openEditModal(store)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.primary}`, color: themeColors.primary, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>Edit</button>
                  <button onClick={() => handleDeleteStore(store._id)} style={{ padding: '6px 10px', fontSize: 13, borderRadius: 6, border: `1px solid ${themeColors.danger}`, color: themeColors.danger, background: themeColors.surface, cursor: 'pointer' }} onMouseEnter={(e) => e.currentTarget.style.background = themeColors.hover.background} onMouseLeave={(e) => e.currentTarget.style.background = themeColors.surface}>Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', width: '100%' }}>
          <table style={{ minWidth: '100%', background: themeColors.surface, border: `1px solid ${themeColors.border}`, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: themeColors.background }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Store Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Zone</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>City</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>State</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Country</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStores.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 16, textAlign: 'center', color: themeColors.text }}>No stores found</td></tr>
              ) : filteredStores.map((store) => (
                <tr key={store._id} style={{ borderTop: `1px solid ${themeColors.border}` }}>
                  <td style={{ padding: '12px 16px', color: themeColors.text, fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <StoreIcon style={{ height: 18, width: 18, color: themeColors.muted, marginRight: 8 }} />
                      <span>{store.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>{store.zone?.name || 'N/A'}</td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>{store.city?.name || 'N/A'}</td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>{store.state?.name || 'N/A'}</td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>{store.country?.name || 'N/A'}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: store.isActive ? themeColors.success : themeColors.danger, color: store.isActive ? themeColors.text : themeColors.surfaceDark }}>{store.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleToggleStatus(store._id)} title={store.isActive ? 'Deactivate' : 'Activate'} style={{ color: themeColors.text }}>{store.isActive ? <EyeOff style={{ height: 16, width: 16, color: themeColors.text }} /> : <Eye style={{ height: 16, width: 16, color: themeColors.text }} />}</button>
                      <button onClick={() => openEditModal(store)} title="Edit" style={{ color: themeColors.primary }}><Pencil style={{ height: 16, width: 16, color: themeColors.primary }} /></button>
                      <button onClick={() => handleDeleteStore(store._id)} title="Delete" style={{ color: themeColors.danger }}><Trash2 style={{ height: 16, width: 16, color: themeColors.danger }} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 500 }}>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary }}>Create New Store</h2>
              <form onSubmit={handleCreateStore}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Store Name *</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter store name" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.name ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 14, color: themeColors.text, background: themeColors.background }} />
                  {errors.name && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.name}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Country *</label>
                  <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '', city: '', zone: '' })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.country ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 14, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select Country</option>
                    {countries.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  {errors.country && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.country}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>State *</label>
                  <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '', zone: '' })} disabled={!formData.country} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.state ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 14, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select State</option>
                    {filteredStates.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  {errors.state && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.state}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>City *</label>
                  <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value, zone: '' })} disabled={!formData.state} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.city ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 14, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select City</option>
                    {filteredCities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  {errors.city && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.city}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Zone *</label>
                  <select value={formData.zone} onChange={(e) => setFormData({ ...formData, zone: e.target.value })} disabled={!formData.city} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.zone ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 14, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select Zone</option>
                    {filteredZones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
                  </select>
                  {errors.zone && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.zone}</p>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ height: 18, width: 18, accentColor: themeColors.primary, borderRadius: 4, marginRight: 8 }} />
                  <label style={{ color: themeColors.text }}>Active Store</label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={closeModals} style={{ padding: '8px 16px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 16px', color: themeColors.surface, background: themeColors.primary, borderRadius: 8, border: 'none' }}>Create Store</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Store Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 500 }}>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary }}>Edit Store</h2>
              <form onSubmit={handleUpdateStore}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Store Name *</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Enter store name" style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.name ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 14, color: themeColors.text, background: themeColors.background }} />
                  {errors.name && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.name}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Country *</label>
                  <select value={formData.country} onChange={(e) => setFormData({ ...formData, country: e.target.value, state: '', city: '', zone: '' })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.country ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 14, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select Country</option>
                    {countries.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  {errors.country && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.country}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>State *</label>
                  <select value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value, city: '', zone: '' })} disabled={!formData.country} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.state ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 14, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select State</option>
                    {filteredStates.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                  {errors.state && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.state}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>City *</label>
                  <select value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value, zone: '' })} disabled={!formData.state} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.city ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 14, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select City</option>
                    {filteredCities.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  {errors.city && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.city}</p>}
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 15, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Zone *</label>
                  <select value={formData.zone} onChange={(e) => setFormData({ ...formData, zone: e.target.value })} disabled={!formData.city} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.zone ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 14, color: themeColors.text, background: themeColors.background }}>
                    <option value="">Select Zone</option>
                    {filteredZones.map((z) => <option key={z._id} value={z._id}>{z.name}</option>)}
                  </select>
                  {errors.zone && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.zone}</p>}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ height: 18, width: 18, accentColor: themeColors.primary, borderRadius: 4, marginRight: 8 }} />
                  <label style={{ color: themeColors.text }}>Active Store</label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={closeModals} style={{ padding: '8px 16px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 16px', color: themeColors.surface, background: themeColors.primary, borderRadius: 8, border: 'none' }}>Update Store</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStores;