// components/AdLogsAnalysis.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Calendar,
  Video,
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BarChart3,
  MapPin,
  Users,
  TrendingUp,
  Tv
} from 'lucide-react';
import adLogAPI from '../apis/adLogAPI';
import { useTheme } from '../context/ThemeContext';

const AdLogsAnalysis = () => {
  const { adId } = useParams();
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
    tvId: '',
    completionStatus: 'all'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchAdLogs = async () => {
    try {
      setLoading(true);
      const params = { ...filters, page, limit: pageSize };
      const res = await adLogAPI.getAdLogsAnalysis(adId, token, params);
      setData(res.data.data);
    } catch (error) {
      toast.error('Failed to fetch ad logs analysis');
      console.error('Error fetching ad logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adId) {
      fetchAdLogs();
    }
  }, [adId, filters, page, pageSize]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      period: 'daily',
      startDate: '',
      endDate: '',
      specificDate: '',
      tvId: '',
      completionStatus: 'all'
    });
    setPage(1);
  };

  // Helper functions
  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatPercentage = (value) => {
    return `${value.toFixed(1)}%`;
  };

  const getCompletionStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle size={16} color={themeColors.success} />;
      case 'uncompleted': return <XCircle size={16} color={themeColors.danger} />;
      case 'interrupted': return <AlertTriangle size={16} color={themeColors.warning} />;
      default: return <Play size={16} color={themeColors.text} />;
    }
  };

  const getTVName = (tvData) => {
    // Extract TV name from location or use TV ID as fallback
    if (tvData?.location?.address) {
      return `TV - ${tvData.location.address}`;
    }
    return `TV ${tvData?._id?.substring(0, 8) || 'Unknown'}`;
  };

  const getLocationText = (tvData) => {
    if (tvData?.location?.address) {
      return `${tvData.location.address}${tvData.location.floor ? `, ${tvData.location.floor}` : ''}`;
    }
    return 'Location not available';
  };

    const handlePageSizeChange = (newSize) => {
    setPageSize(Number(newSize));
    // Page reset useEffect handle karega
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


  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <RefreshCw className="animate-spin" style={{ height: 32, width: 32, color: themeColors.primary }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ textAlign: 'center', padding: 40, color: themeColors.text }}>
        <Video size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <div>No data available for this ad</div>
      </div>
    );
  }

  const { adDetails, period, logs, analytics, pagination } = data;

  return (
    <div style={{ padding: 24, background: themeColors.surface, borderRadius: 16 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <Video size={32} color={themeColors.primary} />
          <h1 style={{ fontSize: 28, fontWeight: 700, color: themeColors.primary }}>
            {adDetails?.title || 'Ad'} Analytics
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: themeColors.text }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BarChart3 size={16} />
            <span>Duration: {formatDuration(adDetails?.duration || 0)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} />
            <span>Period: {period.type} ({new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()})</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Users size={16} />
            <span>Total Plays: {analytics?.summary?.totalPlays || 0}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Tv size={16} />
            <span>Unique TVs: {analytics?.summary?.uniqueTVs || 0}</span>
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
            <div style={{ padding: 16, borderTop: `1px solid ${themeColors.border}`, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {/* Period Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: themeColors.text }}>Time Period</label>
                <select 
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}
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
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: themeColors.text }}>Completion Status</label>
                <select 
                  value={filters.completionStatus}
                  onChange={(e) => handleFilterChange('completionStatus', e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}
                >
                  <option value="all">All Plays</option>
                  <option value="completed">Completed</option>
                  <option value="uncompleted">Uncompleted</option>
                  <option value="interrupted">Interrupted</option>
                  <option value="not_played">Not Played</option>
                </select>
              </div>
                            {/* Page Size Selector */}
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: themeColors.text }}>
                  Items per page
                </label>
                <select 
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  style={{ 
                    width: '100%', 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    border: `1px solid ${themeColors.border}`, 
                    background: themeColors.background, 
                    color: themeColors.text 
                  }}
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {/* Custom Date Range */}
              {filters.period === 'custom' && (
                <>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: themeColors.text }}>Start Date</label>
                    <input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => handleFilterChange('startDate', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: themeColors.text }}>End Date</label>
                    <input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => handleFilterChange('endDate', e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: `1px solid ${themeColors.border}`, background: themeColors.background, color: themeColors.text }}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
                <button 
                  onClick={resetFilters}
                  style={{ padding: '8px 16px', border: `1px solid ${themeColors.border}`, borderRadius: 6, background: themeColors.background, color: themeColors.text }}
                >
                  Reset
                </button>
                <button 
                  onClick={fetchAdLogs}
                  style={{ padding: '8px 16px', border: `1px solid ${themeColors.primary}`, borderRadius: 6, background: themeColors.primary, color: themeColors.surface }}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Analytics Summary */}
      {analytics && (
        <div style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>Performance Overview</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
            <div style={{ background: themeColors.background, padding: 16, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Play size={20} color={themeColors.primary} />
                <span style={{ fontSize: 14, color: themeColors.text }}>Total Plays</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: themeColors.primary }}>
                {analytics.summary.totalPlays}
              </div>
            </div>

            <div style={{ background: themeColors.background, padding: 16, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Users size={20} color={themeColors.success} />
                <span style={{ fontSize: 14, color: themeColors.text }}>Unique TVs</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: themeColors.success }}>
                {analytics.summary.uniqueTVs}
              </div>
            </div>

            <div style={{ background: themeColors.background, padding: 16, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <CheckCircle size={20} color={themeColors.success} />
                <span style={{ fontSize: 14, color: themeColors.text }}>Completion Rate</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: themeColors.success }}>
                {formatPercentage(analytics.summary.completionRate)}
              </div>
            </div>

            <div style={{ background: themeColors.background, padding: 16, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Clock size={20} color={themeColors.warning} />
                <span style={{ fontSize: 14, color: themeColors.text }}>Total Duration</span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 700, color: themeColors.warning }}>
                {formatDuration(analytics.summary.totalPlayDuration.seconds)}
              </div>
            </div>
          </div>

          {/* Performance Metrics */}
          {analytics.performanceMetrics && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 24 }}>
              <div style={{ background: themeColors.background, padding: 16, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: themeColors.text }}>Performance Metrics</h3>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: themeColors.text }}>Engagement Rate:</span>
                    <span style={{ fontWeight: 600, color: themeColors.success }}>
                      {formatPercentage(analytics.performanceMetrics.engagementRate)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: themeColors.text }}>Avg Completion:</span>
                    <span style={{ fontWeight: 600, color: themeColors.primary }}>
                      {formatPercentage(analytics.performanceMetrics.avgCompletionPercentage)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: themeColors.text }}>Cost Per View:</span>
                    <span style={{ fontWeight: 600, color: themeColors.warning }}>
                      ${analytics.performanceMetrics.costPerView?.toFixed(4) || '0.0000'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TV Performance */}
          {analytics.tvPerformance && analytics.tvPerformance.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: themeColors.text }}>TV Performance</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                {analytics.tvPerformance.map((tv, index) => (
                  <div key={index} style={{ background: themeColors.background, padding: 16, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Tv size={16} />
                      <span style={{ fontWeight: 600, color: themeColors.text }}>TV {index + 1}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
                      <div style={{ color: themeColors.text }}>Plays: <strong>{tv.plays}</strong></div>
                      <div style={{ color: themeColors.text }}>Completion: <strong>{formatPercentage(tv.completionRate)}</strong></div>
                      <div style={{ color: themeColors.text }}>Avg. Duration: <strong>{formatDuration(tv.averageDuration)}</strong></div>
                      {console.log(tv.location)}
                      <div style={{ color: themeColors.text }}>Location: <strong>{tv.store?.name}</strong></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Time Analysis */}
          {analytics.timeAnalysis && (
            <div style={{ background: themeColors.background, padding: 16, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: themeColors.text }}>Time Distribution</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                {Object.entries(analytics.timeAnalysis).map(([key, periodData]) => (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, color: themeColors.text, marginBottom: 4 }}>{periodData.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: themeColors.primary }}>{periodData.plays}</div>
                    <div style={{ fontSize: 12, color: themeColors.text }}>{periodData.percentage}% of total</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logs Table */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>Play Logs</h2>
        
        <div style={{ overflowX: 'auto', background: themeColors.background, borderRadius: 8, border: `1px solid ${themeColors.border}` }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: themeColors.surface }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>TV Name</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>Play Time</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>Start Time</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>End Time</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>Duration</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>Completion</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>Location</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: themeColors.text, borderBottom: `1px solid ${themeColors.border}` }}>Remark</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} style={{ borderBottom: `1px solid ${themeColors.border}20` }}>
                  <td style={{ padding: '12px 16px', color: themeColors.text, fontWeight: 500 }}>
                    {getTVName(log.tvId)}
                  </td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>
                    {log.playTime}
                  </td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>
                    {formatDate(log.startTime)}
                  </td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>
                    {formatDate(log.endTime)}
                  </td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>
                    {formatDuration(log.playDuration?.seconds || 0)}
                  </td>
                  <td style={{ padding: '12px 16px', color: themeColors.text }}>
                    {formatPercentage(log.enhancedCompletion?.percentage || 0)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {getCompletionStatusIcon(log.enhancedCompletion?.status || 'uncompleted')}
                      <span style={{ 
                        color: log.enhancedCompletion?.status === 'completed' ? themeColors.success : 
                              log.enhancedCompletion?.status === 'uncompleted' ? themeColors.danger : themeColors.warning,
                        textTransform: 'capitalize',
                        fontSize: 12
                      }}>
                        {log.enhancedCompletion?.status || 'uncompleted'}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', color: themeColors.text, fontSize: 12 }}>
                    {getLocationText(log.tvId)}
                  </td>
                  <td style={{ padding: '12px 16px', color: themeColors.text, fontSize: 12, maxWidth: 200 }}>
                    <div title={log.remark}>
                      {log.remark?.length > 50 ? log.remark.substring(0, 50) + '...' : log.remark}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
          <div style={{ color: themeColors.text, fontSize: 14 }}>
            Showing {((pagination.currentPage - 1) * pagination.totalCount) + 1} to {Math.min(pagination.currentPage * pagination.totalCount, pagination.totalCount)} of {pagination.totalCount} entries
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={pagination.currentPage === 1}
              style={{
                padding: '8px 12px',
                border: `1px solid ${themeColors.border}`,
                borderRadius: 6,
                background: themeColors.background,
                color: themeColors.text,
                cursor: pagination.currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: pagination.currentPage === 1 ? 0.5 : 1
              }}
            >
              Previous
            </button>
            <span style={{ padding: '8px 12px', color: themeColors.text }}>
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.currentPage === pagination.totalPages}
              style={{
                padding: '8px 12px',
                border: `1px solid ${themeColors.border}`,
                borderRadius: 6,
                background: themeColors.background,
                color: themeColors.text,
                cursor: pagination.currentPage === pagination.totalPages ? 'not-allowed' : 'pointer',
                opacity: pagination.currentPage === pagination.totalPages ? 0.5 : 1
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdLogsAnalysis;