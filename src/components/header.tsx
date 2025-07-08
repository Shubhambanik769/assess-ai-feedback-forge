import { Bell, Settings, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="w-4 h-4" />
          Notification
        </Button>
        
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          Action Center
        </Button>
        
        <div className="text-sm">
          <span className="text-muted-foreground">Admission Year:</span>
          <span className="font-medium ml-1">2025</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="/placeholder-avatar.jpg" />
                <AvatarFallback>SB</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-sm font-medium">Shubham Banik</div>
                <div className="text-xs text-muted-foreground">Reporting to</div>
                <div className="text-xs">Neha Gupta</div>
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}