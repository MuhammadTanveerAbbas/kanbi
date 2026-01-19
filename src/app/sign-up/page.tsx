'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, LayoutGrid } from 'lucide-react'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // Create profile manually if trigger fails
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        // Create subscription
        const { error: subError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: data.user.id,
            plan: 'free',
            status: 'active',
          })

        if (subError) {
          console.error('Subscription creation error:', subError)
        }

        router.push('/dashboard')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center p-3 sm:p-4 bg-black overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]" />
      <Card className="w-full max-w-[340px] sm:max-w-md relative z-10 border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-2 sm:space-y-4 pb-3 sm:pb-6">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 mx-auto">
            <LayoutGrid className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
            <span className="font-bold text-base sm:text-xl">KANBI</span>
          </Link>
          <div className="text-center">
            <CardTitle className="text-lg sm:text-2xl">Create an account</CardTitle>
            <CardDescription className="text-[10px] sm:text-sm">Enter your information to get started</CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-2.5 sm:space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription className="text-[10px] sm:text-sm">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="fullName" className="text-[10px] sm:text-sm">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
                className="h-8 sm:h-11 text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="email" className="text-[10px] sm:text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-8 sm:h-11 text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1 sm:space-y-2">
              <Label htmlFor="password" className="text-[10px] sm:text-sm">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  disabled={loading}
                  className="h-8 sm:h-11 pr-10 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={loading}
                >
                  {showPassword ? <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" /> : <Eye className="h-3 w-3 sm:h-4 sm:w-4" />}
                </button>
              </div>
              <p className="text-[9px] sm:text-xs text-muted-foreground">Must be at least 6 characters</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2.5 sm:space-y-4">
            <Button type="submit" className="w-full h-9 sm:h-11 text-xs sm:text-base" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
            <p className="text-[10px] sm:text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
