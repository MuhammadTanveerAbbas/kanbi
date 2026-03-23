'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { Eye, EyeOff, LayoutGrid } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'

function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen items-center justify-center p-3 sm:p-4 bg-black overflow-hidden" suppressHydrationWarning>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_50%)]" />
      <Card className="w-full max-w-[340px] sm:max-w-md relative z-10 border-primary/20 bg-card/50 backdrop-blur-sm">
        <CardHeader className="space-y-2 sm:space-y-4 pb-3 sm:pb-6">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 mx-auto">
            <LayoutGrid className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
            <span className="font-bold text-base sm:text-xl">KANBI</span>
          </Link>
          <div className="text-center">
            <CardTitle className="text-lg sm:text-2xl">{title}</CardTitle>
            <CardDescription className="text-[10px] sm:text-sm">{description}</CardDescription>
          </div>
        </CardHeader>
        {children}
      </Card>
    </div>
  )
}

function GoogleButton() {
  const [loading, setLoading] = useState(false)

  const handleGoogleSignIn = async (): Promise<void> => {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    setLoading(false)
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-9 sm:h-11 text-xs sm:text-base border-border hover:bg-muted/50"
      onClick={handleGoogleSignIn}
      disabled={loading}
    >
      {loading ? 'Connecting...' : 'Continue with Google'}
    </Button>
  )
}

function SignIn({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ password?: string }>({})
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErrors({ password: error.message })
      setLoading(false)
      return
    }
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-2.5 sm:space-y-4">
        {errors.password && (
          <Alert variant="destructive">
            <AlertDescription className="text-[10px] sm:text-sm">{errors.password}</AlertDescription>
          </Alert>
        )}
        <GoogleButton />
        <p className="text-center text-[10px] sm:text-xs text-muted-foreground">or continue with email</p>
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="email" className="text-[10px] sm:text-sm">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="h-8 sm:h-11 text-xs sm:text-sm"
            suppressHydrationWarning
          />
        </div>
        <div className="space-y-1 sm:space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-[10px] sm:text-sm">
              Password
            </Label>
            <Link href="/forgot" className="text-[9px] sm:text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="h-8 sm:h-11 pr-10 text-xs sm:text-sm"
              suppressHydrationWarning
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
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2.5 sm:space-y-4">
        <Button type="submit" className="w-full h-9 sm:h-11 text-xs sm:text-base" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
        <p className="text-[10px] sm:text-sm text-center text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link href="/sign-up" className="text-primary hover:underline font-medium">
            Sign up
          </Link>
        </p>
      </CardFooter>
    </form>
  )
}

function SignUp() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<{ email?: string }>({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setErrors({})
    setLoading(true)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } },
    })
    if (error) {
      setErrors({ email: error.message })
      setLoading(false)
      return
    }
    if (data.user) {
      await supabase.from('user_profiles').insert({ id: data.user.id, full_name: name, plan: 'free' })
    }
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-2.5 sm:space-y-4">
        {errors.email && (
          <Alert variant="destructive">
            <AlertDescription className="text-[10px] sm:text-sm">{errors.email}</AlertDescription>
          </Alert>
        )}
        {submitted && (
          <Alert>
            <AlertDescription className="text-[10px] sm:text-sm">Account created. Check your email to verify.</AlertDescription>
          </Alert>
        )}
        <GoogleButton />
        <p className="text-center text-[10px] sm:text-xs text-muted-foreground">or continue with email</p>
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="fullName" className="text-[10px] sm:text-sm">
            Full Name
          </Label>
          <Input
            id="fullName"
            type="text"
            placeholder="John Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
            className="h-8 sm:h-11 text-xs sm:text-sm"
          />
        </div>
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="email2" className="text-[10px] sm:text-sm">
            Email
          </Label>
          <Input
            id="email2"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            className="h-8 sm:h-11 text-xs sm:text-sm"
            suppressHydrationWarning
          />
        </div>
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="password2" className="text-[10px] sm:text-sm">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password2"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={loading}
              className="h-8 sm:h-11 pr-10 text-xs sm:text-sm"
              suppressHydrationWarning
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
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2.5 sm:space-y-4">
        <Button type="submit" className="w-full h-9 sm:h-11 text-xs sm:text-base" disabled={loading}>
          {loading ? 'Creating account...' : 'Sign up'}
        </Button>
        <p className="text-[9px] sm:text-xs text-center text-muted-foreground">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-primary hover:underline font-medium">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-primary hover:underline font-medium">
            Privacy Policy
          </Link>
          .
        </p>
        <p className="text-[10px] sm:text-sm text-center text-muted-foreground">
          Already have an account?{' '}
          <Link href="/sign-in" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </form>
  )
}

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError(null)
    setSent(false)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setSent(true)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-2.5 sm:space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="text-[10px] sm:text-sm">{error}</AlertDescription>
          </Alert>
        )}
        {sent && (
          <Alert>
            <AlertDescription className="text-[10px] sm:text-sm">Reset link sent. Check your inbox.</AlertDescription>
          </Alert>
        )}
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="forgotEmail" className="text-[10px] sm:text-sm">
            Email
          </Label>
          <Input
            id="forgotEmail"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading || sent}
            className="h-8 sm:h-11 text-xs sm:text-sm"
            suppressHydrationWarning
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2.5 sm:space-y-4">
        <Button type="submit" className="w-full h-9 sm:h-11 text-xs sm:text-base" disabled={loading || sent}>
          {loading ? 'Sending...' : sent ? 'Email sent' : 'Send reset link'}
        </Button>
        <p className="text-[10px] sm:text-sm text-center text-muted-foreground">
          Remember your password?{' '}
          <Link href="/sign-in" className="text-primary hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </form>
  )
}

function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ password?: string }>({})
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setErrors({})

    if (password !== confirmPassword) {
      setErrors({ password: 'Passwords do not match' })
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setErrors({ password: error.message })
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
    router.push('/sign-in')
  }

  return (
    <form onSubmit={handleSubmit}>
      <CardContent className="space-y-2.5 sm:space-y-4">
        {errors.password && (
          <Alert variant="destructive">
            <AlertDescription className="text-[10px] sm:text-sm">{errors.password}</AlertDescription>
          </Alert>
        )}
        {done && (
          <Alert>
            <AlertDescription className="text-[10px] sm:text-sm">Password updated successfully.</AlertDescription>
          </Alert>
        )}
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="newPassword" className="text-[10px] sm:text-sm">
            New Password
          </Label>
          <Input
            id="newPassword"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading || done}
            className="h-8 sm:h-11 text-xs sm:text-sm"
            suppressHydrationWarning
          />
        </div>
        <div className="space-y-1 sm:space-y-2">
          <Label htmlFor="confirmPassword" className="text-[10px] sm:text-sm">
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            disabled={loading || done}
            className="h-8 sm:h-11 text-xs sm:text-sm"
            suppressHydrationWarning
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2.5 sm:space-y-4">
        <Button type="submit" className="w-full h-9 sm:h-11 text-xs sm:text-base" disabled={loading || done}>
          {loading ? 'Updating...' : done ? 'Updated' : 'Update password'}
        </Button>
        <p className="text-[10px] sm:text-sm text-center text-muted-foreground">
          <Link href="/sign-in" className="text-primary hover:underline font-medium">
            Back to sign in
          </Link>
        </p>
      </CardFooter>
    </form>
  )
}

export default function AuthPages() {
  const pathname = usePathname()
  const router = useRouter()

  const mode = useMemo(() => {
    if (pathname.includes('/sign-up')) return 'sign-up'
    if (pathname.includes('/forgot')) return 'forgot'
    if (pathname.includes('/reset-password')) return 'reset-password'
    return 'sign-in'
  }, [pathname])

  const onSuccess = (): void => {
    router.push('/dashboard')
  }

  if (mode === 'sign-up') {
    return (
      <AuthShell title="Create an account" description="Enter your information to get started">
        <SignUp />
      </AuthShell>
    )
  }

  if (mode === 'forgot') {
    return (
      <AuthShell title="Reset password" description="Enter your email to receive a reset link">
        <ForgotPassword />
      </AuthShell>
    )
  }

  if (mode === 'reset-password') {
    return (
      <AuthShell title="Set a new password" description="Enter your new password below">
        <ResetPassword />
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Welcome back" description="Enter your credentials to access your account">
      <SignIn onSuccess={onSuccess} />
    </AuthShell>
  )
}
