'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createSessionClient } from '@/lib/supabase/server-auth';

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/login');
}
