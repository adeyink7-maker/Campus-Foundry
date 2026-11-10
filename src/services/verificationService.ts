import { supabase, isSupabaseConfigured, emitAppToast, logAdminActionInSupabase } from './supabase';
import { VerificationRequest, VerificationStatus, StudentLevel } from '../types';
import { getFriendlyError, withNetworkRetry } from '../utils/friendlyErrors';

export const VERIFICATION_BUCKET = 'verification-proofs';

/**
 * Uploads student proof to 'verification-proofs' storage bucket and records request in verification_requests
 */
export async function submitVerificationRequest({
  userId,
  file,
  note,
}: {
  userId: string;
  file: File;
  note?: string;
}): Promise<VerificationRequest> {
  // Ensure file size is reasonable (max 10MB)
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('That file is too large or not supported. Please use a PNG or JPG under 10MB.');
  }

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${Date.now()}_proof.${fileExt}`;
  const targetPath = `${userId}/${fileName}`;

  try {
    return await withNetworkRetry(async () => {
      // 1. Upload proof file to storage bucket
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(VERIFICATION_BUCKET)
        .upload(targetPath, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) {
        console.error('[Verification Proof Upload Error]:', uploadError);
        throw uploadError;
      }

      const storedPath = uploadData?.path || targetPath;

      // 2. Insert into verification_requests table
      const { data: inserted, error: insertError } = await supabase
        .from('verification_requests')
        .insert({
          user_id: userId,
          proof_url: storedPath,
          note: note?.trim() || null,
          status: 'pending',
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error('[Verification Request Insert Error]:', insertError);
        throw insertError;
      }

      emitAppToast("Your verification request has been sent. We'll review it soon.", 'success');

      return {
        id: inserted.id,
        userId: inserted.user_id,
        proofUrl: inserted.proof_url,
        note: inserted.note,
        status: inserted.status as VerificationStatus,
        reviewedBy: inserted.reviewed_by,
        reviewedAt: inserted.reviewed_at,
        createdAt: inserted.created_at,
      };
    }, 2);
  } catch (err: unknown) {
    const friendly = getFriendlyError(err, 'verification');
    throw new Error(friendly);
  }
}

/**
 * Fetches the most recent verification request for the active user
 */
export async function fetchMyVerificationRequest(userId: string): Promise<VerificationRequest | null> {
  if (!isSupabaseConfigured || !userId) return null;

  try {
    const { data, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[Fetch My Verification Notice]:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      userId: data.user_id,
      proofUrl: data.proof_url,
      note: data.note,
      status: data.status as VerificationStatus,
      reviewedBy: data.reviewed_by,
      reviewedAt: data.reviewed_at,
      createdAt: data.created_at,
    };
  } catch (e) {
    console.warn('[Fetch My Verification Exception]:', e);
    return null;
  }
}

/**
 * Fetches all pending student verification requests with student profile details (Admin only)
 */
export async function fetchPendingVerificationRequests(): Promise<VerificationRequest[]> {
  if (!isSupabaseConfigured) return [];

  try {
    const { data: requests, error } = await supabase
      .from('verification_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Fetch Pending Verifications Error]:', error);
      throw new Error(error.message);
    }

    if (!requests || requests.length === 0) return [];

    // Fetch applicant profile info for each request
    const userIds = Array.from(new Set(requests.map((r) => r.user_id)));
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, faculty, department, level, avatar_url')
      .in('id', userIds);

    const profileMap = new Map<string, any>();
    if (profiles) {
      profiles.forEach((p) => profileMap.set(p.id, p));
    }

    return requests.map((r) => {
      const p = profileMap.get(r.user_id);
      return {
        id: r.id,
        userId: r.user_id,
        proofUrl: r.proof_url,
        note: r.note,
        status: r.status as VerificationStatus,
        reviewedBy: r.reviewed_by,
        reviewedAt: r.reviewed_at,
        createdAt: r.created_at,
        applicantName: p?.full_name || 'Student Applicant',
        applicantUsername: p?.username,
        applicantFaculty: p?.faculty,
        applicantDepartment: p?.department,
        applicantLevel: p?.level as StudentLevel,
        applicantAvatarUrl: p?.avatar_url,
      };
    });
  } catch (e: any) {
    console.error('[Fetch Pending Verifications Exception]:', e);
    return [];
  }
}

/**
 * Approves a verification request:
 * Sets request status to 'approved' and marks user's profile as is_verified=true with verified_at timestamp.
 */
export async function approveVerificationRequest(
  requestId: string,
  targetUserId: string,
  adminId: string
): Promise<void> {
  const now = new Date().toISOString();

  // 1. Update verification_requests record
  const { error: requestError } = await supabase
    .from('verification_requests')
    .update({
      status: 'approved',
      reviewed_by: adminId,
      reviewed_at: now,
    })
    .eq('id', requestId);

  if (requestError) {
    console.error('[Approve Verification Request Error]:', requestError);
    throw new Error(`Failed to approve request: ${requestError.message}`);
  }

  // 2. Update student profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      is_verified: true,
      verified_at: now,
      updated_at: now,
    })
    .eq('id', targetUserId);

  if (profileError) {
    console.error('[Approve Profile Verification Error]:', profileError);
    throw new Error(`Failed to verify student profile: ${profileError.message}`);
  }

  // Log audit action
  await logAdminActionInSupabase(adminId, 'approve_student_verification', targetUserId, { requestId });

  emitAppToast('Student verification approved successfully!', 'info');
}

/**
 * Rejects a verification request:
 * Sets request status to 'rejected' with reviewer info.
 */
export async function rejectVerificationRequest(
  requestId: string,
  targetUserId: string,
  adminId: string,
  rejectionReason?: string
): Promise<void> {
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('verification_requests')
    .update({
      status: 'rejected',
      reviewed_by: adminId,
      reviewed_at: now,
      note: rejectionReason ? rejectionReason.trim() : undefined,
    })
    .eq('id', requestId);

  if (error) {
    console.error('[Reject Verification Request Error]:', error);
    throw new Error(`Failed to reject request: ${error.message}`);
  }

  // Log audit action
  await logAdminActionInSupabase(adminId, 'reject_student_verification', targetUserId, { requestId, rejectionReason });

  emitAppToast('Verification request marked as rejected.', 'info');
}

/**
 * Resolves a viewable URL for a proof path in the private verification-proofs bucket.
 * Generates a signed URL with 1-hour expiry.
 */
export async function getProofSignedUrl(proofPathOrUrl: string): Promise<string> {
  if (!proofPathOrUrl) return '';

  if (proofPathOrUrl.startsWith('http://') || proofPathOrUrl.startsWith('https://')) {
    return proofPathOrUrl;
  }

  try {
    const cleanPath = proofPathOrUrl.trim().replace(/^\/+/, '');
    const { data, error } = await supabase.storage
      .from(VERIFICATION_BUCKET)
      .createSignedUrl(cleanPath, 3600);

    if (error || !data?.signedUrl) {
      // Fallback to getPublicUrl if bucket permissions allow
      const { data: pubData } = supabase.storage
        .from(VERIFICATION_BUCKET)
        .getPublicUrl(cleanPath);
      return pubData.publicUrl;
    }

    return data.signedUrl;
  } catch (err) {
    console.warn('[Get Proof Signed URL Error]:', err);
    return proofPathOrUrl;
  }
}
