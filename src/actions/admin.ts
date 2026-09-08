"use server";

import { getAuthenticatedUser, createServiceClient } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

async function checkAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) throw new Error("Unauthorized");
  
  const supabaseAdmin = await createServiceClient();
  
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile || profile.role !== 'admin') {
    throw new Error("Unauthorized: Admin access required");
  }
  
  return supabaseAdmin;
}

export async function getAdminUsers() {
  try {
    const supabaseAdmin = await checkAdmin();
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  } catch (error: any) {
    console.error("Failed to fetch admin users:", error);
    throw new Error(error.message || "Bilinmeyen hata");
  }
}

export async function toggleUserApproval(id: string, currentStatus: boolean) {
  try {
    const supabaseAdmin = await checkAdmin();
    const updateData: any = { is_approved: !currentStatus };
    if (!currentStatus) {
      updateData.approved_at = new Date().toISOString();
    }
    
    const { error } = await supabaseAdmin
      .from('profiles')
      .update(updateData)
      .eq('id', id);
      
    if (error) throw new Error(error.message);
    
    revalidatePath("/admin/users");
    return true;
  } catch (error: any) {
    console.error("Failed to toggle approval:", error);
    throw new Error(error.message || "Bilinmeyen hata");
  }
}

export async function updateUserPlanAction(id: string, newPlan: string) {
  try {
    const supabaseAdmin = await checkAdmin();
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ plan: newPlan })
      .eq('id', id);
      
    if (error) throw new Error(error.message);
    
    revalidatePath("/admin/users");
    return true;
  } catch (error: any) {
    console.error("Failed to update user plan:", error);
    throw new Error(error.message || "Bilinmeyen hata");
  }
}

export async function deleteUserAction(id: string) {
  try {
    const supabaseAdmin = await checkAdmin();
    
    // Auth users silinmesi service_role ile mümkündür
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (authError) {
      console.warn("Auth user deletion failed, proceeding with profile deletion:", authError);
    }
    
    const { error } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', id);
      
    if (error) throw new Error(error.message);
    
    revalidatePath("/admin/users");
    return true;
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    throw new Error(error.message || "Bilinmeyen hata");
  }
}
