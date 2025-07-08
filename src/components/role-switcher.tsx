import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { GraduationCap, Users } from "lucide-react"

interface RoleSwitcherProps {
  currentRole: 'faculty' | 'student'
  onRoleChange: (role: 'faculty' | 'student') => void
}

export function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="flex items-center space-x-4 p-4 bg-card rounded-lg border">
      <div className="flex items-center space-x-2">
        <Users className="w-4 h-4" />
        <Label htmlFor="role-switch">Student View</Label>
      </div>
      
      <Switch
        id="role-switch"
        checked={currentRole === 'faculty'}
        onCheckedChange={(checked) => onRoleChange(checked ? 'faculty' : 'student')}
      />
      
      <div className="flex items-center space-x-2">
        <GraduationCap className="w-4 h-4" />
        <Label htmlFor="role-switch">Faculty View</Label>
      </div>
      
      <div className="ml-4 text-sm text-muted-foreground">
        Current: <span className="font-medium capitalize">{currentRole}</span>
      </div>
    </div>
  )
}