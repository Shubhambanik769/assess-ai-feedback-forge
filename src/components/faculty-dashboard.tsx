import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  PlusCircle, 
  FileText, 
  Users, 
  Settings, 
  Upload,
  Eye,
  Signature
} from "lucide-react"
import { AssessmentGenerator } from "./assessment-generator"
import { AssignmentViewer } from "./assignment-viewer"
import { SubmissionListDialog } from "./submission-list-dialog"
import { useAssignments } from "@/hooks/useAssignments"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface AssessmentData {
  title: string
  description: string
  questions: any[]
  total_marks: number
  estimated_duration: string
  learning_objectives: string[]
}

export function FacultyDashboard() {
  const [activeTab, setActiveTab] = useState("create")
  const [currentAssessment, setCurrentAssessment] = useState<AssessmentData | null>(null)
  const [signatureFile, setSignatureFile] = useState<File | null>(null)
  const [isPublishing, setIsPublishing] = useState(false)
  const [selectedSubmissionForViewing, setSelectedSubmissionForViewing] = useState<any>(null)
  const { toast } = useToast()
  
  const {
    assignments,
    submissions,
    evaluations,
    loading,
    fetchAssignments
  } = useAssignments()

  const handleAssessmentGenerated = (assessment: AssessmentData) => {
    setCurrentAssessment(assessment)
  }

  const handlePublishAssessment = async () => {
    if (!currentAssessment) return

    setIsPublishing(true)
    try {
      const { data: template, error: templateError } = await supabase
        .from('assessment_templates')
        .insert({
          title: currentAssessment.title,
          description: currentAssessment.description,
          topic: currentAssessment.title,
          difficulty_level: 'medium',
          total_questions: currentAssessment.questions.length,
          created_by: crypto.randomUUID(),
          is_published: true
        })
        .select()
        .single()

      if (templateError) throw templateError

      const questionsToInsert = currentAssessment.questions.map(q => ({
        assessment_template_id: template.id,
        question_text: q.question_text,
        question_type: q.question_type,
        marks: q.marks,
        order_index: q.order_index
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsToInsert)

      if (questionsError) throw questionsError

      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert({
          title: currentAssessment.title,
          description: currentAssessment.description,
          max_score: currentAssessment.total_marks,
          total_marks: currentAssessment.total_marks,
          template_id: template.id,
          created_by: crypto.randomUUID()
        })

      if (assignmentError) throw assignmentError

      await fetchAssignments()
      
      toast({
        title: "Success",
        description: "Assessment published successfully!",
      })

      setActiveTab("assignments")
    } catch (error) {
      console.error('Error publishing assessment:', error)
      toast({
        title: "Error",
        description: "Failed to publish assessment",
        variant: "destructive"
      })
    } finally {
      setIsPublishing(false)
    }
  }

  const handleSignatureUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setSignatureFile(files[0])
      
      try {
        const fileExt = files[0].name.split('.').pop()
        const fileName = `signature-${Date.now()}.${fileExt}`
        const filePath = `signatures/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('signatures')
          .upload(filePath, files[0], {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw new Error(`Upload failed: ${uploadError.message}`)
        }

        const { data } = supabase.storage
          .from('signatures')
          .getPublicUrl(filePath)

        console.log('Signature uploaded successfully:', data.publicUrl)
        
        toast({
          title: "Success",
          description: "Signature uploaded successfully!",
        })
      } catch (error) {
        console.error('Error uploading signature:', error)
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to upload signature",
          variant: "destructive"
        })
      }
    }
  }

  const getSubmissionsForAssignment = (assignmentId: string) => {
    return submissions.filter(s => s.assignment_id === assignmentId)
  }

  const getGradedCount = (assignmentId: string) => {
    const assignmentSubmissions = getSubmissionsForAssignment(assignmentId)
    return assignmentSubmissions.filter(s => s.status === 'graded').length
  }

  const getUngradedCount = (assignmentId: string) => {
    const assignmentSubmissions = getSubmissionsForAssignment(assignmentId)
    return assignmentSubmissions.filter(s => s.status !== 'graded').length
  }

  const handleViewSubmission = (submission: any) => {
    setSelectedSubmissionForViewing(submission)
    setActiveTab("grading")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faculty Dashboard</h1>
          <p className="text-muted-foreground">Create and manage assessments</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept=".png,.jpg,.jpeg"
            onChange={handleSignatureUpload}
            className="hidden"
            id="signature-upload"
          />
          <label htmlFor="signature-upload">
            <Button variant="outline" size="sm" asChild>
              <span>
                <Signature className="w-4 h-4 mr-2" />
                Upload Signature
              </span>
            </Button>
          </label>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create">Create Assessment</TabsTrigger>
          <TabsTrigger value="assignments">My Assignments</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Create New Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AssessmentGenerator onAssessmentGenerated={handleAssessmentGenerated} />
              
              {currentAssessment && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{currentAssessment.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {currentAssessment.questions.length} questions • {currentAssessment.total_marks} total marks
                      </p>
                    </div>
                    <Button 
                      onClick={handlePublishAssessment}
                      disabled={isPublishing}
                    >
                      {isPublishing ? "Publishing..." : "Publish Assessment"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <div className="grid gap-4">
            {assignments.map((assignment) => {
              const submissionCount = getSubmissionsForAssignment(assignment.id).length
              const gradedCount = getGradedCount(assignment.id)
              const ungradedCount = getUngradedCount(assignment.id)
              const gradedSubmissions = getSubmissionsForAssignment(assignment.id).filter(s => s.status === 'graded')
              const ungradedSubmissions = getSubmissionsForAssignment(assignment.id).filter(s => s.status !== 'graded')
              
              return (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          {assignment.title}
                        </CardTitle>
                        {assignment.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {assignment.description}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline">
                        {assignment.max_score} marks
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {submissionCount} submissions
                        </span>
                        
                        <SubmissionListDialog
                          trigger={
                            <button className="flex items-center gap-1 hover:text-green-600 transition-colors">
                              <Eye className="w-4 h-4" />
                              {gradedCount} graded
                            </button>
                          }
                          title="Graded Submissions"
                          submissions={gradedSubmissions}
                          assignment={assignment}
                          onViewSubmission={handleViewSubmission}
                        />
                        
                        <SubmissionListDialog
                          trigger={
                            <button className="flex items-center gap-1 hover:text-orange-600 transition-colors">
                              <Eye className="w-4 h-4" />
                              {ungradedCount} ungraded
                            </button>
                          }
                          title="Ungraded Submissions"
                          submissions={ungradedSubmissions}
                          assignment={assignment}
                          onViewSubmission={handleViewSubmission}
                        />
                        
                        <span>
                          Created: {new Date(assignment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </Button>
                        <Button size="sm" onClick={() => setActiveTab("grading")}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Submissions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {assignments.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Assignments Created</h3>
                  <p className="text-muted-foreground">Create your first assessment to get started.</p>
                  <Button className="mt-4" onClick={() => setActiveTab("create")}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Assessment
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="grading">
          <AssignmentViewer />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Assignments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{assignments.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Total Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{submissions.length}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Graded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  {submissions.filter(s => s.status === 'graded').length}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {submissions.slice(0, 5).map((submission) => {
                  const assignment = assignments.find(a => a.id === submission.assignment_id)
                  return (
                    <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{submission.student_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Submitted "{assignment?.title}" on {new Date(submission.submission_date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={
                        submission.status === 'graded' ? 'default' :
                        submission.status === 'evaluating' ? 'secondary' : 'outline'
                      }>
                        {submission.status}
                      </Badge>
                    </div>
                  )
                })}
                
                {submissions.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No submissions yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
