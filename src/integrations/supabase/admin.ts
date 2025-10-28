// Cliente Supabase com Service Role para operações administrativas
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://wtwxggubulpikvsdiusn.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind0d3hnZ3VidWxwaWt2c2RpdXNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU3NTU2NywiZXhwIjoyMDc3MTUxNTY3fQ.8HSUhmqFSFAEkL5MdyZTQ_o8POsbg6cARt50QJKCuNY';

// Cliente administrativo com service role
export const supabaseAdmin = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Função para confirmar usuário automaticamente
export const confirmUserEmail = async (email: string) => {
  try {
    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) throw listError;
    
    const user = users.users.find(u => u.email === email);
    
    if (user && !user.email_confirmed_at) {
      const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { email_confirm: true }
      );
      
      if (confirmError) throw confirmError;
      
      return { success: true, message: 'Usuário confirmado automaticamente' };
    }
    
    return { success: true, message: 'Usuário já confirmado' };
  } catch (error: any) {
    console.error('Erro ao confirmar usuário:', error);
    return { success: false, message: error.message };
  }
};
