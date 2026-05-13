import { redirect } from 'next/navigation'

// Unknown dynamic segments (e.g. invalid /jobs/[id]) still reach the App Router 404 boundary.
export default function NotFound() {
  redirect('/')
}
