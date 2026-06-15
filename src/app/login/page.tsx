'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LoginComponent } from "@/components/LoginComponent"
import { RegisterComponent } from "@/components/RegisterComponent"

export default function LoginOrRegisterPage() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()

  // If the user already has a valid session, send them to /dashboard.
  // Route protection in this app is client-side (the root middleware.js is not
  // executed under the src/ app structure), so the login page guards itself.
  useEffect(() => {
    let cancelled = false
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("authToken") || localStorage.getItem("token")
        : null

    if (!token) {
      setCheckingSession(false)
      return
    }

    fetch("/api/auth/verify", {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return
        if (data?.success && data?.user) {
          router.replace("/dashboard")
        } else {
          setCheckingSession(false)
        }
      })
      .catch(() => {
        if (!cancelled) setCheckingSession(false)
      })

    return () => {
      cancelled = true
    }
  }, [router])

  // Avoid flashing the login form while we decide whether to redirect.
  if (checkingSession) return null

  return (
    <>
      {isRegistering ? (
        <RegisterComponent onSwitchToLogin={() => setIsRegistering(false)} />
      ) : (
        <LoginComponent onSwitchToRegister={() => setIsRegistering(true)} />
      )}
    </>
  )
}
