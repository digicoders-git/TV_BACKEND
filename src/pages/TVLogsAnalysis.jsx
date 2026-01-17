// components/TVLogsAnalysis.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Calendar,
  Tv,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  MapPin,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import adLogAPI from '../apis/adLogAPI';
import { useTheme } from '../context/ThemeContext';

const TVLogsAnalysis = () => {
  const { tvId } = useParams();
  const { themeColors } = useTheme();
  const auth = useSelector((state) => state.auth.user);
  const token = auth?.token;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: 'daily',
    startDate: '',
    endDate: '',
    specificDate: '',
    adId: '',
    completionStatus: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // useCallback se fetch function optimize karo
  const fetchTVLogs = useCallback(async (currentPage = page, currentFilters = filters) => {
    try {
      setLoading(true);
      const params = { 
        ...currentFilters, 
        page: currentPage, 
        limit: pageSize
      };
      
      console.log('Fetching TV logs with params:', params);
      
      const res = await adLogAPI.getTVLogsAnalysis(tvId, token, params);
      console.log('API Response:', res.data);
      
      if (res.data && res.data.success) {
        setData(res.data.data);
        // Current page ko update karo response se
        setPage(res.data.data.pagination?.currentPage || currentPage);
      } else {
        throw new Error(res.data?.message || 'Failed to fetch data');
      }
    } catch (error) {
      toast.error('Failed to fetch TV logs analysis');
      console.error('Error fetching TV logs:', error);
    } finally {
      setLoading(false);
    }
  }, [tvId, token, pageSize]);

  // Initial load aur tvId/token change par
  useEffect(() => {
    if (tvId && token) {
      fetchTVLogs(1, filters); // Always start from page 1 on initial load
    }
  }, [tvId, token]); // sirf tvId aur token par depend karo

  // Filters change par (with debounce)
  useEffect(() => {
    if (tvId && token) {
      const timeoutId = setTimeout(() => {
        setPage(1); // Reset to page 1 when filters change
        fetchTVLogs(1, filters); // Page 1 se fetch karo
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [filters, tvId, token]); // Filters change par

  // Page change par
  useEffect(() => {
    if (tvId && token && page > 1) { // Avoid double fetch on initial load
      fetchTVLogs(page, filters);
    }
  }, [page]); // Sirf page change par

  // PageSize change par
  useEffect(() => {
    if (tvId && token) {
      setPage(1); // Reset to page 1 when page size changes
      fetchTVLogs(1, filters);
    }
  }, [pageSize]); // Sirf pageSize change par

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (data?.pagination?.totalPages || 1)) {
      setPage(newPage);
      // Smooth scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageSizeChange = (newSize) => {
    setPageSize(Number(newSize));
    // Page reset useEffect handle karega
  };

  const resetFilters = () => {
    setFilters({
      period: 'daily',
      startDate: '',
      endDate: '',
      specificDate: '',
      adId: '',
      completionStatus: 'all'
    });
    // Page reset aur fetch dusre useEffect handle karenge
  };

  // Apply Filters button ke liye explicit function
  const handleApplyFilters = () => {
    setPage(1);
    fetchTVLogs(1, filters);
  };

  // Helper functions for formatting
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '0s';
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds.toFixed(0)}s`;
    }
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatPercentage = (value) => {
    if (!value) return '0%';
    return `${value.toFixed(1)}%`;
  };

  const formatHours = (hours) => {
    return `${parseFloat(hours).toFixed(2)}h`;
  };
    // Format date for display
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'UTC' // FIX timezone
        });
    };

  const getCompletionStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} color={themeColors.success} />;
      case 'uncompleted': return <XCircle size={16} color={themeColors.danger} />;
      case 'interrupted': return <AlertTriangle size={16} color={themeColors.warning} />;
      default: return <Play size={16} color={themeColors.text} />;
    }
  };

  const getLocationString = (tvDetails) => {
    if (!tvDetails) return 'N/A';
    
    const address = tvDetails.location?.address;
    const city = tvDetails.city?.name || 'Unknown City';
    const state = tvDetails.state?.name || 'Unknown State';
    
    if (address) return address;
    return `${city}, ${state}`;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 400,
        color: themeColors.text 
      }}>
        <RefreshCw className="animate-spin" style={{ height: 32, width: 32, marginRight: 12 }} />
        <span>Loading TV analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: themeColors.text }}>
        <Tv size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <div>No data available for this TV</div>
        <button 
          onClick={() => fetchTVLogs(1, filters)}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            border: `1px solid ${themeColors.primary}`,
            borderRadius: 6,
            background: themeColors.primary,
            color: themeColors.surface,
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { tvDetails, period, logs, analytics, pagination } = data;

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    if (!pagination || pagination.totalPages <= 1) return [];
    
    const pages = [];
    const currentPage = pagination.currentPage;
    const totalPages = pagination.totalPages;
    
    // Always show first page
    pages.push(1);
    
    // Calculate range around current page
    let startPage = Math.max(2, currentPage - 1);
    let endPage = Math.min(totalPages - 1, currentPage + 1);
    
    // Add ellipsis if needed
    if (startPage > 2) {
      pages.push('...');
    }
    
    // Add pages around current page
    for (let i = startPage; i <= endPage; i++) {
      if (i !== 1 && i !== totalPages) {
        pages.push(i);
      }
    }
    
    // Add ellipsis if needed
    if (endPage < totalPages - 1) {
      pages.push('...');
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div style={{ padding: 24, background: themeColors.surface, borderRadius: 16, maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Tv size={32} color={themeColors.primary} />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: themeColors.primary }}>
            {tvDetails?.tvName || 'TV'} Analytics
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: themeColors.text }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={16} />
            <span>{getLocationString(tvDetails)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={16} />
            <span>Screen: {tvDetails?.screenSize || 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} />
            <span>
              Period: {period.type} (
              {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
              )
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Play size={16} />
            <span>Total Plays: {analytics?.summary?.totalPlays || 0}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ border: `1px solid ${themeColors.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <button 
            onClick={() => setShowFilters(!showFilters)}
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: themeColors.background,
              border: 'none',
              cursor: 'pointer',
              color: themeColors.text
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Filter size={18} />
              <span>Filters & Options</span>
            </div>
            {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showFilters && (
            <div style={{ 
              padding: 16, 
              borderTop: `1px solid ${themeColors.border}`, 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16 
            }}>
              {/* Period Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: themeColors.text }}>
                  Time Period
                </label>
                <select 
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    border: `1px solid ${themeColors.border}`, 
                    background: themeColors.background, 
                    color: themeColors.text 
                  }}
                >
                  <option value="daily">Last 24 Hours</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="weekly">Last 7 Days</option>
                  <option value="monthly">This Month</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {/* Completion Status */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: themeColors.text }}>
                  Completion Status
                </label>
                <select 
                  value={filters.completionStatus}
                  onChange={(e) => handleFilterChange('completionStatus', e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    border: `1px solid ${themeColors.border}`, 
                    background: themeColors.background, 
                    color: themeColors.text 
                  }}
                >
                  <option value="all">All Plays</option>
                  <option value="completed">Completed</option>
                  <option value="uncompleted">Uncompleted</option>
                  <option value="interrupted">Interrupted</option>
                  <option value="not_played">Not Played</option>
                </select>
              </div>



              {/* Custom Date Range */}
              {filters.period === 'custom' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: themeColors.text }}>
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        borderRadius: 6, 
                        border: `1px solid ${themeColors.border}`, 
                        background: themeColors.background, 
                        color: themeColors.text 
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: themeColors.text }}>
                      End Date
                    </label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      style={{ 
                        width: '100%', 
                        padding: '8px 12px', 
                        borderRadius: 6, 
                        border: `1px solid ${themeColors.border}`, 
                        background: themeColors.background, 
                        color: themeColors.text 
                      }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <button 
                  onClick={resetFilters}
                  style={{ 
                    padding: '8px 16px', 
                    border: `1px solid ${themeColors.border}`, 
                    borderRadius: 6, 
                    background: themeColors.background, 
                    color: themeColors.text,
                    cursor: 'pointer'
                  }}
                >
                  Reset
                </button>
                <button 
                  onClick={handleApplyFilters}
                  style={{ 
                    padding: '8px 16px', 
                    border: `1px solid ${themeColors.primary}`, 
                    borderRadius: 6, 
                    background: themeColors.primary, 
                    color: themeColors.surface,
                    cursor: 'pointer'
                  }}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
            Performance Summary
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
            gap: 16, 
            marginBottom: 24 
          }}>
            {/* Total Plays */}
            <div style={{ 
              background: themeColors.background, 
              padding: 20, 
              borderRadius: 12, 
              border: `1px solid ${themeColors.border}`,
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                <Play size={24} color={themeColors.primary} />
                <span style={{ fontSize: 16, fontWeight: 600, color: themeColors.text }}>Total Plays</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: themeColors.primary }}>
                {analytics.summary?.totalPlays?.toLocaleString() || 0}
              </div>
            </div>

            {/* Total Duration */}
            <div style={{ 
              background: themeColors.background, 
              padding: 20, 
              borderRadius: 12, 
              border: `1px solid ${themeColors.border}`,
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                <Clock size={24} color={themeColors.success} />
                <span style={{ fontSize: 16, fontWeight: 600, color: themeColors.text }}>Total Duration</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: themeColors.success }}>
                {formatHours(analytics.summary?.totalPlayDuration?.hours || 0)}
              </div>
              <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7, marginTop: 4 }}>
                {formatDuration(analytics.summary?.totalPlayDuration?.seconds || 0)}
              </div>
            </div>

            {/* Completion Rate */}
            <div style={{ 
              background: themeColors.background, 
              padding: 20, 
              borderRadius: 12, 
              border: `1px solid ${themeColors.border}`,
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                <CheckCircle size={24} color={themeColors.success} />
                <span style={{ fontSize: 16, fontWeight: 600, color: themeColors.text }}>Completion Rate</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: themeColors.success }}>
                {formatPercentage(analytics.summary?.completionRate)}
              </div>
              <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7, marginTop: 4 }}>
                {analytics.summary?.completedPlays || 0} completed
              </div>
            </div>

            {/* Avg. Play Duration */}
            <div style={{ 
              background: themeColors.background, 
              padding: 20, 
              borderRadius: 12, 
              border: `1px solid ${themeColors.border}`,
              textAlign: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp size={24} color={themeColors.warning} />
                <span style={{ fontSize: 16, fontWeight: 600, color: themeColors.text }}>Avg. Duration</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, color: themeColors.warning }}>
                {formatDuration(analytics.summary?.averagePlayDuration || 0)}
              </div>
              <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7, marginTop: 4 }}>
                per play
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Table */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16 
        }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: themeColors.text }}>
            Play Logs ({pagination?.totalCount || 0} total)
          </h2>
          {pagination && (
            <div style={{ color: themeColors.text, fontSize: 14 }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>
          )}
        </div>
        
        <div style={{ 
          overflowX: 'auto', 
          background: themeColors.background, 
          borderRadius: 8, 
          border: `1px solid ${themeColors.border}` 
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 1000 }}>
            <thead>
              <tr style={{ background: themeColors.surface }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>
                  Ad Title
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>
                  Scheduled Time
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>
                  Start Time
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>
                  End Time
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>
                  Duration
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>
                  Completion
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>
                  Status
                </th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>
                  Remark
                </th>
              </tr>
            </thead>
            <tbody>
              {logs && logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log._id} style={{ borderBottom: `1px solid ${themeColors.border}20` }}>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>
                      <div style={{ fontWeight: 500 }}>{log.adTitle}</div>
                      <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7 }}>
                        ID: {log.adId?.adId || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>
                      {log.playTime || 'N/A'}
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>
                      {formatDate(log.startTime)}
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>
                      {formatDate(log.endTime)}
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>
                      {formatDuration(log.playDuration?.seconds)}
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text }}>
                      {formatPercentage(log.enhancedCompletion?.percentage)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {getCompletionStatusIcon(log.enhancedCompletion?.status)}
                        <span style={{ 
                          color: log.enhancedCompletion?.status === 'completed' ? themeColors.success : 
                                log.enhancedCompletion?.status === 'uncompleted' ? themeColors.danger : themeColors.warning,
                          textTransform: 'capitalize',
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          {log.enhancedCompletion?.status}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', color: themeColors.text, fontSize: 12, maxWidth: 200 }}>
                      <div title={log.remark} style={{ lineHeight: 1.4 }}>
                        {log.remark?.length > 50 ? log.remark.substring(0, 50) + '...' : log.remark}
                      </div>
                      {log.remarkAnalysis?.details && (
                        <div style={{ fontSize: 11, color: themeColors.text, opacity: 0.7, marginTop: 4 }}>
                          TV {log.remarkAnalysis.details.tvNumber}: {log.remarkAnalysis.details.totalPlays} plays
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ padding: '40px 16px', textAlign: 'center', color: themeColors.text }}>
                    No logs found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Enhanced Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          flexWrap: 'wrap', 
          gap: 16, 
          padding: '20px 0' 
        }}>
          <div style={{ color: themeColors.text, fontSize: 14 }}>
            Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
            {pagination.totalCount.toLocaleString()} entries
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Previous Button */}
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={pagination.currentPage === 1}
              style={{
                padding: '8px 12px',
                border: `1px solid ${themeColors.border}`,
                borderRadius: 6,
                background: themeColors.background,
                color: themeColors.text,
                cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: pagination.currentPage === 1 ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            {/* Page Numbers */}
            <div style={{ display: 'flex', gap: 4 }}>
              {pageNumbers.map((pageNum, index) => (
                pageNum === '...' ? (
                  <span key={`ellipsis-${index}`} style={{ 
                    padding: '8px 12px', 
                    color: themeColors.text,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    style={{
                      padding: '8px 12px',
                      border: `1px solid ${pagination.currentPage === pageNum ? themeColors.primary : themeColors.border}`,
                      borderRadius: 6,
                      background: pagination.currentPage === pageNum ? themeColors.primary : themeColors.background,
                      color: pagination.currentPage === pageNum ? themeColors.surface : themeColors.text,
                      cursor: 'pointer',
                      fontWeight: pagination.currentPage === pageNum ? 600 : 400,
                      minWidth: 40
                    }}
                  >
                    {pageNum}
                  </button>
                )
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
              style={{
                padding: '8px 12px',
                border: `1px solid ${themeColors.border}`,
                borderRadius: 6,
                background: themeColors.background,
                color: themeColors.text,
                cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
                opacity: pagination.currentPage === pagination.totalPages ? 0.5 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TVLogsAnalysis;