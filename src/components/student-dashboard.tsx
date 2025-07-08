import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Upload, FileText, Clock, Award, Download } from "lucide-react"
import { useAssignments } from "@/hooks/useAssignments"
import { useToast } from "@/hooks/use-toast"

export function StudentDashboard() {
  const [studentName, setStudentName] = useState("John Doe")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const { toast } = useToast()
  
  const {
    assignments,
    submissions,
    evaluations,
    loading,
    fetchSubmissions,
    fetchEvaluations,
    createSubmission
  } = useAssignments()

  // Get published assignments
  const availableAssignments = assignments.filter(a => a.max_score > 0)
  
  // Get student's submissions
  const mySubmissions = submissions.filter(s => s.student_name === studentName)
  
  // Get evaluations for student's submissions
  const myEvaluations = evaluations.filter(e => 
    mySubmissions.some(s => s.id === e.submission_id)
  )

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, assignmentId: string) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setSelectedFile(files[0])
      uploadSubmission(assignmentId, files[0])
    }
  }

  const uploadSubmission = async (assignmentId: string, file: File) => {
    try {
      await createSubmission(assignmentId, studentName, file)
      setSelectedFile(null)
    } catch (error) {
      console.error('Upload error:', error)
    }
  }

  const getSubmissionForAssignment = (assignmentId: string) => {
    return mySubmissions.find(s => s.assignment_id === assignmentId)
  }

  const getEvaluationForSubmission = (submissionId: string) => {
    return myEvaluations.find(e => e.submission_id === submissionId && e.is_published)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {studentName}</p>
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="student-name">Your Name:</Label>
          <Input
            id="student-name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      <Tabs defaultValue="assignments" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="assignments">Available Assignments</TabsTrigger>
          <TabsTrigger value="submissions">My Submissions</TabsTrigger>
          <TabsTrigger value="results">Results & Feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="space-y-4">
          <div className="grid gap-4">
            {availableAssignments.map((assignment) => {
              const submission = getSubmissionForAssignment(assignment.id)
              return (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="w-5 h-5" />
                          {assignment.title}
                        </CardTitle>
                        {assignment.description && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {assignment.description}
                          </p>
                        )}
                      </div>
                      <Badge variant={submission ? "default" : "secondary"}>
                        {submission ? "Submitted" : "Not Submitted"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Award className="w-4 h-4" />
                          {assignment.max_score} marks
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          Due: {new Date(assignment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {!submission ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                            onChange={(e) => handleFileUpload(e, assignment.id)}
                            className="hidden"
                            id={`file-upload-${assignment.id}`}
                          />
                          <label htmlFor={`file-upload-${assignment.id}`}>
                            <Button variant="outline" size="sm" asChild>
                              <span>
                                <Upload className="w-4 h-4 mr-2" />
                                Submit Assignment
                              </span>
                            </Button>
                          </label>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-green-600">
                          Submitted on {new Date(submission.submission_date).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {availableAssignments.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Assignments Available</h3>
                  <p className="text-muted-foreground">Check back later for new assignments from your faculty.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="submissions" className="space-y-4">
          <div className="grid gap-4">
            {mySubmissions.map((submission) => {
              const assignment = assignments.find(a => a.id === submission.assignment_id)
              return (
                <Card key={submission.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      {assignment?.title || "Assignment"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Submitted: {new Date(submission.submission_date).toLocaleDateString()}
                        </p>
                        <p className="text-sm">File: {submission.file_name}</p>
                      </div>
                      <Badge variant={
                        submission.status === 'graded' ? 'default' :
                        submission.status === 'evaluating' ? 'secondary' : 'outline'
                      }>
                        {submission.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {mySubmissions.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Submissions Yet</h3>
                  <p className="text-muted-foreground">Submit your first assignment to see it here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid gap-4">
            {myEvaluations.map((evaluation) => {
              const submission = mySubmissions.find(s => s.id === evaluation.submission_id)
              const assignment = assignments.find(a => a.id === submission?.assignment_id)
              
              return (
                <Card key={evaluation.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        {assignment?.title || "Assignment"}
                      </CardTitle>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {evaluation.score}/{evaluation.max_score}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round((evaluation.score / evaluation.max_score) * 100)}%
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {evaluation.ai_feedback && (
                      <div className="space-y-3">
                        {evaluation.ai_feedback.strengths && (
                          <div>
                            <h4 className="font-semibold text-green-700 mb-2">Strengths:</h4>
                            <ul className="list-disc ml-6 space-y-1">
                              {evaluation.ai_feedback.strengths.map((strength: string, i: number) => (
                                <li key={i} className="text-sm">{strength}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {evaluation.ai_feedback.improvements && (
                          <div>
                            <h4 className="font-semibold text-orange-700 mb-2">Areas for Improvement:</h4>
                            <ul className="list-disc ml-6 space-y-1">
                              {evaluation.ai_feedback.improvements.map((improvement: string, i: number) => (
                                <li key={i} className="text-sm">{improvement}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {evaluation.ai_feedback.detailed_feedback && (
                          <div>
                            <h4 className="font-semibold mb-2">Detailed Feedback:</h4>
                            <p className="text-sm bg-muted p-3 rounded-lg">
                              {evaluation.ai_feedback.detailed_feedback}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {evaluation.manual_remarks && (
                      <div>
                        <h4 className="font-semibold mb-2">Faculty Remarks:</h4>
                        <p className="text-sm bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                          {evaluation.manual_remarks}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Graded on: {new Date(evaluation.created_at).toLocaleDateString()}
                      </p>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Download Report
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
            
            {myEvaluations.length === 0 && (
              <Card>
                <CardContent className="text-center py-8">
                  <Award className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-semibold mb-2">No Results Available</h3>
                  <p className="text-muted-foreground">Your graded assignments will appear here once faculty has evaluated them.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}