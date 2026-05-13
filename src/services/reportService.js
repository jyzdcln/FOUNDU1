import { supabase } from './supabase';

export const saveReport = async (report, userRole = 'student') => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    console.log("1. User object:", user);
    
    if (!user.id) {
      alert("Please login first before reporting");
      return null;
    }
    
    const status = userRole === 'admin' ? 'verified' : 'pending';
    
    const reportData = {
      user_id: user.id,
      type: report.type,
      title: report.itemTitle,
      category: report.category,
      description: report.description,
      location: report.location,
      date: report.date,
      photo_url: report.photo || null,
      status: status,
      created_at: new Date()
    };
    
    console.log("2. Report data being sent:", reportData);
    console.log("3. User role:", userRole, "Status set to:", status);
    
    const { data, error } = await supabase
      .from('reports')
      .insert([reportData])
      .select();

    console.log("4. Supabase response:", { data, error });
    
    if (error) throw error;
    
    if (userRole === 'admin') {
      alert("Report submitted and automatically verified!");
    } else {
      alert("Report submitted! Waiting for admin verification.");
    }
    return data[0];
  } catch (error) {
    console.error('Save error details:', error);
    alert("Error: " + error.message);
    return null;
  }
};

export const getReports = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, type, title, category, description, location, date, photo_url, status, created_at, users(name, email), admin_notes, rejection_reason, returned_to_user')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get reports error:', error);
    return [];
  }
};

export const updateReportStatus = async (id, newStatus, notes = null) => {
  try {
    const updateData = { status: newStatus };
    if (notes) {
      updateData.admin_notes = notes;
      updateData.rejection_reason = notes;
    }
    if (newStatus === 'received') {
      updateData.received_date = new Date();
    }
    if (newStatus === 'returned') {
      updateData.returned_to_user = true;
      updateData.returned_date = new Date();
    }
    
    const { data, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Update error:', error);
    return null;
  }
};

export const updateReportWithEdit = async (id, updatedData) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .update({
        ...updatedData,
        status: 'pending',
        edited_by_student: true,
        returned_to_user: false
      })
      .eq('id', id)
      .select();

    if (error) throw error;
    return data[0];
  } catch (error) {
    console.error('Update error:', error);
    return null;
  }
};

export const getReportsByUser = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get user reports error:', error);
    return [];
  }
};

export const getPendingReports = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, type, title, category, description, location, date, photo_url, status, created_at, users(name, email), admin_notes')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get pending reports error:', error);
    return [];
  }
};

export const getVerifiedReports = async () => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('id, type, title, category, description, location, date, photo_url, status, created_at, users(name, email)')
      .eq('status', 'verified')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Get verified reports error:', error);
    return [];
  }
};

export const deleteReport = async (id) => {
  try {
    const { error } = await supabase
      .from('reports')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false; 
  }
};

export const getStudentNotifications = async (userId) => {
  try {
    const { data: reports } = await supabase
      .from('reports')
      .select('id, title, status, created_at, admin_notes')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    
    const notifications = [];
    
    for (const report of reports) {
      if (report.status === 'returned' && report.admin_notes) {
        notifications.push({
          id: `${report.id}_returned`,
          message: `Report "${report.title}" needs your attention: ${report.admin_notes}`,
          time: formatTimeAgo(report.created_at),
          read: false,
          type: 'returned'
        });
      } else if (report.status === 'verified') {
        notifications.push({
          id: `${report.id}_verified`,
          message: `Your report "${report.title}" has been verified and is now visible!`,
          time: formatTimeAgo(report.created_at),
          read: false,
          type: 'verified'
        });
      }
    }
    
    const { data: claims } = await supabase
      .from('claims')
      .select('*, reports(title)')
      .eq('student_id', userId)
      .order('claim_date', { ascending: false })
      .limit(20);
    
    for (const claim of claims) {
      if (claim.status === 'approved') {
        notifications.push({
          id: `${claim.id}_approved`,
          message: `Your claim for "${claim.reports?.title}" has been approved! You can now pick up your item.`,
          time: formatTimeAgo(claim.claim_date),
          read: false,
          type: 'approved'
        });
      } else if (claim.status === 'rejected') {
        notifications.push({
          id: `${claim.id}_rejected`,
          message: `Your claim for "${claim.reports?.title}" was rejected. Please contact admin for more info.`,
          time: formatTimeAgo(claim.claim_date),
          read: false,
          type: 'rejected'
        });
      }
    }
    
    notifications.sort((a, b) => {
      if (a.time.includes('seconds') && !b.time.includes('seconds')) return -1;
      if (!a.time.includes('seconds') && b.time.includes('seconds')) return 1;
      return 0;
    });
    
    return notifications.slice(0, 10);
  } catch (error) {
    console.error('Get notifications error:', error);
    return [];
  }
};

const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  
  if (seconds < 60) return `${seconds} seconds ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
};

export const subscribeToNewReports = (callback) => {
  const subscription = supabase
    .channel('reports-channel')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'reports' },
      (payload) => {
        console.log('New report received in real-time!', payload);
        callback(payload.new);
      }
    )
    .subscribe();
  
  return subscription;
};

export const subscribeToStatusChanges = (callback) => {
  const subscription = supabase
    .channel('reports-status-channel')
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'reports' },
      (payload) => {
        console.log('Report status changed!', payload);
        callback(payload.new);
      }
    )
    .subscribe();
  
  return subscription;
};