import { useState } from "react"
import { RoleSwitcher } from "@/components/role-switcher"
import { FacultyDashboard } from "@/components/faculty-dashboard"
import { StudentDashboard } from "@/components/student-dashboard"

const Index = () => {
  const [currentRole, setCurrentRole] = useState<'faculty' | 'student'>('faculty')

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 space-y-6">
        <RoleSwitcher currentRole={currentRole} onRoleChange={setCurrentRole} />
        
        {currentRole === 'faculty' ? (
          <FacultyDashboard />
        ) : (
          <StudentDashboard />
        )}
      </div>
    </div>
  );
};

export default Index;
