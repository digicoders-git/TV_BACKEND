// components/DashboardStats.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Tv, 
  Play, 
  CheckCircle, 
  Clock, 
  MapPin, 
  DollarSign,
  Filter,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar,
  Eye,
  Target,
  PieChart,
  Activity,
  Award,
  Star,
  Monitor,
  Zap,
  AlertCircle,
  TrendingDown,
  Globe,
  Building,
  Map,
  Store,

  UserCheck,
  Megaphone
} from 'lucide-react';
import statisticsAPI from '../apis/statisticsAPI';
import { useTheme } from '../context/ThemeContext';

const DashboardStats = () => {
  const { themeColors } = useTheme();
  const auth = useSelector((state) => state.auth.user);
  const token = auth?.token;

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState({
    period: 'today',
    view: 'overview'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch dashboard data
  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const dashboardRes = await statisticsAPI.getDashboardStats({}, token);
      setDashboardData(dashboardRes.data.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard data');
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const refreshDashboard = () => {
    fetchDashboardData(true);
  };

  // Helper functions
  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    return new Intl.NumberFormat().format(num);
  };

  const formatPercentage = (value, total) => {
    if (!total || total === 0) return '0%';
    const percentage = ((value / total) * 100).toFixed(1);
    return `${percentage}%`;
  };

  const getStatusColor = (status, value, total) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    
    switch (status?.toLowerCase()) {
      case 'online': 
      case 'active':
      case 'success':
        return themeColors.success;
      case 'offline': 
      case 'inactive':
      case 'draft':
        return percentage > 50 ? themeColors.warning : themeColors.danger;
      case 'maintenance': 
      case 'pending':
        return themeColors.warning;
      default: 
        return percentage > 70 ? themeColors.success : 
               percentage > 30 ? themeColors.warning : themeColors.danger;
    }
  };

  // Chart colors
  const chartColors = [
    themeColors.primary,
    themeColors.success,
    themeColors.warning,
    themeColors.danger,
    themeColors.info,
    '#8B5CF6',
    '#06B6D4'
  ];

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: 400,
        background: themeColors.surface,
        borderRadius: 16,
        margin: 16
      }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin" style={{ height: 48, width: 48, color: themeColors.primary, marginBottom: 16 }} />
          <div style={{ color: themeColors.text }}>Loading dashboard data...</div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: 40, 
        color: themeColors.text,
        background: themeColors.surface,
        borderRadius: 16,
        margin: 16
      }}>
        <AlertCircle size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
        <div style={{ fontSize: 18, marginBottom: 8 }}>No dashboard data available</div>
        <div style={{ fontSize: 14, opacity: 0.7 }}>Check your connection and try again</div>
        <button 
          onClick={() => fetchDashboardData()}
          style={{
            marginTop: 16,
            padding: '8px 16px',
            background: themeColors.primary,
            color: themeColors.surface,
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const { 
    summary, 
    tvStatus, 
    adStatus, 
    geographicalHierarchy, 
    tvDistribution, 
    adsPerTV, 
    advertisers,
    lastUpdated 
  } = dashboardData;

  // Calculate percentages for better insights
  const onlinePercentage = formatPercentage(tvStatus.online, summary.totalTVs);
  const draftPercentage = formatPercentage(adStatus.draft, summary.totalAds);
  const indiaTVPercentage = formatPercentage(
    tvDistribution.byCountry.find(c => c.countryName === 'India')?.count || 0, 
    summary.totalTVs
  );

  return (
    <div style={{ padding: 24, background: themeColors.surface, borderRadius: 16, margin: 16 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BarChart3 size={32} color={themeColors.primary} />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: themeColors.primary }}>
              Digital Signage Dashboard
            </h1>
          </div>
          <button
            onClick={refreshDashboard}
            disabled={refreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              background: themeColors.background,
              border: `1px solid ${themeColors.border}`,
              borderRadius: 8,
              color: themeColors.text,
              cursor: refreshing ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.6 : 1
            }}
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 14, color: themeColors.text }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Calendar size={16} />
            <span>Last updated: {new Date(lastUpdated).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Clock size={16} />
            <span>Today's Ads: {formatNumber(summary.todaysScheduledAds)} scheduled</span>
          </div>
        </div>
      </div>

      {/* Enhanced Filters */}
      {/* <div style={{ marginBottom: 24 }}>
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
              <span>Dashboard View Options</span>
            </div>
            {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {showFilters && (
            <div style={{ 
              padding: 16, 
              borderTop: `1px solid ${themeColors.border}`, 
              display: 'flex', 
              gap: 16,
              flexWrap: 'wrap'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: themeColors.text }}>
                  Time Period
                </label>
                <select 
                  value={filters.period}
                  onChange={(e) => handleFilterChange('period', e.target.value)}
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    border: `1px solid ${themeColors.border}`, 
                    background: themeColors.background, 
                    color: themeColors.text 
                  }}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 6, color: themeColors.text }}>
                  View Type
                </label>
                <select 
                  value={filters.view}
                  onChange={(e) => handleFilterChange('view', e.target.value)}
                  style={{ 
                    padding: '8px 12px', 
                    borderRadius: 6, 
                    border: `1px solid ${themeColors.border}`, 
                    background: themeColors.background, 
                    color: themeColors.text 
                  }}
                >
                  <option value="overview">Overview</option>
                  <option value="detailed">Detailed</option>
                  <option value="analytics">Analytics</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div> */}

      {/* Navigation Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 24,
        borderBottom: `1px solid ${themeColors.border}`,
        overflowX: 'auto'
      }}>
        {['overview', 'geography', 'performance', 'ads', 'tvs'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              color: activeTab === tab ? themeColors.primary : themeColors.text,
              borderBottom: activeTab === tab ? `2px solid ${themeColors.primary}` : '2px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              textTransform: 'capitalize',
              whiteSpace: 'nowrap',
              minWidth: 'fit-content'
            }}
          >
            {tab === 'tvs' ? 'TVs & TVs' : 
             tab === 'ads' ? 'Ads & Content' :
             tab === 'geography' ? 'Geography' : tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div>
          {/* Key Metrics Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: 20, 
            marginBottom: 32 
          }}>
            <MetricCard
              icon={<Globe size={24} />}
              title="Global Network"
              value={formatNumber(summary.totalCountries)}
              subtitle={`${formatNumber(summary.totalCities)} cities across ${formatNumber(summary.totalStates)} states`}
              color={themeColors.primary}
              trend="up"
            />
            <MetricCard
              icon={<Tv size={24} />}
              title="Digital TVs"
              value={formatNumber(summary.totalTVs)}
              subtitle={`${formatNumber(tvStatus.online)} online • ${onlinePercentage} availability`}
              color={tvStatus.online > 0 ? themeColors.success : themeColors.danger}
              trend={tvStatus.online > 0 ? "up" : "down"}
            />
            <MetricCard
              icon={<Megaphone size={24} />}
              title="Ad Campaigns"
              value={formatNumber(summary.totalAds)}
              subtitle={`${formatNumber(summary.todaysScheduledAds)} scheduled today`}
              color={themeColors.warning}
            />
            <MetricCard
              icon={<UserCheck size={24} />}
              title="Business Partners"
              value={formatNumber(summary.totalAdvertisers)}
              subtitle={`${formatNumber(advertisers?.length || 0)} active advertisers`}
              color={themeColors.info}
            />
          </div>

          {/* Status Overview */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 16, 
            marginBottom: 32 
          }}>
            <StatusCard
              icon={<Monitor size={20} />}
              title="TV Status"
              online={tvStatus.online}
              offline={tvStatus.offline}
              maintenance={tvStatus.maintenance}
              total={summary.totalTVs}
              color={themeColors.primary}
            />
            <StatusCard
              icon={<Megaphone size={20} />}
              title="Ad Status"
              draft={adStatus.draft}
              pending={adStatus.pending}
              approved={adStatus.approved}
              active={adStatus.active}
              total={summary.totalAds}
              color={themeColors.warning}
            />
          </div>

          {/* Quick Insights */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: 16, 
            marginBottom: 32 
          }}>
            <SmallMetricCard
              icon={<Store size={18} />}
              title="Retail Stores"
              value={formatNumber(summary.totalStores)}
              subtitle={`${formatNumber(summary.totalZones)} zones`}
              color={themeColors.success}
            />
            <SmallMetricCard
              icon={<MapPin size={18} />}
              title="Active Locations"
              value={formatNumber(geographicalHierarchy.countries.filter(c => c.tvCount > 0).length)}
              subtitle="Countries with TVs"
              color={themeColors.primary}
            />
            <SmallMetricCard
              icon={<TrendingUp size={18} />}
              title="Ad Distribution"
              value={formatNumber(adsPerTV?.[0]?.totalSchedules || 0)}
              subtitle="Schedules per TV"
              color={themeColors.info}
            />
            <SmallMetricCard
              icon={<Zap size={18} />}
              title="Network Health"
              value={onlinePercentage}
              subtitle="TVs online"
              color={tvStatus.online > 0 ? themeColors.success : themeColors.danger}
            />
          </div>
        </div>
      )}

      {/* Geography Tab */}
      {activeTab === 'geography' && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: themeColors.text }}>
            Geographic Distribution
          </h2>
          
          {/* Country Distribution */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
              <Globe size={20} style={{ display: 'inline', marginRight: 8 }} />
              Country Overview
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: 16 
            }}>
              {geographicalHierarchy.countries.map((country, index) => (
                <GeographyCard
                  key={country._id}
                  type="country"
                  name={country.name}
                  stats={{
                    states: country.stateCount,
                    cities: country.cityCount,
                    zones: country.zoneCount,
                    stores: country.storeCount,
                    tvs: country.tvCount
                  }}
                  color={chartColors[index % chartColors.length]}
                  isActive={country.tvCount > 0}
                />
              ))}
            </div>
          </div>

          {/* TV Distribution */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
              <Tv size={20} style={{ display: 'inline', marginRight: 8 }} />
              TV Distribution
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: 16 
            }}>
              <DistributionCard
                title="By Country"
                data={tvDistribution.byCountry}
                icon={<Globe size={16} />}
                color={themeColors.primary}
              />
              <DistributionCard
                title="By State"
                data={tvDistribution.byState}
                icon={<Map size={16} />}
                color={themeColors.success}
              />
              <DistributionCard
                title="By City"
                data={tvDistribution.byCity}
                icon={<Building size={16} />}
                color={themeColors.warning}
              />
              <DistributionCard
                title="By Store"
                data={tvDistribution.byStore}
                icon={<Store size={16} />}
                color={themeColors.info}
              />
            </div>
          </div>
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: themeColors.text }}>
            Performance Metrics
          </h2>

          {/* Ads per TV Performance */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
              <TrendingUp size={20} style={{ display: 'inline', marginRight: 8 }} />
              Ad Scheduling Performance
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
              gap: 16 
            }}>
              {adsPerTV.map((tv, index) => (
                <TVPerformanceCard
                  key={tv._id}
                  tv={tv}
                  rank={index + 1}
                  totalAds={summary.totalAds}
                  color={chartColors[index % chartColors.length]}
                />
              ))}
            </div>
          </div>

          {/* Overall Performance Metrics */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: 16 
          }}>
            <MetricCard
              icon={<Play size={20} />}
              title="Today's Schedule"
              value={formatNumber(summary.todaysScheduledAds)}
              subtitle="Ads scheduled for today"
              color={themeColors.primary}
            />
            <MetricCard
              icon={<CheckCircle size={20} />}
              title="Content Ready"
              value={formatNumber(adStatus.draft)}
              subtitle="Ads in draft status"
              color={themeColors.warning}
            />
            <MetricCard
              icon={<Activity size={20} />}
              title="Network Utilization"
              value={onlinePercentage}
              subtitle="TVs actively displaying"
              color={themeColors.success}
            />
          </div>
        </div>
      )}

      {/* Ads Tab */}
      {activeTab === 'ads' && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: themeColors.text }}>
            Ad Management
          </h2>

          {/* Ad Status Overview */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
              <Megaphone size={20} style={{ display: 'inline', marginRight: 8 }} />
              Ad Status Distribution
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16 
            }}>
              {Object.entries(adStatus).map(([status, count], index) => (
                <StatusItemCard
                  key={status}
                  status={status}
                  count={count}
                  total={summary.totalAds}
                  color={chartColors[index % chartColors.length]}
                />
              ))}
            </div>
          </div>

          {/* Advertisers List */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
              <Users size={20} style={{ display: 'inline', marginRight: 8 }} />
              Top Advertisers
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: 16 
            }}>
              {advertisers.map((advertiser, index) => (
                <AdvertiserCard
                  key={advertiser._id}
                  advertiser={advertiser}
                  rank={index + 1}
                  color={chartColors[index % chartColors.length]}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TVs Tab */}
      {activeTab === 'tvs' && (
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 24, color: themeColors.text }}>
            TV Management
          </h2>

          {/* TV Status Overview */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
              <Tv size={20} style={{ display: 'inline', marginRight: 8 }} />
              TV Status Overview
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: 16 
            }}>
              {Object.entries(tvStatus).map(([status, count], index) => (
                <StatusItemCard
                  key={status}
                  status={status}
                  count={count}
                  total={summary.totalTVs}
                  color={status === 'online' ? themeColors.success : 
                        status === 'offline' ? themeColors.danger : themeColors.warning}
                />
              ))}
            </div>
          </div>

          {/* Geographic TV Distribution */}
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16, color: themeColors.text }}>
              <MapPin size={20} style={{ display: 'inline', marginRight: 8 }} />
              TV Locations
            </h3>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
              gap: 16 
            }}>
              {tvDistribution.byStore.map((store, index) => (
                <StoreTVCard
                  key={store._id}
                  store={store}
                  color={chartColors[index % chartColors.length]}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon, title, value, subtitle, color, trend }) => {
  const { themeColors } = useTheme();
  
  return (
    <div style={{ 
      background: themeColors.background, 
      padding: 24, 
      borderRadius: 12, 
      border: `1px solid ${themeColors.border}`,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 4,
        background: color
      }} />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ 
          padding: 8, 
          background: `${color}20`, 
          borderRadius: 8,
          color: color 
        }}>
          {icon}
        </div>
        <span style={{ fontSize: 16, fontWeight: 600, color: themeColors.text }}>
          {title}
        </span>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 28, fontWeight: 700, color: color }}>
          {value}
        </span>
      </div>
      
      {subtitle && (
        <div style={{ fontSize: 14, color: themeColors.text, opacity: 0.7 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};

// Small Metric Card Component
const SmallMetricCard = ({ icon, title, value, subtitle, color }) => {
  const { themeColors } = useTheme();
  
  return (
    <div style={{ 
      background: themeColors.background, 
      padding: 16, 
      borderRadius: 8, 
      border: `1px solid ${themeColors.border}`,
      display: 'flex',
      alignItems: 'center',
      gap: 12
    }}>
      <div style={{ color: color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 20, fontWeight: 700, color: color }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 11, color: themeColors.text, opacity: 0.6 }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

// Status Card Component
const StatusCard = ({ icon, title, online, offline, maintenance, total, color }) => {
  const { themeColors } = useTheme();
  
  return (
    <div style={{ 
      background: themeColors.background, 
      padding: 20, 
      borderRadius: 12, 
      border: `1px solid ${themeColors.border}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        {icon}
        <span style={{ fontWeight: 600, color: themeColors.text }}>{title}</span>
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ color: themeColors.success }}>Online: {online}</span>
        <span style={{ color: themeColors.danger }}>Offline: {offline}</span>
      </div>
      
      {maintenance > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ color: themeColors.warning }}>Maintenance: {maintenance}</span>
          <span style={{ color: themeColors.text, opacity: 0.7 }}>Total: {total}</span>
        </div>
      )}
      
      <div style={{ 
        height: 8, 
        background: themeColors.border, 
        borderRadius: 4,
        overflow: 'hidden'
      }}>
        <div style={{ 
          height: '100%', 
          background: `linear-gradient(90deg, ${themeColors.success} ${(online/total)*100}%, ${themeColors.danger} ${(online/total)*100}% ${((online+offline)/total)*100}%, ${themeColors.warning} ${((online+offline)/total)*100}%)`,
          borderRadius: 4
        }} />
      </div>
    </div>
  );
};

// Geography Card Component
const GeographyCard = ({ type, name, stats, color, isActive }) => {
  const { themeColors } = useTheme();
  
  return (
    <div style={{ 
      background: themeColors.background, 
      padding: 20, 
      borderRadius: 12, 
      border: `2px solid ${isActive ? color : themeColors.border}`,
      opacity: isActive ? 1 : 0.6
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <h4 style={{ fontWeight: 600, color: themeColors.text, fontSize: 16, marginBottom: 4 }}>
            {name}
          </h4>
          <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7 }}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </div>
        </div>
        {isActive && (
          <div style={{ 
            padding: '4px 8px', 
            background: color, 
            color: themeColors.surface,
            borderRadius: 12,
            fontSize: 12,
            fontWeight: 600
          }}>
            Active
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: color, fontWeight: 600 }}>{stats.tvs}</div>
          <div style={{ fontSize: 11, color: themeColors.text, opacity: 0.7 }}>TVs</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: color, fontWeight: 600 }}>{stats.stores}</div>
          <div style={{ fontSize: 11, color: themeColors.text, opacity: 0.7 }}>Stores</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: color, fontWeight: 600 }}>{stats.cities}</div>
          <div style={{ fontSize: 11, color: themeColors.text, opacity: 0.7 }}>Cities</div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: color, fontWeight: 600 }}>{stats.states}</div>
          <div style={{ fontSize: 11, color: themeColors.text, opacity: 0.7 }}>States</div>
        </div>
      </div>
    </div>
  );
};

// Distribution Card Component
const DistributionCard = ({ title, data, icon, color }) => {
  const { themeColors } = useTheme();
  
  return (
    <div style={{ 
      background: themeColors.background, 
      padding: 16, 
      borderRadius: 8, 
      border: `1px solid ${themeColors.border}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {icon}
        <span style={{ fontWeight: 600, color: themeColors.text, fontSize: 14 }}>{title}</span>
      </div>
      
      {data.map((item, index) => (
        <div key={item._id} style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: '8px 0',
          borderBottom: index < data.length - 1 ? `1px solid ${themeColors.border}20` : 'none'
        }}>
          <span style={{ fontSize: 12, color: themeColors.text }}>
            {item.countryName || item.stateName || item.cityName || item.storeName}
          </span>
          <span style={{ fontWeight: 600, color: color, fontSize: 12 }}>{item.count}</span>
        </div>
      ))}
    </div>
  );
};

// TV Performance Card Component
const TVPerformanceCard = ({ tv, rank, totalAds, color }) => {
  const { themeColors } = useTheme();
  
  return (
    <div style={{ 
      background: themeColors.background, 
      padding: 20, 
      borderRadius: 12, 
      border: `1px solid ${themeColors.border}`,
      position: 'relative'
    }}>
      {rank <= 3 && (
        <div style={{
          position: 'absolute',
          top: -1,
          right: -1,
          background: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: '0 12px 0 8px',
          fontSize: 12,
          fontWeight: 600
        }}>
          #{rank}
        </div>
      )}
      
      <div style={{ marginBottom: 12 }}>
        <h4 style={{ fontWeight: 600, color: themeColors.text, fontSize: 16, marginBottom: 4 }}>
          {tv.tvName || `TV ${tv.tvId}`}
        </h4>
        <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7 }}>
          ID: {tv.tvId}
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: 12,
        marginBottom: 12
      }}>
        <div>
          <div style={{ color: color, fontWeight: 600, fontSize: 18 }}>
            {tv.totalSchedules || tv.adCount}
          </div>
          <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7 }}>
            Total Schedules
          </div>
        </div>
        <div>
          <div style={{ color: themeColors.info, fontWeight: 600, fontSize: 18 }}>
            {tv.uniqueAdsCount || 'N/A'}
          </div>
          <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7 }}>
            Unique Ads
          </div>
        </div>
      </div>
    </div>
  );
};

// Status Item Card Component
const StatusItemCard = ({ status, count, total, color }) => {
  const { themeColors } = useTheme();
  const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
  
  return (
    <div style={{ 
      background: themeColors.background, 
      padding: 16, 
      borderRadius: 8, 
      border: `1px solid ${themeColors.border}`,
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 20, fontWeight: 700, color: color, marginBottom: 4 }}>
        {count}
      </div>
      <div style={{ fontSize: 12, fontWeight: 600, color: themeColors.text, marginBottom: 2, textTransform: 'capitalize' }}>
        {status}
      </div>
      <div style={{ fontSize: 11, color: themeColors.text, opacity: 0.7 }}>
        {percentage}% of total
      </div>
    </div>
  );
};

// Advertiser Card Component
const AdvertiserCard = ({ advertiser, rank, color }) => {
  const { themeColors } = useTheme();
  
  return (
    <div style={{ 
      background: themeColors.background, 
      padding: 16, 
      borderRadius: 8, 
      border: `1px solid ${themeColors.border}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div>
          <h4 style={{ fontWeight: 600, color: themeColors.text, fontSize: 14, marginBottom: 2 }}>
            {advertiser.companyName}
          </h4>
          <div style={{ fontSize: 12, color: themeColors.text, opacity: 0.7 }}>
            {advertiser.name}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: color, fontWeight: 700, fontSize: 16 }}>
            {advertiser.adCount}
          </div>
          <div style={{ fontSize: 11, color: themeColors.text, opacity: 0.7 }}>
            Ads
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: themeColors.text, opacity: 0.6 }}>
        {advertiser.email}
      </div>
    </div>
  );
};

// Store TV Card Component
const StoreTVCard = ({ store, color }) => {
  const { themeColors } = useTheme();
  
  return (
    <div style={{ 
      background: themeColors.background, 
      padding: 16, 
      borderRadius: 8, 
      border: `1px solid ${themeColors.border}`
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <h4 style={{ fontWeight: 600, color: themeColors.text, fontSize: 14 }}>
          {store.storeName}
        </h4>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: color, fontWeight: 700, fontSize: 16 }}>
            {store.count}
          </div>
          <div style={{ fontSize: 11, color: themeColors.text, opacity: 0.7 }}>
            TVs
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardStats;