import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import scheduleAdAPI from '../apis/scheduleAdAPI';
import adAPI from '../apis/adAPI';
import tvAPI from '../apis/tvAPI';
import advertiserAPI from '../apis/advertiserAPI';
import { Plus, Pencil, Trash2, Eye, EyeOff, RefreshCw, Filter, ChevronDown, ChevronUp, Search, Info, X, Play } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const ManageAdSchedule = () => {
  const { themeColors } = useTheme();
  const auth = useSelector((state) => state.auth.user);
  const token = auth?.token;
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [ads, setAds] = useState([]);
  const [unScheduledAds, setUnScheduledAds] = useState([]);
  const [advertisers, setAdvertisers] = useState([]);
  const [tvs, setTvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ ad: '', tv: '', status: 'all' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [formData, setFormData] = useState({
    ad: '',
    adSearch: '',
    advertiserFilter: '',
    createdFrom: '',
    createdTo: '',
    tvs: [],
    tvSearch: '',
    validFrom: '',
    validTo: '',
    repeatInADay: 1,
    priority: 1,
    isActive: true
  });
  const [errors, setErrors] = useState({});

  const [playTimeOptions, setPlayTimeOptions] = useState([]);

  useEffect(() => {
    fetchAll();
    // Generate playtime options (every 1 minutes from 00:00 to 23:59)
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 1) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(timeString);
      }
    }
    setPlayTimeOptions(times);
  }, []);


  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [adsRes, unScheduledAdsRes, tvsRes, schedulesRes, advertisersRes] = await Promise.all([
        adAPI.getAds({}, token),
        adAPI.getUnScheduledAds({}, token),
        tvAPI.getTVs({}, token),
        scheduleAdAPI.getSchedules( token),
        advertiserAPI.getAdvertisers({}, token)
      ]);
      setAds(adsRes.data.data || []);
      setUnScheduledAds(unScheduledAdsRes.data.data || []);
      setTvs(tvsRes.data.data || []);
      setSchedules(schedulesRes.data.data || schedulesRes.data.data.schedules?.docs || []);
      setAdvertisers(advertisersRes.data.data.advertisers || []);
    } catch (e) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = schedules.filter(sch => {
    let match = true;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      match = sch.ad?.title?.toLowerCase().includes(q) || sch.tvs.some(tv => tv.tvId?.toLowerCase().includes(q));
    }
    if (filters.ad) match = match && sch.ad?._id === filters.ad;
    if (filters.tv) match = match && sch.tvs.some(tv => tv._id === filters.tv);
    if (filters.status !== 'all') match = match && (filters.status === 'active' ? sch.isActive : !sch.isActive);
    return match;
  });

  const resetFilters = () => {
    setFilters({ ad: '', tv: '', status: 'all' });
    setSearchTerm('');
  };

  const openViewModal = (schedule) => {
    setSelectedSchedule(schedule);
    setShowViewModal(true);
  };
  const openEditModal = (schedule) => {
    setSelectedSchedule(schedule);

    // Convert TV data to include playtimes - FIXED based on API response structure
    const tvsWithPlaytimes = schedule.tvs.map(tvObj => ({
      _id: tvObj.tv._id, // Use tvObj.tv._id instead of tvObj._id
      playTimes: tvObj.playTimes || []
    }));

    setFormData({
      ad: schedule.ad?._id || '',
      adSearch: '',
      advertiserFilter: '',
      createdFrom: '',
      createdTo: '',
      tvs: tvsWithPlaytimes,
      tvSearch: '',
      validFrom: schedule.validFrom ? new Date(schedule.validFrom).toISOString().slice(0, 16) : '',
      validTo: schedule.validTo ? new Date(schedule.validTo).toISOString().slice(0, 16) : '',
      repeatInADay: schedule.repeatInADay || 1,
      priority: schedule.priority || 1,
      isActive: schedule.isActive !== false
    });
    setErrors({});
    setShowEditModal(true);
  };


  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedSchedule(null);
    setFormData({
      ad: '',
      adSearch: '',
      advertiserFilter: '',
      createdFrom: '',
      createdTo: '',
      tvs: [],
      tvSearch: '',
      validFrom: '',
      validTo: '',
      repeatInADay: 1,
      priority: 1,
      isActive: true
    });
    setErrors({});
  };


const handleTVSelection = (tvId, isChecked) => {
  if (isChecked) {
    // Confirmation before adding
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to add this TV?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, add it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary,
      cancelButtonColor: themeColors.danger,
      background: themeColors.surface,
      color: themeColors.text,
      customClass: {
        popup: 'swal-popup',
        title: 'swal-title',
        content: 'swal-content',
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setFormData({
          ...formData,
          tvs: [...formData.tvs, { _id: tvId, playTimes: [] }]
        });
        Swal.fire({
          title: 'Added!',
          text: 'The TV has been added.',
          icon: 'success',
          confirmButtonColor: themeColors.primary,
          background: themeColors.surface,
          color: themeColors.text
        });
      }
    });
  } else {
    // Confirmation before removing
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to remove this TV? After this all selected times will be Deselected',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel',
      confirmButtonColor: themeColors.primary,
      cancelButtonColor: themeColors.danger,
      background: themeColors.surface,
      color: themeColors.text,
      customClass: {
        popup: 'swal-popup',
        title: 'swal-title',
        content: 'swal-content',
        confirmButton: 'swal-confirm-button',
        cancelButton: 'swal-cancel-button'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        setFormData({
          ...formData,
          tvs: formData.tvs.filter(tv => tv._id !== tvId)
        });
        Swal.fire({
          title: 'Removed!',
          text: 'The TV has been removed.',
          icon: 'success',
          confirmButtonColor: themeColors.primary,
          background: themeColors.surface,
          color: themeColors.text
        });
      }
    });
  }
};

  const validate = (data) => {
    const e = {};
    if (!data.ad) e.ad = 'An Ad is required';
    if (!data.tvs.length) e.tvs = 'At least one TV is required';

    // Validate that each TV has at least one playtime
    data.tvs.forEach((tv, index) => {
      if (!tv.playTimes || tv.playTimes.length === 0) {
        e[`tv-${tv._id}`] = 'At least one playtime is required for each TV';
      }
    });

    if (!data.validFrom) e.validFrom = 'Valid From is required';
    if (!data.validTo) e.validTo = 'Valid To is required';
    // if (data.validFrom && data.validTo && !new Date(data.validFrom) <= new Date(data.validTo)) e.validTo = 'Valid To must be after Valid From';
    return e;
  };

  const handlePlayTimeChange = (tvId, time, isChecked) => {
    setFormData({
      ...formData,
      tvs: formData.tvs.map(tv => {
        if (tv._id === tvId) {
          if (isChecked) {
            return {
              ...tv,
              playTimes: [...tv.playTimes, time]
            };
          } else {
            return {
              ...tv,
              playTimes: tv.playTimes.filter(t => t !== time)
            };
          }
        }
        return tv;
      })
    });
  };



  const handleCreate = async (e) => {
    e.preventDefault();
    const eObj = validate(formData);
    if (Object.keys(eObj).length) { setErrors(eObj); return; }

    try {
      const payload = {
        ad: formData.ad,
        tvs: formData.tvs.map(tv => ({
          tv: tv._id,
          playTimes: tv.playTimes
        })),
        validFrom: new Date(formData.validFrom),
        validTo: new Date(formData.validTo),
        repeatInADay: formData.repeatInADay,
        priority: formData.priority,
        isActive: formData.isActive
      };

      const res = await scheduleAdAPI.createSchedule(payload, token);
      // console.log(res)
      toast.success('Schedule created');
      closeModals();
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create schedule');
    }
  };


  const handleUpdate = async (e) => {
    e.preventDefault();
    const eObj = validate(formData);
    if (Object.keys(eObj).length) {
      setErrors(eObj);
      return;
    }

    try {
      const payload = {};

      // Check if TVs have changed (including playtimes) - FIXED based on API response structure
      const currentTvs = formData.tvs.map(tv => ({
        tv: tv._id,
        playTimes: tv.playTimes
      }));

      const originalTvs = selectedSchedule.tvs.map(tvObj => ({
        tv: tvObj.tv._id, // Use tvObj.tv._id instead of tvObj._id
        playTimes: tvObj.playTimes || []
      }));

      if (JSON.stringify(currentTvs) !== JSON.stringify(originalTvs)) {
        payload.tvs = currentTvs;
      }

      // Check other fields for changes
      if (formData.ad !== selectedSchedule.ad?._id) {
        payload.ad = formData.ad;
      }

      if (new Date(formData.validFrom).getTime() !== new Date(selectedSchedule.validFrom).getTime()) {
        payload.validFrom = new Date(formData.validFrom);
      }

      if (new Date(formData.validTo).getTime() !== new Date(selectedSchedule.validTo).getTime()) {
        payload.validTo = new Date(formData.validTo);
      }

      if (formData.repeatInADay !== selectedSchedule.repeatInADay) {
        payload.repeatInADay = formData.repeatInADay;
      }

      if (formData.priority !== selectedSchedule.priority) {
        payload.priority = formData.priority;
      }

      if (formData.isActive !== selectedSchedule.isActive) {
        payload.isActive = formData.isActive;
      }

      if (Object.keys(payload).length === 0) {
        toast.info('No changes detected');
        closeModals();
        return;
      }

      const res = await scheduleAdAPI.updateSchedule(selectedSchedule._id, payload, token);
      toast.success('Schedule updated');
      closeModals();
      await fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update schedule');
    }
  };
  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    try {
      await scheduleAdAPI.deleteSchedule(id, token);
      toast.success('Schedule deleted');
      await fetchAll();
    } catch (err) {
      toast.error('Failed to delete schedule');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await scheduleAdAPI.toggleScheduleStatus(id, token);
      toast.success('Schedule status updated');
      await fetchAll();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleScheduleViaLocations = () => {
    navigate("/dashboard/manage-ad-schedules-by-locations");
  };
  const handleScheduleViaExcel = () => {
    navigate("/dashboard/manage-ad-schedules-by-excel");
  };

  // Helper function to render TV list with "show more" functionality
  const renderTVList = (tvs, maxVisible = 2) => {
    const visibleTvs = tvs.slice(0, maxVisible);
    const remainingCount = tvs.length - maxVisible;

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        {visibleTvs.map((tvObj) => (
          <span key={tvObj._id} style={{
            padding: '4px 8px',
            fontSize: 10,
            borderRadius: 999,
            background: themeColors.background,
            color: themeColors.text,
            border: `1px solid ${themeColors.border}`
          }}>
            {tvObj.tv?.tvId} {/* Use tvObj.tv.tvId instead of tvObj.tvId */}
          </span>
        ))}
        {remainingCount > 0 && (
          <span style={{
            padding: '4px 8px',
            fontSize: 10,
            borderRadius: 999,
            background: themeColors.primary + '20',
            color: themeColors.primary,
            border: `1px solid ${themeColors.primary}40`,
            fontWeight: 600
          }}>
            +{remainingCount} more
          </span>
        )}
      </div>
    );
  };
  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
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
        <h1 style={{ fontSize: 32, fontWeight: 800, color: themeColors.primary, textShadow: `0 2px 8px ${themeColors.primary}22`, letterSpacing: 1 }}>Manage Ad Schedules</h1>
        <button
          onClick={() => handleScheduleViaLocations()}
          style={{ background: themeColors.primary, color: themeColors.surface, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, border: 'none', boxShadow: `0 2px 8px ${themeColors.primary}20`, cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = themeColors.active.background}
          onMouseLeave={(e) => e.currentTarget.style.background = themeColors.primary}
        >
          <Plus style={{ height: 20, width: 20, marginRight: 8 }} />
          Schedule Ad Via Locations
        </button>
        <button
          onClick={() => handleScheduleViaExcel()}
          style={{ background: themeColors.primary, color: themeColors.surface, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, border: 'none', boxShadow: `0 2px 8px ${themeColors.primary}20`, cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = themeColors.active.background}
          onMouseLeave={(e) => e.currentTarget.style.background = themeColors.primary}
        >
          <Plus style={{ height: 20, width: 20, marginRight: 8 }} />
          Schedule Ad Via Excel
        </button>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{ background: themeColors.primary, color: themeColors.surface, padding: '8px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', fontWeight: 500, fontSize: 16, border: 'none', boxShadow: `0 2px 8px ${themeColors.primary}20`, cursor: 'pointer', transition: 'background 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.background = themeColors.active.background}
          onMouseLeave={(e) => e.currentTarget.style.background = themeColors.primary}
        >
          <Plus style={{ height: 20, width: 20, marginRight: 8 }} />
          Schedule Via TV
        </button>
      </div>

      <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: themeColors.text, height: 18, width: 18 }} />
          <input
            type="text"
            placeholder="Search by ad title or TV ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: 40, paddingRight: 12, paddingTop: 8, paddingBottom: 8, width: '100%', border: `1px solid ${themeColors.border}`, borderRadius: 8, background: themeColors.background, color: themeColors.text, outline: 'none' }}
          />
        </div>
        <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: 8, overflow: 'hidden', background: themeColors.background }}>
          <button onClick={() => setShowFilters(!showFilters)} style={{ width: '100%', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', color: themeColors.text }}>
            <div style={{ display: 'flex', alignItems: 'center' }}><Filter style={{ height: 16, width: 16, marginRight: 8, color: themeColors.text }} />Filters</div>
            {showFilters ? <ChevronUp style={{ height: 16, width: 16, color: themeColors.text }} /> : <ChevronDown style={{ height: 16, width: 16, color: themeColors.text }} />}
          </button>
          {showFilters && (
            <div style={{ padding: 16, borderTop: `1px solid ${themeColors.border}`, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Ad</label>
                <select value={filters.ad} onChange={(e) => setFilters({ ...filters, ad: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All Ads</option>
                  {ads.map((ad) => (
                    <option key={ad._id} value={ad._id}>#{ad.adId}, {ad.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>TV</label>
                <select value={filters.tv} onChange={(e) => setFilters({ ...filters, tv: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: 8, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}>
                  <option value="">All TVs</option>
                  {tvs.map((tv) => (
                    <option key={tv._id} value={tv._id}>#{tv.tvId} {tv.tvName}</option>
                  ))}
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
              <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button onClick={resetFilters} style={{ padding: '8px 12px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>Reset Filters</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ minWidth: '100%', background: themeColors.surface, border: `1px solid ${themeColors.border}`, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: themeColors.background }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Ad Id</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Ad Title</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>TVs</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Valid From</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Valid To</th>
              {/* <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Repeat/Day</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Priority</th> */}
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Status</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: themeColors.text }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchedules.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ padding: 24, textAlign: 'center', color: themeColors.text, borderTop: `1px solid ${themeColors.border}` }}>No schedules found</td>
              </tr>
            ) : (
              filteredSchedules.map((sch) => (
                <tr key={sch._id} style={{ borderTop: `1px solid ${themeColors.border}` }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: themeColors.text }}>{sch.ad?.adId || '—'}</div>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600, color: themeColors.text }}>{sch.ad?.title || '—'}</div>
                  </td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>
                    {renderTVList(sch.tvs)}
                  </td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>{sch.validFrom ? new Date(sch.validFrom).toLocaleDateString() : '—'}</td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>{sch.validTo ? new Date(sch.validTo).toLocaleDateString() : '—'}</td>
                  {/* <td style={{ padding: '12px 16px', color: themeColors.text }}>{sch.repeatInADay}</td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>{sch.priority}</td> */}
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, background: sch.isActive ? themeColors.success : themeColors.danger, color: sch.isActive ? themeColors.text : themeColors.danger }}>{sch.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 12 }}>
                      <button onClick={() => openViewModal(sch)} style={{ color: themeColors.primary }} title="View Details">
                        <Info style={{ height: 16, width: 16, color: themeColors.primary }} />
                      </button>
                      <button onClick={() => handleToggleStatus(sch._id)} style={{ color: themeColors.text }} title={sch.isActive ? 'Deactivate' : 'Activate'}>
                        {sch.isActive ? <EyeOff style={{ height: 16, width: 16, color: themeColors.text }} /> : <Eye style={{ height: 16, width: 16, color: themeColors.text }} />}
                      </button>
                      <button onClick={() => openEditModal(sch)} style={{ color: themeColors.primary }} title="Edit">
                        <Pencil style={{ height: 16, width: 16, color: themeColors.primary }} />
                      </button>
                      <button onClick={() => handleDelete(sch._id)} style={{ color: themeColors.danger }} title="Delete">
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

      {/* View Details Modal */}
      {showViewModal && selectedSchedule && (
        <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 900, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: 24 }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 24, fontWeight: 700, color: themeColors.primary }}>Schedule Details</h2>
                <button onClick={closeModals} style={{ padding: 8, background: 'transparent', border: 'none', cursor: 'pointer' }}>
                  <X style={{ height: 20, width: 20, color: themeColors.text }} />
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                {/* Ad Information - Video */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: themeColors.primary, marginBottom: 16 }}>Ad Information</h3>
                  <div style={{ background: themeColors.background, borderRadius: 12, padding: 16, border: `1px solid ${themeColors.border}` }}>
                    {/* Video Full Width */}
                    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
                      {selectedSchedule.ad?.videoUrl ? (
                        <video
                          src={selectedSchedule.ad.videoUrl}
                          controls
                          style={{ width: '100%', height: 'auto', maxHeight: 300 }}
                          poster={selectedSchedule.ad.thumbnailUrl}
                        />
                      ) : (
                        <div style={{ width: '100%', height: 300, background: themeColors.border, display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColors.text }}>
                          <Play style={{ height: 32, width: 32 }} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ad Information - Details */}
                <div style={{ gridColumn: '1 / -1', marginTop: 16 }}>
                  <div style={{ background: themeColors.background, borderRadius: 12, padding: 16, border: `1px solid ${themeColors.border}` }}>
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>Ad ID</label>
                        <div style={{ fontSize: 14, color: themeColors.text, fontWeight: 600 }}>{selectedSchedule.ad?.adId || 'N/A'}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>Title</label>
                        <div style={{ fontSize: 14, color: themeColors.text }}>{selectedSchedule.ad?.title || 'N/A'}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>Description</label>
                        <div style={{ fontSize: 14, color: themeColors.text }}>{selectedSchedule.ad?.description || 'N/A'}</div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>Duration</label>
                          <div style={{ fontSize: 14, color: themeColors.text }}>{formatDuration(selectedSchedule.ad?.duration)}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>File Size</label>
                          <div style={{ fontSize: 14, color: themeColors.text }}>{formatFileSize(selectedSchedule.ad?.videoSize)}</div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>Format</label>
                          <div style={{ fontSize: 14, color: themeColors.text }}>{selectedSchedule.ad?.videoFormat?.toUpperCase() || 'N/A'}</div>
                        </div>
                        <div>
                          <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>Advertiser</label>
                          <div style={{ fontSize: 14, color: themeColors.text }}>{selectedSchedule.ad?.advertiser?.name || 'N/A'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Schedule Info */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: themeColors.primary, marginBottom: 16 }}>Schedule Information</h3>
                  <div style={{ background: themeColors.background, borderRadius: 12, padding: 16, border: `1px solid ${themeColors.border}`, display: 'grid', gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>Valid From</label>
                      <div style={{ fontSize: 14, color: themeColors.text }}>{selectedSchedule.validFrom ? new Date(selectedSchedule.validFrom).toLocaleString() : 'N/A'}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>Valid To</label>
                      <div style={{ fontSize: 14, color: themeColors.text }}>{selectedSchedule.validTo ? new Date(selectedSchedule.validTo).toLocaleString() : 'N/A'}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>Repeat/Day</label>
                        <div style={{ fontSize: 14, color: themeColors.text }}>{selectedSchedule.repeatInADay}</div>
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>Priority</label>
                        <div style={{ fontSize: 14, color: themeColors.text }}>{selectedSchedule.priority}</div>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>Status</label>
                      <div>
                        <span style={{
                          padding: '6px 12px',
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: selectedSchedule.isActive ? themeColors.success + '20' : themeColors.danger + '20',
                          color: selectedSchedule.isActive ? themeColors.success : themeColors.danger,
                          border: `1px solid ${selectedSchedule.isActive ? themeColors.success : themeColors.danger}40`
                        }}>
                          {selectedSchedule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary }}>Created At</label>
                      <div style={{ fontSize: 14, color: themeColors.text }}>{selectedSchedule.createdAt ? new Date(selectedSchedule.createdAt).toLocaleString() : 'N/A'}</div>
                    </div>
                  </div>
                </div>

                {/* TVs */}
                <div style={{ gridColumn: '1 / -1' }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: themeColors.primary, marginBottom: 16 }}>
                    Assigned TVs ({selectedSchedule.tvs?.length || 0})
                  </h3>
                  <div style={{ background: themeColors.background, borderRadius: 12, padding: 16, border: `1px solid ${themeColors.border}`, maxHeight: 400, overflowY: 'auto' }}>
                    {selectedSchedule.tvs?.length > 0 ? (
                      <div style={{ display: 'grid', gap: 12 }}>
                        {selectedSchedule.tvs.map((tvObj) => {
                          const tv = tvObj.tv;
                          return (
                            <div key={tvObj._id} style={{
                              padding: 12,
                              borderRadius: 8,
                              border: `1px solid ${themeColors.border}`,
                              background: themeColors.surface,
                              display: 'grid',
                              gridTemplateColumns: 'auto 1fr auto',
                              alignItems: 'center',
                              gap: 12
                            }}>
                              <div style={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                background: tv.status === 'online' ? '#10b981' : tv.status === 'offline' ? '#ef4444' : '#f59e0b'
                              }} />
                              <div>
                                <div style={{ fontSize: 14, fontWeight: 600, color: themeColors.text }}>
                                  #{tv.tvId} • {tv.tvName || ''}
                                </div>
                                <div style={{ fontSize: 12, color: themeColors.textSecondary }}>
                                  {tv.store?.name} • {tv.zone?.name} • {tv.city?.name}
                                </div>
                                {tvObj.playTimes?.length > 0 && (
                                  <div style={{ fontSize: 11, color: themeColors.textSecondary, marginTop: 2 }}>
                                    Plays at: {tvObj.playTimes.join(', ')}
                                  </div>
                                )}
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: 11, color: themeColors.textSecondary }}>
                                  {tv.screenSize} • {tv.resolution}
                                </div>
                                <div style={{ fontSize: 10, color: themeColors.textSecondary, marginTop: 2 }}>
                                  {tv.manufacturer} {tv.model}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', color: themeColors.textSecondary, padding: 20 }}>
                        No TVs assigned
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 24 }}>
                <button
                  onClick={() => {
                    closeModals();
                    openEditModal(selectedSchedule);
                  }}
                  style={{
                    padding: '8px 16px',
                    background: themeColors.primary,
                    color: themeColors.surface,
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <Pencil style={{ height: 16, width: 16 }} />
                  Edit Schedule
                </button>
                <button
                  onClick={closeModals}
                  style={{
                    padding: '8px 16px',
                    color: themeColors.text,
                    background: themeColors.surface,
                    borderRadius: 8,
                    border: `1px solid ${themeColors.border}`,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div style={{ position: 'fixed', inset: 0, background: themeColors.overlay || '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: themeColors.surface, borderRadius: 16, boxShadow: `0 4px 24px ${themeColors.primary}20`, width: '100%', maxWidth: 800, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ padding: 24 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: themeColors.primary }}>{showCreateModal ? 'Create Schedule' : 'Edit Schedule'}</h2>
              <form onSubmit={showCreateModal ? handleCreate : handleUpdate} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>

                {/* Ad Section - Create और Edit के लिए अलग-अलग */}
                {showCreateModal ? (
                  // Create Modal - Ad Selection
                  <div style={{ gridColumn: '1 / -1' }} >
                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Ad *</label>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                      <input
                        type="text"
                        placeholder="Search ads by title or code..."
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}
                        value={formData.adSearch || ''}
                        onChange={e => setFormData({ ...formData, adSearch: e.target.value })}
                      />
                      <select
                        style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}
                        value={formData.advertiserFilter || ''}
                        onChange={e => setFormData({ ...formData, advertiserFilter: e.target.value })}
                      >
                        <option value="">All Advertisers</option>
                        {advertisers.map(adv => (
                          <option key={adv._id} value={adv.name}>{adv.name}</option>
                        ))}
                      </select>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <input
                          type="date"
                          style={{ width: '50%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}
                          value={formData.createdFrom || ''}
                          onChange={e => setFormData({ ...formData, createdFrom: e.target.value })}
                        />
                        <input
                          type="date"
                          style={{ width: '50%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }}
                          value={formData.createdTo || ''}
                          onChange={e => setFormData({ ...formData, createdTo: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={{ width: '100%', border: `1px solid ${errors.ad ? themeColors.danger : themeColors.border}`, borderRadius: 8, padding: '8px 12px', maxHeight: 192, overflowY: 'auto', background: themeColors.background }}>
                      {ads.length === 0 ? (
                        <div style={{ color: themeColors.text, fontSize: 12 }}>No Ads available</div>
                      ) : (
                        ads.filter(ad => {
                          const q = (formData.adSearch || '').toLowerCase();
                          let match = ad.title?.toLowerCase().includes(q) || ad.adId?.toLowerCase().includes(q);
                          if (formData.advertiserFilter) match = match && ad.advertiser?.name === formData.advertiserFilter;
                          if (formData.createdFrom) match = match && ad.createdAt && new Date(ad.createdAt) >= new Date(formData.createdFrom);
                          if (formData.createdTo) match = match && ad.createdAt && new Date(ad.createdAt) <= new Date(formData.createdTo);
                          return match;
                        }).map(ad => (
                          <label key={ad._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', cursor: 'pointer' }}>
                            <input
                              type="radio"
                              name="adSelection"
                              value={ad._id}
                              checked={formData.ad === ad._id}
                              onChange={e => {
                                setFormData({ ...formData, ad: e.target.value });
                              }}
                              style={{ accentColor: themeColors.primary }}
                            />
                            <span style={{ fontSize: 12, color: themeColors.text }}>#{ad.adId} - </span>
                            <span style={{ fontSize: 12, color: themeColors.text }}>{ad.title}</span>
                            <span style={{ fontSize: 12, color: themeColors.text }}>{ad?.advertiser?.name}</span>
                          </label>
                        ))
                      )}
                    </div>

                    {formData.ad && (
                      <div style={{ fontSize: 12, color: themeColors.primary, marginTop: 4, padding: '4px', border: `1px solid ${themeColors.primary}20`, borderRadius: 4 }}>
                        Selected Ad: {
                          (() => {
                            const ad = ads.find(a => a._id === formData.ad);
                            return ad ? `${ad.title} (${ad.adId})` : formData.ad;
                          })()
                        }
                      </div>
                    )}
                    {errors.ad && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.ad}</p>}
                  </div>
                ) : (
                  // Edit Modal - Readonly Ad Display
                  <div>
                    <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Ad *</label>

                    {/* सिर्फ selected ad को display करें - कोई selection नहीं */}
                    {formData.ad && (
                      <div style={{
                        padding: '12px',
                        borderRadius: 8,
                        border: `1px solid ${themeColors.border}`,
                        background: themeColors.background,
                        marginBottom: 12
                      }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: themeColors.primary }}>
                          Selected Ad:
                        </div>
                        <div style={{ fontSize: 13, color: themeColors.text, marginTop: 4 }}>
                          {(() => {
                            const ad = ads.find(a => a._id === formData.ad);
                            return ad ? `#${ad.adId} - ${ad.title} (${ad?.advertiser?.name || 'No advertiser'})` : formData.ad;
                          })()}
                        </div>
                        <div style={{ fontSize: 12, color: themeColors.textSecondary, marginTop: 4 }}>
                          Note: Ad cannot be changed once scheduled
                        </div>
                      </div>
                    )}
                    {errors.ad && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.ad}</p>}
                  </div>
                )}

                {/* TVs Section with Playtimes */}

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>TVs *</label>
                  <input
                    type="text"
                    placeholder="Search TV by code, store, zone, city..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background, marginBottom: 8 }}
                    value={formData.tvSearch || ''}
                    onChange={e => setFormData({ ...formData, tvSearch: e.target.value })}
                  />

                  <div style={{ width: '100%', border: `1px solid ${errors.tvs ? themeColors.danger : themeColors.border}`, borderRadius: 8, padding: '8px 12px', maxHeight: 300, overflowY: 'auto', background: themeColors.background }}>
                    {tvs.length === 0 ? (
                      <div style={{ color: themeColors.text, fontSize: 12 }}>No TVs available</div>
                    ) : (

                      tvs.filter(tv => {
                        const q = (formData.tvSearch || '').toLowerCase();
                        return tv.tvId?.toLowerCase().includes(q) ||
                          tv.store?.name?.toLowerCase().includes(q) ||
                          tv.zone?.name?.toLowerCase().includes(q) ||
                          tv.city?.name?.toLowerCase().includes(q);
                      }).map(tv => {
                        const isSelected = formData.tvs.some(selectedTv => selectedTv._id === tv._id);
                        const selectedTvData = formData.tvs.find(selectedTv => selectedTv._id === tv._id);

                        return (
                          <div key={tv._id} style={{ borderBottom: `1px solid ${themeColors.border}`, padding: '8px 0' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={e => handleTVSelection(tv._id, e.target.checked)}
                                style={{ accentColor: themeColors.primary }}
                                // disabled={showEditModal} // Disable TV selection in edit mode if needed
                              />
                              <span style={{ fontSize: 14, color: themeColors.text, fontWeight: 600 }}>
                                #{tv.tvId} - {tv.store?.name || ''}, {tv.zone?.name || ''}, {tv.city?.name || ''}
                              </span>
                            </label>

                            {isSelected && (
                              <div style={{ marginTop: 8, marginLeft: 24 }}>
                                <div style={{ fontSize: 12, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Select Play Times:</div>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, maxHeight: 120, overflowY: 'auto' }}>
                                  {playTimeOptions.map(time => (
                                    <label key={time} style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
                                      <input
                                        type="checkbox"
                                        checked={selectedTvData.playTimes.includes(time)}
                                        onChange={e => handlePlayTimeChange(tv._id, time, e.target.checked)}
                                        style={{ accentColor: themeColors.primary }}
                                      />
                                      <span style={{ fontSize: 11, color: themeColors.text }}>{time}</span>
                                    </label>
                                  ))}
                                </div>
                                {errors[`tv-${tv._id}`] && (
                                  <div style={{ fontSize: 12, color: themeColors.danger, marginTop: 4 }}>
                                    {errors[`tv-${tv._id}`]}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })

                    )}
                  </div>

                  {errors.tvs && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.tvs}</p>}
                </div>

                {/* Rest of the form fields */}
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Valid From *</label>
                  <input type="datetime-local" value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.validFrom ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                  {errors.validFrom && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.validFrom}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Valid To *</label>
                  <input type="datetime-local" value={formData.validTo} onChange={(e) => setFormData({ ...formData, validTo: e.target.value })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${errors.validTo ? themeColors.danger : themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                  {errors.validTo && <p style={{ marginTop: 6, color: themeColors.danger }}>{errors.validTo}</p>}
                </div>
                {/* <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Repeat In A Day</label>
                  <input type="number" min={1} value={formData.repeatInADay} onChange={(e) => setFormData({ ...formData, repeatInADay: Number(e.target.value) })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 16, fontWeight: 600, color: themeColors.primary, marginBottom: 6 }}>Priority</label>
                  <input type="number" min={1} value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })} style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: `1px solid ${themeColors.border}`, outline: 'none', fontSize: 15, color: themeColors.text, background: themeColors.background }} />
                </div> */}
                <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })} style={{ height: 18, width: 18, accentColor: themeColors.primary, borderRadius: 4, marginRight: 8 }} />
                  <label htmlFor="isActive" style={{ color: themeColors.text }}>Active</label>
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button type="button" onClick={closeModals} style={{ padding: '8px 16px', color: themeColors.text, background: themeColors.surface, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>Cancel</button>
                  <button type="submit" style={{ padding: '8px 16px', color: themeColors.surface, background: themeColors.primary, borderRadius: 8, border: 'none' }}>{showCreateModal ? 'Create' : 'Update'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageAdSchedule;