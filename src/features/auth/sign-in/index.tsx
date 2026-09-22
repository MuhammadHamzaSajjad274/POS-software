import {
  Card,
  CardContent,
  CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import AuthLayout from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'
import { Link } from '@tanstack/react-router'

export default function SignIn() {
  return (
    <AuthLayout>
      <Card className='gap-3 sm:gap-4 w-full max-w-full'>
        <CardHeader className='!space-y-0'>
          <CardTitle className='text-base sm:text-lg tracking-tight'>Login Details</CardTitle>
          <CardDescription className='text-sm'>
            Enter your email and password to login to your account <br className='hidden sm:block' />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm />
          <p className='text-muted-foreground mt-4 text-center text-sm'>
            Don&apos;t have an account?{' '}
            <Link to='/sign-up' className='text-primary font-medium hover:underline'>
              Sign up
            </Link>
          </p>
        </CardContent>
        {/* <CardFooter>
          <p className='text-muted-foreground px-4 pb-2 sm:px-8 text-center text-xs sm:text-sm'>
            By clicking login, you agree to our{' '}
            <a
              href='/terms'
              className='hover:text-primary underline underline-offset-4'
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a
              href='/privacy'
              className='hover:text-primary underline underline-offset-4'
            >
              Privacy Policy
            </a>
            .
          </p>
        </CardFooter> */}
      </Card>
    </AuthLayout>
  )
}


