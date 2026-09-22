import { QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import GeneralError from '@/features/errors/general-error'
import NotFoundError from '@/features/errors/not-found-error'
import { useAuthStore } from '@/stores/authStore'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

// Loading component for initial auth check
function InitialLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  )
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: function RootRouteComponent() {
    const [isLoading, setIsLoading] = useState(true)
    const accessToken = useAuthStore((s) => s.auth.accessToken)

    // Add a small delay to ensure auth state is stable
    useEffect(() => {
      const timer = setTimeout(() => {
        setIsLoading(false)
      }, 100)
      return () => clearTimeout(timer)
    }, [])

    // Show loading state while checking auth
    if (isLoading) {
      return <InitialLoading />
    }

    // Public auth routes render their own matched route. Protected routes
    // redirect through their route guard when no access token is present.
    if (!accessToken) {
      return (
        <>
          <NavigationProgress />
          <Outlet />
          <Toaster duration={1000} />
        </>
      )
    }

    // Show the app if authenticated
    return (
      <>
        <NavigationProgress />
        <Outlet />
        <Toaster duration={1000} />
      </>
    )
  },
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
