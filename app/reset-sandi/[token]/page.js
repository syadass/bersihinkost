import ResetPassword from '@/components/auth/reset-password'

export default function ResetPasswordPage({ params }) {
  return <ResetPassword token={params.token} />
}
