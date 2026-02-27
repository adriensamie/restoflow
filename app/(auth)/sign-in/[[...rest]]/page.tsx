import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#04080f' }}>
      <SignIn signUpUrl="/sign-up" afterSignInUrl="/dashboard" />
    </div>
  )
}
