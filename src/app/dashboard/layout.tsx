import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Not logged in <Icons.ArrowRight size={13}/> redirect to sign-in (server-side, no flicker)
  if (!user) redirect('/sign-in')

  return <>{children}</>
}
