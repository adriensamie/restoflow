import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#04080f' }}>
      <SignUp />
    </div>
  )
}
