import { supabase } from '../lib/supabaseClient';

export const logAudit = async (
  action: string,
  module: string,
  details: string,
  user_id?: string,
  user_name?: string,
  school_id?: string
) => {
  try {
    // If user details not provided, try to get from current session
    if (!user_id || !user_name || !school_id) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            user_id = user_id || user.id;
            if (!user_name || !school_id) {
                const { data: profile } = await supabase.from('profiles').select('name, school_id').eq('id', user.id).single();
                if (profile) {
                    user_name = user_name || profile.name;
                    school_id = school_id || profile.school_id;
                }
            }
        }
    }

    await supabase.from('audit_logs').insert({
      action,
      module,
      details,
      user_id,
      user_name,
      school_id
    });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};

export const logUserLogin = async (
  user_id: string,
  user_name: string,
  role: string,
  status: 'Success' | 'Failed',
  school_id?: string
) => {
  try {
    await supabase.from('user_logs').insert({
      user_id,
      user_name,
      role,
      status,
      school_id,
      user_agent: navigator.userAgent
    });
  } catch (error) {
    console.error('Failed to log user login:', error);
  }
};
