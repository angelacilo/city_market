import ForgotPasswordFlow from '@/components/auth/ForgotPasswordFlow'

export const metadata = {
  title: 'Reset Password - Butuan Market IS',
  description:
    'Verify your identity with a code sent to your email to reset your vendor account password.',
}

export default function ForgotPasswordPage() {
  return <ForgotPasswordFlow />
}
