import { useState } from "react"
import { 
  Home, 
  BarChart3, 
  Users, 
  GraduationCap,
  Calendar,
  Clock,
  BookOpen,
  Award,
  FileText,
  Settings,
  UserCheck,
  ChevronDown,
  ChevronRight,
  Building
} from "lucide-react"
import { NavLink, useLocation } from "react-router-dom"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const menuItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { 
    title: "Student Manager", 
    icon: Users,
    subItems: [
      { title: "All Students", url: "/students" },
      { title: "Resume Assignment", url: "/resume-assignment" },
    ]
  },
  { 
    title: "Academic Operations", 
    icon: GraduationCap,
    subItems: [
      { title: "Pending Interviews", url: "/pending-interviews" },
      { title: "Academics Management", url: "/academics-management" },
      { title: "Exam Management", url: "/exam-management" },
      { title: "Faculty Scheduler", url: "/faculty-scheduler" },
      { title: "Attendance", url: "/attendance" },
    ]
  },
  { title: "Admissions", url: "/admissions", icon: Building },
  { title: "Career Success", url: "/career", icon: Award },
]

export function AppSidebar() {
  const { state } = useSidebar()
  const collapsed = state === "collapsed"
  const location = useLocation()
  const currentPath = location.pathname
  const [openGroups, setOpenGroups] = useState<string[]>(["Student Manager", "Academic Operations"])

  const isActive = (path: string) => currentPath === path
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => 
      prev.includes(groupTitle) 
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    )
  }

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarContent className="bg-sidebar">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-sidebar-primary rounded flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-sidebar-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg text-sidebar-foreground">SUNSTONE</span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    <Collapsible
                      open={openGroups.includes(item.title)}
                      onOpenChange={() => toggleGroup(item.title)}
                    >
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full justify-between hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                          <div className="flex items-center gap-3">
                            <item.icon className="w-4 h-4" />
                            {!collapsed && <span>{item.title}</span>}
                          </div>
                          {!collapsed && (
                            openGroups.includes(item.title) ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {!collapsed && (
                        <CollapsibleContent>
                          <div className="ml-4 space-y-1">
                            {item.subItems.map((subItem) => (
                              <SidebarMenuButton key={subItem.title} asChild size="sm">
                                <NavLink 
                                  to={subItem.url} 
                                  className={getNavCls({ isActive: isActive(subItem.url) })}
                                >
                                  <span className="ml-3">{subItem.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            ))}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  ) : (
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={getNavCls({ isActive: isActive(item.url) })}
                      >
                        <item.icon className="w-4 h-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}