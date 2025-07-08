import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookOpen, Upload, FileText, Clock, Award, Download, Bot, CheckCircle, TrendingUp } from "lucide-react"
import { useAssignments } from "@/hooks/useAssignments"
import { useToast } from "@/hooks/use-toast"

export function StudentDashboard() {
  const [studentName, setStudentName] = useState("")
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
                  <CardContent className="space-y-6">
                    {/* Grade Performance Summary */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                          <TrendingUp className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-blue-900">Performance Overview</h3>
                          <p className="text-sm text-blue-700">
                            You scored {Math.round((evaluation.score / evaluation.max_score) * 100)}% on this assignment
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white p-3 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{evaluation.score}</div>
                          <div className="text-xs text-gray-600">Points Earned</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="text-2xl font-bold text-gray-800">{evaluation.max_score}</div>
                          <div className="text-xs text-gray-600">Total Points</div>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round((evaluation.score / evaluation.max_score) * 100)}%
                          </div>
                          <div className="text-xs text-gray-600">Grade</div>
                        </div>
                      </div>
                    </div>

                    {evaluation.ai_feedback && (
                      <div className="space-y-4">
                        {/* AI Assessment Header */}
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200">
                          <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                            <Bot className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-purple-900">AI Assessment Report</h3>
                            <p className="text-sm text-purple-700">
                              Detailed analysis of your submission with personalized feedback
                            </p>
                          </div>
                        </div>

                        {/* Why This Grade Section */}
                        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                          <h4 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            Why You Received This Grade
                          </h4>
                          <p className="text-sm text-amber-800 leading-relaxed">
                            Your grade of {Math.round((evaluation.score / evaluation.max_score) * 100)}% reflects the AI's comprehensive 
                            evaluation of your work based on content accuracy, depth of understanding, presentation quality, 
                            and adherence to assignment requirements. The assessment considers both your demonstrated knowledge 
                            and areas where further development would benefit your learning.
                          </p>
                        </div>

                        {/* Detailed Feedback */}
                        {evaluation.ai_feedback.detailed_feedback && (
                          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <FileText className="w-5 h-5 text-blue-500" />
                              Overall Assessment
                            </h4>
                            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg">
                              {evaluation.ai_feedback.detailed_feedback}
                            </p>
                          </div>
                        )}

                        {/* Strengths */}
                        {evaluation.ai_feedback.strengths && (
                          <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                            <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              What You Did Well
                            </h4>
                            <div className="space-y-2">
                              {evaluation.ai_feedback.strengths.map((strength: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 bg-white p-3 rounded-lg">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm text-green-800">{strength}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Areas for Improvement */}
                        {evaluation.ai_feedback.improvements && (
                          <div className="bg-orange-50 p-4 rounded-xl border border-orange-200">
                            <h4 className="font-semibold text-orange-900 mb-3 flex items-center gap-2">
                              <TrendingUp className="w-5 h-5 text-orange-600" />
                              Growth Opportunities
                            </h4>
                            <div className="space-y-2">
                              {evaluation.ai_feedback.improvements.map((improvement: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 bg-white p-3 rounded-lg">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-sm text-orange-800">{improvement}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Learning Tips */}
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                          <h4 className="font-semibold text-blue-900 mb-2">💡 Learning Tips</h4>
                          <p className="text-sm text-blue-800">
                            Review the feedback above and focus on the improvement areas for your next assignment. 
                            Consider discussing any questions with your faculty during office hours.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {evaluation.manual_remarks && (
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
                        <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
                          <Award className="w-5 h-5 text-indigo-600" />
                          Faculty Comments
                        </h4>
                        <p className="text-sm text-indigo-800 bg-white p-3 rounded-lg border-l-4 border-indigo-400">
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