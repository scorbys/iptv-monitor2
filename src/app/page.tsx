import { redirect } from 'next/navigation'

export default function Layout() {
  redirect('/dashboard')
  return null
}
