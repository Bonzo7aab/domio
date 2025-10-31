'use client'

import { LogOut } from 'lucide-react'
import { logoutAction } from '../lib/auth/actions'
import { DropdownMenuItem } from './ui/dropdown-menu'

export function LogoutButton() {
  const handleLogout = async () => {
    await logoutAction()
  }

  return (
    <DropdownMenuItem onClick={handleLogout}>
      <LogOut className="mr-2 h-4 w-4" />
      <span>Wyloguj się</span>
    </DropdownMenuItem>
  )
}

