import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { FiChevronLeft, FiChevronRight, FiPlus, FiGrid, FiList, FiSun, FiMoon, FiLogOut, FiActivity, FiTruck, FiBell, FiClock, FiFileText } from 'react-icons/fi';
import ProfileHeader from '../components/ProfileHeader';

// Helper functions for file attachments
const getFileIcon = (filename) => {
  if (!filename || typeof filename !== 'string') return '📎';
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'pdf') return '📄';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return '🖼️';
  if (['doc', 'docx'].includes(ext)) return '📝';
  if (['xls', 'xlsx'].includes(ext)) return '📊';
  if (['dwg', 'dxf'].includes(ext)) return '📐';
  return '📎';
};

const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const RequestJobs = () => {
  const navigate = useNavigate();
  const { logout, isFactoryAdmin, userEmail } = useAuth();
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortOrder, setSortOrder] = useState('newest');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [newRequestCustomerName, setNewRequestCustomerName] = useState('');
  const [dateRangeStart, setDateRangeStart] = useState('');
  const [dateRangeEnd, setDateRangeEnd] = useState('');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });
  const [qcStatuses, setQCStatuses] = useState({}); // Maps request_code to QC status
  const [newJobNotification, setNewJobNotification] = useState(null); // { requestCode, label }
  const [workHours, setWorkHours] = useState({}); // Maps request_code to total hours
  const [statusError, setStatusError] = useState(''); // Surface Supabase sync issues
  const [dismissedNotifications, setDismissedNotifications] = useState(() => {
    // Load dismissed notifications for current user from localStorage
    if (!userEmail) return new Set();
    const stored = localStorage.getItem(`dismissed_notifications_${userEmail}`);
    return stored ? new Set(JSON.parse(stored)) : new Set();
  });
  const requestCodesRef = useRef(new Set());

  // View attachments modal state
  const [showAttachmentsModal, setShowAttachmentsModal] = useState(false);
  const [selectedRequestForView, setSelectedRequestForView] = useState(null);

  const mapSupabaseRowToRequest = (row, jobRequestLabel) => {
    const payload = row?.payload || {};
    return {
      ...payload,
      id: row?.request_code,
      request_code: row?.request_code,
      status: row?.status || payload.status || 'Requested to factory',
      createdAt: row?.created_at || payload.createdAt || new Date().toISOString(),
      createdBy: row?.created_by_email,
      job: payload.job || { requestType: jobRequestLabel },
      customer: payload.customer || { name: '', mobile: '', quoteRef: '' },
      jobRequest: jobRequestLabel,
    };
  };

  const getTableForJobRequest = (jobRequest) => {
    switch (jobRequest) {
      case 'The Ultimate G24':
        return 'g24_requests';
      case 'Diving Solution Installation':
        return 'diving_solution_requests';
      case 'Turney Seat Installation':
        return 'turney_seat_requests';
      default:
        return 'requests';
    }
  };

  const refetchRequest = async (requestCode, jobRequestLabel) => {
    if (!supabase) return null;
    const table = getTableForJobRequest(jobRequestLabel);
    const { data, error } = await supabase
      .from(table)
      .select('request_code, status, created_at, created_by_email, payload')
      .eq('request_code', requestCode)
      .maybeSingle();

    if (error) {
      console.warn('Refetch failed', { table, requestCode, error });
      return null;
    }
    return data ? mapSupabaseRowToRequest(data, jobRequestLabel) : null;
  };

  const loadQCStatuses = async (requestCodes) => {
    try {
      if (!supabase || !requestCodes.length) return;
      
      const { data } = await supabase
        .from('qc_inspections')
        .select('request_code, inspection_status')
        .in('request_code', requestCodes);
      
      if (data) {
        const statusMap = {};
        data.forEach(row => {
          statusMap[row.request_code] = row.inspection_status;
        });
        setQCStatuses(statusMap);
      }
    } catch (err) {
      console.error('Error loading QC statuses:', err);
    }
  };

  const loadWorkHours = async (requestCodes) => {
    try {
      if (!supabase || !requestCodes.length) return;
      
      const { data } = await supabase
        .from('work_hours_log')
        .select('request_id, hours_worked')
        .in('request_id', requestCodes)
        .not('request_id', 'is', null);
      
      if (data) {
        const hoursMap = {};
        data.forEach(row => {
          if (!hoursMap[row.request_id]) {
            hoursMap[row.request_id] = { total: 0, completed: 0 };
          }
          const hours = parseFloat(row.hours_worked) || 0;
          hoursMap[row.request_id].total += hours;
          hoursMap[row.request_id].completed += hours; // All logged hours are considered completed
        });
        setWorkHours(hoursMap);
      }
    } catch (err) {
      console.error('Error loading work hours:', err);
    }
  };

  useEffect(() => {
    const loadFromLocal = () => {
      const stored = localStorage.getItem('wheelchair_lifter_requests_v1');
      if (stored) {
        try {
          console.log('⚠️ Loading from localStorage (temporary fallback)');
          setRequests(JSON.parse(stored));
        } catch (e) {
          console.error('Failed to parse requests', e);
        }
      }
    };

    const loadFromSupabase = async () => {
      if (!supabase) {
        console.warn('Supabase not available, loading from localStorage');
        loadFromLocal();
        return;
      }

      console.log('📡 Loading requests from Supabase...');
      
      try {
        // Build query based on role
        let wheelchairQuery = supabase.from('requests').select('request_code, status, created_at, created_by_email, payload');
        let g24Query = supabase.from('g24_requests').select('request_code, status, created_at, created_by_email, payload');
        let divingQuery = supabase.from('diving_solution_requests').select('request_code, status, created_at, created_by_email, payload');
        let turneyQuery = supabase.from('turney_seat_requests').select('request_code, status, created_at, created_by_email, payload');

        // Filter by created_by_email for sales person
        if (!isFactoryAdmin() && userEmail) {
          wheelchairQuery = wheelchairQuery.eq('created_by_email', userEmail);
          g24Query = g24Query.eq('created_by_email', userEmail);
          divingQuery = divingQuery.eq('created_by_email', userEmail);
          turneyQuery = turneyQuery.eq('created_by_email', userEmail);
        }

        // Fetch from all four tables
        const [wheelchairRes, g24Res, divingRes, turneyRes] = await Promise.all([
          wheelchairQuery,
          g24Query,
          divingQuery,
          turneyQuery,
        ]);

        const allData = [];

        // Map wheelchair lifter requests
        if (wheelchairRes.data && wheelchairRes.data.length > 0) {
          const mapped = wheelchairRes.data.map(row => {
            const payload = row.payload || {};
            return {
              ...payload,
              id: row.request_code,
              request_code: row.request_code,
              status: row.status || payload.status || 'Requested to factory',
              createdAt: row.created_at || payload.createdAt,
              createdBy: row.created_by_email,
              job: payload.job || { requestType: 'Wheelchair Lifter Installation' },
              customer: payload.customer || { name: '', mobile: '', quoteRef: '' },
              jobRequest: 'Wheelchair Lifter Installation',
              pdf_url: row.pdf_url,
              pdf_generated_at: row.pdf_generated_at,
              customer_form_token: row.customer_form_token,
              customer_submitted: row.customer_submitted,
              customer_submitted_at: row.customer_submitted_at,
              customer_vehicle_photos: row.customer_vehicle_photos,
              customer_notes: row.customer_notes,
              requestAttachments: row.request_attachments || payload.requestAttachments || [],
            };
          });
          allData.push(...mapped);
        }

        // Map Ultimate G24 requests
        if (g24Res.data && g24Res.data.length > 0) {
          const mapped = g24Res.data.map(row => {
            const payload = row.payload || {};
            return {
              ...payload,
              id: row.request_code,
              request_code: row.request_code,
              status: row.status || payload.status || 'Requested to factory',
              createdAt: row.created_at || payload.createdAt,
              createdBy: row.created_by_email,
              job: payload.job || { requestType: 'The Ultimate G24' },
              customer: payload.customer || { name: '', mobile: '', quoteRef: '' },
              jobRequest: 'The Ultimate G24',
              pdf_url: row.pdf_url,
              pdf_generated_at: row.pdf_generated_at,
              customer_form_token: row.customer_form_token,
              customer_submitted: row.customer_submitted,
              customer_submitted_at: row.customer_submitted_at,
              customer_vehicle_photos: row.customer_vehicle_photos,
              customer_notes: row.customer_notes,
              requestAttachments: row.request_attachments || payload.requestAttachments || [],
            };
          });
          allData.push(...mapped);
        }

        // Map Diving Solution requests
        if (divingRes.data && divingRes.data.length > 0) {
          const mapped = divingRes.data.map(row => {
            const payload = row.payload || {};
            return {
              ...payload,
              id: row.request_code,
              request_code: row.request_code,
              status: row.status || payload.status || 'Requested to factory',
              createdAt: row.created_at || payload.createdAt,
              createdBy: row.created_by_email,
              job: payload.job || { requestType: 'Diving Solution Installation' },
              customer: payload.customer || { name: '', mobile: '', quoteRef: '' },
              jobRequest: 'Diving Solution Installation',
              pdf_url: row.pdf_url,
              pdf_generated_at: row.pdf_generated_at,
              customer_form_token: row.customer_form_token,
              customer_submitted: row.customer_submitted,
              customer_submitted_at: row.customer_submitted_at,
              customer_vehicle_photos: row.customer_vehicle_photos,
              customer_notes: row.customer_notes,
              requestAttachments: row.request_attachments || payload.requestAttachments || [],
            };
          });
          allData.push(...mapped);
        }

        // Map Turney Seat requests
        if (turneyRes.data && turneyRes.data.length > 0) {
          const mapped = turneyRes.data.map(row => {
            const payload = row.payload || {};
            return {
              ...payload,
              id: row.request_code,
              request_code: row.request_code,
              status: row.status || payload.status || 'Requested to factory',
              createdAt: row.created_at || payload.createdAt,
              createdBy: row.created_by_email,
              job: payload.job || { requestType: 'Turney Seat Installation' },
              customer: payload.customer || { name: '', mobile: '', quoteRef: '' },
              jobRequest: 'Turney Seat Installation',
              pdf_url: row.pdf_url,
              pdf_generated_at: row.pdf_generated_at,
              customer_form_token: row.customer_form_token,
              customer_submitted: row.customer_submitted,
              customer_submitted_at: row.customer_submitted_at,
              customer_vehicle_photos: row.customer_vehicle_photos,
              customer_notes: row.customer_notes,
              requestAttachments: row.request_attachments || payload.requestAttachments || [],
            };
          });
          allData.push(...mapped);
        }

        if (allData.length > 0) {
          // Sort by createdAt descending (newest first)
          allData.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
          console.log(`✅ Loaded ${allData.length} requests from Supabase`);
          console.log('Sample status:', allData.slice(0, 3).map(r => ({ code: r.request_code, status: r.status })));
          
          setRequests(allData);
          
          // Update localStorage as a backup only
          localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(allData));
          
          // Load QC statuses and work hours for all requests
          const requestCodes = allData.map(r => r.request_code);
          loadQCStatuses(requestCodes);
          loadWorkHours(requestCodes);
        } else {
          console.log('⚠️ No data from Supabase, trying localStorage');
          loadFromLocal();
        }
      } catch (err) {
        console.error('❌ Supabase fetch error:', err);
        loadFromLocal();
      }
    };

    // Clear any stale cache and load fresh data
    console.log('🔄 Starting fresh data load...');
    loadFromSupabase();
  }, [isFactoryAdmin, userEmail]);

  useEffect(() => {
    if (!supabase) return;

    const handlers = [
      { table: 'requests', label: 'Wheelchair Lifter Installation' },
      { table: 'g24_requests', label: 'The Ultimate G24' },
      { table: 'diving_solution_requests', label: 'Diving Solution Installation' },
      { table: 'turney_seat_requests', label: 'Turney Seat Installation' },
    ];

    const channel = supabase.channel(`requests-updates-${userEmail || 'factory'}`);

    handlers.forEach(({ table, label }) => {
      // Listen for new inserts - only factory admin or own creations for sales
      channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table }, (payload) => {
        // Sales users should only see their own new requests
        if (!isFactoryAdmin() && payload.new.created_by_email !== userEmail) {
          return;
        }
        
        const mapped = mapSupabaseRowToRequest(payload.new, label);

        setRequests((prev) => {
          const exists = prev.some((req) => req.request_code === mapped.request_code);
          if (exists) return prev;
          const next = [mapped, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(next));
          return next;
        });

        // Only notify factory admin of new jobs from others, sales see their own
        if (isFactoryAdmin() || payload.new.created_by_email === userEmail) {
          setNewJobNotification({ requestCode: mapped.request_code, label });
        }
      });

      // Listen for updates (status changes)
      channel.on('postgres_changes', { event: 'UPDATE', schema: 'public', table }, (payload) => {
        // Sales users should only see updates to their own requests
        if (!isFactoryAdmin() && payload.new.created_by_email !== userEmail) {
          return;
        }
        
        setRequests((prev) => {
          const updated = prev.map((req) => {
            if (req.request_code === payload.new.request_code) {
              const newPayload = payload.new.payload || {};
              return {
                ...req,
                ...newPayload,
                status: payload.new.status || newPayload.status || 'Requested to factory',
                createdAt: payload.new.created_at || req.createdAt,
              };
            }
            return req;
          });
          localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(updated));
          return updated;
        });
      });
    });

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isFactoryAdmin, userEmail]);

  // Filter requests based on user role
  const getVisibleRequests = () => {
    // Both factory admin and sales see their respective requests
    // Sales already filtered at query level, factory admin sees all
    return requests;
  };

  const visibleRequests = getVisibleRequests();

  // Handle opening view attachments modal
  const handleOpenAttachmentsModal = (request) => {
    setSelectedRequestForView(request);
    setShowAttachmentsModal(true);
  };

  // Reload QC statuses and work hours when requests change or when page becomes visible
  useEffect(() => {
    if (visibleRequests.length > 0) {
      const requestCodes = visibleRequests.map(r => r.request_code).filter(Boolean);
      if (requestCodes.length > 0) {
        loadQCStatuses(requestCodes);
        loadWorkHours(requestCodes);
      }
    }

    const handleVisibilityChange = async () => {
      if (!document.hidden) {
        console.log('🔄 Page became visible - reloading fresh data from Supabase...');
        
        // Force reload from Supabase when page becomes visible
        if (supabase && visibleRequests.length > 0) {
          try {
            const requestCodes = visibleRequests.map(r => r.request_code).filter(Boolean);
            if (requestCodes.length > 0) {
              loadQCStatuses(requestCodes);
              loadWorkHours(requestCodes);
              
              // Reload all requests to get latest status
              window.location.reload();
            }
          } catch (err) {
            console.error('Error reloading on visibility change:', err);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [visibleRequests]);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Track known request codes for polling-based detection
  useEffect(() => {
    requestCodesRef.current = new Set(requests.map((r) => r.request_code));
  }, [requests]);

  // Polling fallback to detect new jobs in case realtime is not available
  useEffect(() => {
    if (!supabase || !isFactoryAdmin()) return;

    const handlers = [
      { table: 'requests', label: 'Wheelchair Lifter Installation' },
      { table: 'g24_requests', label: 'The Ultimate G24' },
      { table: 'diving_solution_requests', label: 'Diving Solution Installation' },
      { table: 'turney_seat_requests', label: 'Turney Seat Installation' },
    ];

    const checkLatest = async () => {
      try {
        for (const { table, label } of handlers) {
          const { data, error } = await supabase
            .from(table)
            .select('request_code, status, created_at, created_by_email, payload')
            .order('created_at', { ascending: false })
            .limit(1);

          if (error) {
            console.error('Poll error', table, error);
            continue;
          }

          const row = data?.[0];
          if (!row || !row.request_code) continue;

          if (!requestCodesRef.current.has(row.request_code)) {
            const mapped = mapSupabaseRowToRequest(row, label);
            setRequests((prev) => {
              const exists = prev.some((req) => req.request_code === mapped.request_code);
              if (exists) return prev;
              const next = [mapped, ...prev].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
              localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(next));
              return next;
            });
            setNewJobNotification({ requestCode: row.request_code, label });
            requestCodesRef.current.add(row.request_code);
          }
        }
      } catch (err) {
        console.error('Polling failed', err);
      }
    };

    const interval = setInterval(checkLatest, 10000);
    checkLatest();

    return () => clearInterval(interval);
  }, [isFactoryAdmin]);

  // Session tracking removed

  const handleStatusChange = async (id, newStatus, e) => {
    e.stopPropagation();
    setStatusError('');
    if (!isFactoryAdmin()) return;

    const target = requests.find(req => req.id === id || req.request_code === id);
    if (!target) {
      console.warn('Status change requested for missing job', id);
      return;
    }

    const requestCode = target.request_code || id;
    const jobRequestLabel = target.jobRequest || target.job?.requestType || 'Wheelchair Lifter Installation';
    const targetTable = getTableForJobRequest(jobRequestLabel);

    // Optimistic UI update
    const optimistic = requests.map(req => (req.id === id || req.request_code === id) ? { ...req, status: newStatus } : req);
    setRequests(optimistic);
    localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(optimistic));

    if (!supabase) {
      setStatusError('Cloud sync is offline. Set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to persist.');
      return;
    }

    const { error } = await supabase
      .from(targetTable)
      .update({ status: newStatus })
      .eq('request_code', requestCode);

    if (error) {
      console.error(`❌ Supabase UPDATE FAILED for ${requestCode} (table: ${targetTable})`, { 
        code: error.code, 
        message: error.message, 
        details: error.details,
        hint: error.hint,
      });
      setStatusError(`Supabase error: ${error.message || 'Unknown error'}. Check console.`);
      // Revert to previous status
      const reverted = requests;
      setRequests(reverted);
      localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(reverted));
      return;
    }

    console.log(`✅ Supabase UPDATE SUCCESS for ${requestCode} (table: ${targetTable}). Status set to: ${newStatus}`);

    // Confirm with a fresh read to avoid stale cache
    const refreshed = await refetchRequest(requestCode, jobRequestLabel);
    if (refreshed) {
      console.log(`📡 Refetch confirmed - status in DB is now: ${refreshed.status}`);
      setRequests(prev => {
        const merged = prev.map(req => (req.id === id || req.request_code === id) ? { ...req, ...refreshed } : req);
        localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(merged));
        return merged;
      });
    } else {
      console.warn('⚠️ Refetch returned null - could not verify status in DB');
    }
  };

  const handleDeleteRequest = async (id, e) => {
    e.stopPropagation();
    
    if (!isFactoryAdmin()) {
      alert('Only factory admins can delete requests.');
      return;
    }

    const target = requests.find(req => req.id === id || req.request_code === id);
    if (!target) {
      console.warn('Delete requested for missing job', id);
      return;
    }

    // Confirm before deleting
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this request?\n\nCustomer: ${target.customer?.name || '—'}\nRequest Code: ${id}\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const requestCode = target.request_code || id;
      const jobRequestLabel = target.jobRequest || target.job?.requestType || 'Wheelchair Lifter Installation';
      const targetTable = getTableForJobRequest(jobRequestLabel);

      if (!supabase) {
        alert('Database connection not available');
        return;
      }

      console.log(`🗑️ Deleting request ${requestCode} from ${targetTable}...`);

      // Delete related records first (to avoid foreign key constraints)
      // Delete work hours
      const { error: workHoursError } = await supabase
        .from('work_hours_log')
        .delete()
        .eq('request_id', requestCode);
      
      if (workHoursError) {
        console.warn('Work hours deletion warning:', workHoursError);
      }

      // Delete QC inspections
      const { error: qcError } = await supabase
        .from('qc_inspections')
        .delete()
        .eq('request_code', requestCode);
      
      if (qcError) {
        console.warn('QC inspection deletion warning:', qcError);
      }

      // Delete delivery notes
      const { error: deliveryError } = await supabase
        .from('delivery_notes')
        .delete()
        .eq('request_code', requestCode);
      
      if (deliveryError) {
        console.warn('Delivery notes deletion warning:', deliveryError);
      }

      // Delete attachments from storage if any
      if (target.requestAttachments && target.requestAttachments.length > 0) {
        for (const attachment of target.requestAttachments) {
          if (attachment.url) {
            try {
              const filePath = attachment.url.split('/').slice(-2).join('/');
              await supabase.storage.from('request-attachments').remove([filePath]);
            } catch (storageErr) {
              console.warn('Storage deletion warning:', storageErr);
            }
          }
        }
      }

      // Finally delete the main request
      const { error } = await supabase
        .from(targetTable)
        .delete()
        .eq('request_code', requestCode);

      if (error) {
        console.error(`❌ Delete failed for ${requestCode}`, error);
        alert(`Failed to delete request: ${error.message}`);
        return;
      }

      console.log(`✅ Request ${requestCode} and all related data deleted successfully`);

      // Remove from local state
      const updated = requests.filter(req => req.id !== id && req.request_code !== requestCode);
      setRequests(updated);
      localStorage.setItem('wheelchair_lifter_requests_v1', JSON.stringify(updated));

      alert('Request and all related data deleted successfully.');
    } catch (err) {
      console.error('Delete error:', err);
      alert(`Error deleting request: ${err.message}`);
    }
  };

  const filteredRequests = visibleRequests
    .filter(req => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        (req.id || '').toLowerCase().includes(searchLower) ||
        (req.customer?.name || '').toLowerCase().includes(searchLower) ||
        (req.customer?.mobile || '').includes(searchTerm) ||
        (req.customer?.quoteRef || '').toLowerCase().includes(searchLower);
      
      const matchesFilter = filterStatus === 'All' || req.status === filterStatus;
      
      // Date range filter
      let matchesDateRange = true;
      if (dateRangeStart || dateRangeEnd) {
        const reqDate = new Date(req.createdAt);
        if (dateRangeStart) {
          const startDate = new Date(dateRangeStart);
          matchesDateRange = matchesDateRange && reqDate >= startDate;
        }
        if (dateRangeEnd) {
          const endDate = new Date(dateRangeEnd);
          endDate.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && reqDate <= endDate;
        }
      }
      
      return matchesSearch && matchesFilter && matchesDateRange;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const getStatusColor = (status) => {
    switch (status) {
      case 'Requested to factory': return { bg: 'bg-blue-50', badge: 'bg-blue-100 text-blue-800' };
      case 'In review': return { bg: 'bg-amber-50', badge: 'bg-amber-100 text-amber-800' };
      case 'Approved': return { bg: 'bg-green-50', badge: 'bg-green-100 text-green-800' };
      case 'Ready for delivery': return { bg: 'bg-orange-50', badge: 'bg-orange-100 text-orange-800' };
      case 'Completed': return { bg: 'bg-gray-50', badge: 'bg-gray-200 text-gray-800' };
      default: return { bg: 'bg-white', badge: 'bg-gray-100 text-gray-600' };
    }
  };

  const getQCBadge = (requestCode) => {
    const qcStatus = qcStatuses[requestCode];
    if (!qcStatus) return null;
    
    switch (qcStatus) {
      case 'passed':
        return { bg: 'bg-green-100', text: 'text-green-800', icon: '', label: 'QC Passed' };
      case 'failed':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '', label: 'QC Failed' };
      case 'in_progress':
      case 'pending':
        return { bg: 'bg-gray-100', text: 'text-gray-700', icon: '', label: 'QC Pending' };
      default:
        return null;
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    return new Date(isoString).toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  // Helper function to render different preview details based on request type
  const renderPreviewDetails = (req) => {
    if (req.jobRequest === 'The Ultimate G24') {
      return (
        <>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Salesperson Name:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.salespersonName || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Vehicle:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.job?.vehicle?.make} {req.job?.vehicle?.model}</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Product Model:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.productModel?.selection || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Seat Position:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.secondRowSeatPosition?.selection || '—'}</span>
          </div>
        </>
      );
    } else if (req.jobRequest === 'Diving Solution Installation') {
      return (
        <>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Salesperson Name:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.salespersonName || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Vehicle:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.job?.vehicle?.make} {req.job?.vehicle?.model}</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Device Model:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.divingSolution?.deviceModel || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Installation Location:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.divingSolution?.installationLocation || '—'}</span>
          </div>
        </>
      );
    } else if (req.jobRequest === 'Turney Seat Installation') {
      return (
        <>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Salesperson Name:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.salespersonName || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Vehicle:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.job?.vehicle?.make} {req.job?.vehicle?.model}</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Seat Type:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.turneySeats?.seatType || '—'}</span>
          </div>
        </>
      );
    } else {
      // Wheelchair Lifter Installation - default
      return (
        <>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Salesperson Name:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.salespersonName || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Vehicle:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.job?.vehicle?.make} {req.job?.vehicle?.model}</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>User Weight:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.userInfo?.userWeightKg || '—'} kg</span>
          </div>
          <div className="flex justify-between">
            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Wheelchair Type:</span>
            <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.userInfo?.wheelchairType || '—'}</span>
          </div>
        </>
      );
    }
  };

  const stats = {
    total: requests.length,
    requested: requests.filter(r => r.status === 'Requested to factory').length,
    inReview: requests.filter(r => r.status === 'In review').length,
    approved: requests.filter(r => r.status === 'Approved').length,
    readyForDelivery: requests.filter(r => r.status === 'Ready for delivery').length,
    completed: requests.filter(r => r.status === 'Completed').length,
  };

  return (
    <>
      {isFactoryAdmin() && newJobNotification && !dismissedNotifications.has(newJobNotification.requestCode) && (
        <div
          className="fixed top-4 right-4 z-50 cursor-pointer"
          onClick={() => {
            // Add to dismissed set and persist
            const updated = new Set(dismissedNotifications);
            updated.add(newJobNotification.requestCode);
            setDismissedNotifications(updated);
            localStorage.setItem(`dismissed_notifications_${userEmail}`, JSON.stringify(Array.from(updated)));
            setNewJobNotification(null);
          }}
        >
          <div className="bg-blue-600 text-white rounded-lg shadow-xl px-4 py-3 flex items-start gap-3 max-w-sm">
            <FiBell size={20} className="mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">New job added</p>
              <p className="text-xs text-blue-100">{newJobNotification.label}</p>
              <p className="text-[11px] text-blue-100">ID: {newJobNotification.requestCode} · Click to dismiss</p>
            </div>
          </div>
        </div>
      )}

      <div className={`flex h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Status sync warning */}
      {statusError && (
        <div className="fixed top-4 right-4 z-50 bg-red-100 border border-red-300 text-red-800 px-4 py-3 rounded shadow">
          {statusError}
        </div>
      )}
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} transition-all duration-300 flex flex-col ${darkMode ? 'border-r border-gray-700' : 'border-r border-gray-200'}`}>
        <div className="p-4 border-b border-gray-700 flex items-center justify-center">
          {sidebarOpen && <h2 className="font-bold text-lg flex-1">Factory</h2>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className={`${darkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'} transition-colors p-2 rounded flex-shrink-0`}>
            {sidebarOpen ? <FiChevronLeft size={22} /> : <FiChevronRight size={22} />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {sidebarOpen && (
            <div className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wider px-2 mb-3`}>
              Dashboard
            </div>
          )}
          <div className="space-y-1.5">
            {[
              { label: 'All Requests', count: stats.total, key: 'All' },
              { label: 'Requested', count: stats.requested, key: 'Requested to factory' },
              { label: 'In Review', count: stats.inReview, key: 'In review' },
              { label: 'Approved', count: stats.approved, key: 'Approved' },
              { label: 'Ready for delivery', count: stats.readyForDelivery, key: 'Ready for delivery' },
              { label: 'Completed', count: stats.completed, key: 'Completed' },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setFilterStatus(item.key)}
                className={`w-full text-left px-3 py-2.5 rounded-md transition-all flex items-center justify-between ${
                  filterStatus === item.key
                    ? 'bg-blue-600 text-white shadow-sm'
                    : darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-2 flex-1 min-w-0">
                  {sidebarOpen && <span className="truncate text-sm">{item.label}</span>}
                </span>
                {sidebarOpen && <span className={`text-xs px-2 py-0.5 rounded ml-2 flex-shrink-0 ${filterStatus === item.key ? 'bg-blue-700 text-white' : darkMode ? 'bg-gray-700 text-white' : 'bg-gray-300 text-gray-800'}`}>{item.count}</span>}
              </button>
            ))}
          </div>

          {/* Recent Jobs */}
          {sidebarOpen && requests.length > 0 && (
            <div className="pt-6 mt-4 border-t border-gray-600">
              <h3 className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wider px-2 mb-3`}>Recent Jobs</h3>
              <div className="space-y-1.5">
                {requests.slice(0, 5).map((req, idx) => (
                  <button
                    key={idx}
                    onClick={() => navigate(`/requests/${req.request_code}`)}
                    className={`w-full text-left px-3 py-2.5 rounded-md text-xs transition-all truncate ${
                      darkMode
                        ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200'
                        : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                    }`}
                    title={`${req.customer?.name || 'N/A'} - ${req.request_code}`}
                  >
                    <div className={`font-medium truncate ${darkMode ? 'text-gray-300' : 'text-gray-900'}`}>{req.request_code}</div>
                    <div className={`text-xs truncate ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{req.customer?.name || 'N/A'}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Quick Access Section */}
        <div className={`px-4 py-4 space-y-2 ${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'} mt-2`}>
          {sidebarOpen && (
            <div className={`text-xs font-semibold ${darkMode ? 'text-gray-500' : 'text-gray-600'} uppercase tracking-wider px-2 mb-3`}>
              Quick Access
            </div>
          )}
          
          {/* Work Hours Link - PROMINENT */}
          <Link
            to="/work-hours"
            className={`w-full text-left px-3 py-3 rounded-md transition-all flex items-center gap-3 block font-semibold border-2 ${
              darkMode 
                ? 'bg-blue-900 border-blue-500 text-blue-100 hover:bg-blue-800' 
                : 'bg-blue-50 border-blue-400 text-blue-900 hover:bg-blue-100'
            }`}
          >
            <FiClock size={20} />
            {sidebarOpen && <span className="text-sm">Work Hours</span>}
          </Link>

          {/* Activity Logs Link */}
          <Link
            to="/logs"
            className={`w-full text-left px-3 py-2.5 rounded-md transition-all flex items-center gap-3 block ${
              darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            <FiActivity size={18} />
            {sidebarOpen && <span className="text-sm">Activity Logs</span>}
          </Link>

          {/* Deliveries Link */}
          <Link
            to="/deliveries"
            className={`w-full text-left px-3 py-2.5 rounded-md transition-all flex items-center gap-3 block ${
              darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-200 hover:text-gray-900'
            }`}
          >
            <FiTruck size={18} />
            {sidebarOpen && <span className="text-sm">Deliveries</span>}
          </Link>
        </div>


        <div className={`p-4 space-y-2.5 ${darkMode ? 'border-t border-gray-700' : 'border-t border-gray-200'}`}>
          <button
            onClick={() => setShowNewRequestModal(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <FiPlus size={18} />
            {sidebarOpen && <span>New Request</span>}
          </button>
          <button
            onClick={logout}
            className={`w-full font-semibold py-2.5 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2 shadow-sm ${
              darkMode
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-200 hover:bg-red-300 text-red-900'
            }`}
          >
            <FiLogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
          {sidebarOpen && (
            <p className={`text-xs mt-3 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'} truncate px-2`}>
              {userEmail}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${darkMode ? 'bg-gray-50' : 'bg-white'}`}>
        {/* Top Bar with Sort and View Toggle */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm p-6`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} font-medium`}>
                {isFactoryAdmin() ? 'FACTORY ADMIN' : 'SALES PERSON'}
              </p>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {isFactoryAdmin() ? 'Request Management Dashboard' : 'New Work Request'}
              </h1>
            </div>
            <div className="flex gap-3 items-center">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className={`p-2 rounded transition-colors ${darkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>
              <div className={`flex gap-2 border rounded-lg p-1 ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                <button 
                  onClick={() => setViewMode('grid')} 
                  className={`p-2 rounded transition-colors ${viewMode === 'grid' ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  title="Grid View"
                >
                  <FiGrid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')} 
                  className={`p-2 rounded transition-colors ${viewMode === 'list' ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  title="List View"
                >
                  <FiList size={18} />
                </button>
              </div>
              <button onClick={() => setSortOrder('newest')} className={`px-3 py-2 rounded-md text-sm transition ${sortOrder === 'newest' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Newest
              </button>
              <button onClick={() => setSortOrder('oldest')} className={`px-3 py-2 rounded-md text-sm transition ${sortOrder === 'oldest' ? 'bg-blue-600 text-white' : darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                Oldest
              </button>
              {/* Profile Header with User Info and Dropdown */}
              <ProfileHeader />
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b p-6 space-y-4`}>
          <div>
            <input
              type="text"
              placeholder="Search by Request ID, Customer Name, Mobile, or Quote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'}`}
            />
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>From Date</label>
              <input
                type="date"
                value={dateRangeStart}
                onChange={(e) => setDateRangeStart(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            <div className="flex-1">
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>To Date</label>
              <input
                type="date"
                value={dateRangeEnd}
                onChange={(e) => setDateRangeEnd(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              />
            </div>
            {(dateRangeStart || dateRangeEnd) && (
              <button
                onClick={() => {
                  setDateRangeStart('');
                  setDateRangeEnd('');
                }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${darkMode ? 'text-gray-300 bg-gray-700 hover:bg-gray-600' : 'text-gray-700 bg-gray-200 hover:bg-gray-300'}`}
              >
                Clear Dates
              </button>
            )}
          </div>
        </div>

        {/* Requests Grid/List */}
        <div className="flex-1 overflow-auto p-6">
          {filteredRequests.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-full ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              <p className="text-lg font-medium mb-2">
                {!isFactoryAdmin() ? 'No requests created yet' : 'No requests found'}
              </p>
              <button
                onClick={() => setShowNewRequestModal(true)}
                className="text-blue-600 hover:underline text-sm font-medium"
              >
                {!isFactoryAdmin() ? 'Create your first request' : 'Create a new request'}
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRequests.map(req => {
                if (!req || typeof req !== 'object') return null;
                const colors = getStatusColor(req.status);
                const customer = req.customer && typeof req.customer === 'object' ? req.customer : { name: '—', mobile: '—', quoteRef: '—' };
                const jobRequest = req.jobRequest || (req.job && req.job.requestType) || '—';
                const createdAt = req.createdAt ? formatDate(req.createdAt) : '—';
                return (
                  <div
                    key={req.id || req.request_code || Math.random()}
                    onClick={() => req.id && navigate(`/requests/${req.id}`)}
                    className={`${colors.bg} ${darkMode ? 'border-gray-600' : 'border-gray-200'} border rounded-lg shadow-sm hover:shadow-lg hover:scale-105 transition-all cursor-pointer overflow-hidden group`}
                  >
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className={`font-mono text-xs px-2 py-1 rounded w-fit ${darkMode ? 'text-gray-300 bg-gray-600' : 'text-gray-600 bg-gray-200'}`}> 
                            {req.id || '—'}
                          </div>
                          <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{createdAt}</p>
                        </div>
                        <div onClick={e => e.stopPropagation()}>
                          {isFactoryAdmin() ? (
                            <select
                              value={req.status}
                              onChange={(e) => handleStatusChange(req.id, e.target.value, e)}
                              className={`text-xs font-bold px-3 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${colors.badge}`}
                            >
                              <option value="Requested to factory">Requested</option>
                              <option value="In review">In Review</option>
                              <option value="Approved">Approved</option>
                              <option value="Ready for delivery">Ready for delivery</option>
                              <option value="Completed">Completed</option>
                            </select>
                          ) : (
                            <span className={`text-xs font-bold px-3 py-1 rounded-full ${colors.badge}`}>
                              {req.status === 'Requested to factory' ? 'Requested' : req.status}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* QC Status Badge for Grid */}
                      {req.request_code && getQCBadge(req.request_code) && (
                        <div className={`mb-4 px-3 py-2 rounded-lg text-xs font-semibold text-center ${getQCBadge(req.request_code).bg} ${getQCBadge(req.request_code).text}`}>
                          {getQCBadge(req.request_code).icon} {getQCBadge(req.request_code).label}
                        </div>
                      )}

                      {/* PDF Badge (internal only) */}
                      <div className="mb-4 flex flex-wrap gap-2">
                        {req.pdf_url && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                            <FiFileText className="w-3 h-3" />
                            PDF
                          </div>
                        )}
                      </div>

                      <div className={`mb-4 pb-4 ${darkMode ? 'border-gray-500' : 'border-gray-300'} border-b`}>
                        <h3 className={`font-bold text-lg group-hover:text-blue-600 transition-colors ${darkMode ? 'text-black' : 'text-gray-900'}`}>
                          {customer.name || '—'}
                        </h3>
                        <p className={`text-sm mt-1 ${darkMode ? 'text-black' : 'text-gray-600'}`}>{customer.mobile || '—'}</p>
                        <p className={`text-xs mt-1 ${darkMode ? 'text-gray-700' : 'text-gray-500'}`}>Quote: {customer.quoteRef || '—'}</p>
                      </div>

                      <div className="space-y-2 text-sm">
                        {renderPreviewDetails(req)}
                        <div className="flex justify-between">
                          <span className={darkMode ? 'text-black' : 'text-gray-600'}>Request Type:</span>
                          <span className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{jobRequest}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <button className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-md transition-colors text-sm">
                          View Details
                        </button>
                        {isFactoryAdmin() && (
                          <button
                            onClick={(e) => handleDeleteRequest(req.id || req.request_code, e)}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-3 rounded-md transition-colors text-sm"
                          >
                            Delete Request
                          </button>
                        )}
                      </div>

                      {/* Resources/Attachments Button */}
                      {Array.isArray(req.requestAttachments) && req.requestAttachments.length > 0 && (
                        <div className="mt-4" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenAttachmentsModal(req)}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-3 rounded-md transition-colors text-sm flex items-center justify-center gap-2"
                          >
                            <FiFileText size={16} />
                            Resources ({req.requestAttachments.length})
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRequests.map(req => {
                const colors = getStatusColor(req.status);
                return (
                  <div
                    key={req.id}
                    onClick={() => navigate(`/requests/${req.id}`)}
                    className={`${colors.bg} ${darkMode ? 'border-gray-600' : 'border-gray-200'} border rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer p-4 flex items-center justify-between group hover:bg-opacity-70`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`font-mono text-xs px-2 py-1 rounded w-fit flex-shrink-0 ${darkMode ? 'text-white bg-gray-600' : 'text-gray-600 bg-gray-200'}`}>
                          {req.id}
                        </div>
                        <h3 className={`font-bold group-hover:text-blue-600 transition-colors truncate ${darkMode ? 'text-black' : 'text-gray-900'}`}>
                          {req.customer?.name || '—'}
                        </h3>
                        <p className={`text-xs flex-shrink-0 ${darkMode ? 'text-gray-700' : 'text-gray-500'}`}>{formatDate(req.createdAt)}</p>
                      </div>
                      {getQCBadge(req.request_code) && (
                        <div className={`inline-flex items-center text-xs font-semibold px-3 py-1 rounded-full mb-3 ${getQCBadge(req.request_code).bg} ${getQCBadge(req.request_code).text}`}>
                          {getQCBadge(req.request_code).label}
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className={darkMode ? 'text-black' : 'text-gray-600'}>Mobile:</span>
                          <p className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.customer?.mobile || '—'}</p>
                        </div>
                        <div>
                          <span className={darkMode ? 'text-black' : 'text-gray-600'}>Quote:</span>
                          <p className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.customer?.quoteRef || '—'}</p>
                        </div>
                        <div>
                          <span className={darkMode ? 'text-black' : 'text-gray-600'}>Vehicle:</span>
                          <p className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.job?.vehicle?.make} {req.job?.vehicle?.model}</p>
                        </div>
                        <div>
                          <span className={darkMode ? 'text-black' : 'text-gray-600'}>Type:</span>
                          <p className={`font-medium ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.jobRequest || req.job?.requestType || '—'}</p>
                        </div>
                      </div>
                      {workHours[req.request_code] && (
                        <div className="mt-3 pt-3 border-t border-gray-300">
                          <div className="flex items-center gap-2 text-sm">
                            <FiClock className={darkMode ? 'text-blue-600' : 'text-blue-600'} size={16} />
                            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Work Hours:</span>
                            <span className={`font-semibold ${darkMode ? 'text-black' : 'text-gray-900'}`}>
                              {workHours[req.request_code].completed.toFixed(1)}h completed
                            </span>
                            {workHours[req.request_code].total > workHours[req.request_code].completed && (
                              <span className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-500'}`}>
                                ({workHours[req.request_code].total.toFixed(1)}h total)
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {req.jobRequest === 'The Ultimate G24' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-2 pt-2 border-t border-gray-300">
                          <div>
                            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Product:</span>
                            <p className={`font-medium text-xs ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.productModel?.selection || '—'}</p>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Seat:</span>
                            <p className={`font-medium text-xs ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.secondRowSeatPosition?.selection || '—'}</p>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Tie Down:</span>
                            <p className={`font-medium text-xs ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.tieDown?.selection || '—'}</p>
                          </div>
                        </div>
                      )}
                      {req.jobRequest === 'Diving Solution Installation' && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-2 pt-2 border-t border-gray-300">
                          <div>
                            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Device:</span>
                            <p className={`font-medium text-xs ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.divingSolution?.deviceModel || '—'}</p>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Location:</span>
                            <p className={`font-medium text-xs ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.divingSolution?.installationLocation || '—'}</p>
                          </div>
                          <div>
                            <span className={darkMode ? 'text-black' : 'text-gray-600'}>Seat Pos:</span>
                            <p className={`font-medium text-xs ${darkMode ? 'text-black' : 'text-gray-900'}`}>{req.divingSolution?.driverSeatPosition || '—'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 items-center ml-4 flex-shrink-0" onClick={e => e.stopPropagation()}>
                      {isFactoryAdmin() && (
                        <button
                          onClick={(e) => handleDeleteRequest(req.id, e)}
                          className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded transition-colors"
                          title="Delete this request"
                        >
                          Delete
                        </button>
                      )}
                      {isFactoryAdmin() ? (
                        <select
                          value={req.status}
                          onChange={(e) => handleStatusChange(req.id, e.target.value, e)}
                          className={`text-xs font-bold px-3 py-1 rounded-full border-0 cursor-pointer focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${colors.badge}`}
                        >
                          <option value="Requested to factory">Requested</option>
                          <option value="In review">In Review</option>
                          <option value="Approved">Approved</option>
                          <option value="Ready for delivery">Ready for delivery</option>
                          <option value="Completed">Completed</option>
                        </select>
                      ) : (
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${colors.badge}`}>
                          {req.status === 'Requested to factory' ? 'Requested' : req.status}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* New Request Modal */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">Create New Request</h2>
              <button
                onClick={() => setShowNewRequestModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">Optionally enter a customer name to prefill.</p>
              <input
                type="text"
                value={newRequestCustomerName}
                onChange={(e) => setNewRequestCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="w-full px-4 py-2 border rounded-md mb-4"
              />
              <button
                onClick={() => {
                  setShowNewRequestModal(false);
                  const param = newRequestCustomerName ? `&name=${encodeURIComponent(newRequestCustomerName)}` : '';
                  window.location.href = `/customer?new=1${param}`;
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Go to Form
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer form creation and customer PDF attach features have been removed */}

      {/* View Attachments Modal */}
      {showAttachmentsModal && selectedRequestForView && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-96 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <FiFileText className="text-purple-600" />
                Resources & Attachments
              </h2>
              <button
                onClick={() => setShowAttachmentsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="p-6">
              {!selectedRequestForView.requestAttachments || selectedRequestForView.requestAttachments.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No attachments available</p>
              ) : (
                <div className="space-y-3">
                  {selectedRequestForView.requestAttachments.map((attachment, index) => {
                    if (!attachment || !attachment.url) return null;
                    const displayName = attachment.filename || attachment.name || 'Attachment';
                    const sizeValue = attachment.size || attachment.fileSize;
                    return (
                      <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition">
                        <span className="text-2xl">{getFileIcon(displayName)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(sizeValue)}</p>
                        </div>
                        <a
                          href={attachment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-purple-600 text-white text-xs font-medium rounded hover:bg-purple-700 transition whitespace-nowrap"
                        >
                          View
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default RequestJobs;
