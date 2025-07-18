'use client'

import { useState } from "react"
import { LoginComponent } from "@/components/LoginComponent"
import { RegisterComponent } from "@/components/RegisterComponent"

export default function LoginOrRegisterPage() {
  const [isRegistering, setIsRegistering] = useState(false)

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
