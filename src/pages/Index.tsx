import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { AssignmentViewer } from "@/components/assignment-viewer"

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <AssignmentViewer />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
