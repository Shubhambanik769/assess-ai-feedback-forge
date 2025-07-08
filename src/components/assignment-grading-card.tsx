import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  FileText, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Bot, 
  User, 
  CheckCircle, 
  Loader2,
  Eye,
  GraduationCap
} from "lucide-react"
import { useAssignments, type Assignment, type Submission, type Evaluation } from "@/hooks/useAssignments"
import { useToast } from "@/hooks/use-toast"

interface AssignmentGradingCardProps {
  assignment: Assignment
  submissions: Submission[]
  onGradeSubmission?: (submissionId: string) => void
}

export function AssignmentGradingCard({ assignment, submissions, onGradeSubmission }: AssignmentGradingCardProps) {
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null)
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null)
  const [grade, setGrade] = useState("")
  const [remarks, setRemarks] = useState("")
  const [zoom, setZoom] = useState(100)
  const [isGradingOpen, setIsGradingOpen] = useState(false)
  const { toast } = useToast()
  
  const {
    evaluations,
    loading,
    fetchEvaluations,
    evaluateWithAI,
    createManualEvaluation,
    publishEvaluation
  } = useAssignments()

  const gradedSubmissions = submissions.filter(s => s.status === 'graded')
  const ungradedSubmissions = submissions.filter(s => s.status !== 'graded')

  useEffect(() => {
    if (selectedSubmission) {
      fetchEvaluations(selectedSubmission.id)
    }
  }, [selectedSubmission])

  useEffect(() => {
    if (evaluations.length > 0 && selectedSubmission) {
      const evaluation = evaluations.find(e => e.submission_id === selectedSubmission.id)
      if (evaluation) {
        setCurrentEvaluation(evaluation)
        setGrade(evaluation.score.toString())
        setRemarks(evaluation.manual_remarks || "")
      }
    }
  }, [evaluations, selectedSubmission])

  const handleAIAssessment = async () => {
    if (!selectedSubmission) {
      toast({
        title: "Error",
        description: "No submission selected for evaluation.",
        variant: "destructive"
      })
      return
    }

    try {
      const evaluation = await evaluateWithAI(selectedSubmission.id, assignment.title)
      setCurrentEvaluation(evaluation)
    } catch (error) {
      console.error('AI evaluation error:', error)
    }
  }

  const handleManualSubmit = async () => {
    if (!selectedSubmission || !grade) {
      toast({
        title: "Error",
        description: "Please enter a grade.",
        variant: "destructive"
      })
      return
    }

    try {
      const evaluation = await createManualEvaluation(
        selectedSubmission.id,
        parseInt(grade),
        assignment.max_score,
        remarks
      )
      setCurrentEvaluation(evaluation)
      onGradeSubmission?.(selectedSubmission.id)
    } catch (error) {
      console.error('Manual evaluation error:', error)
    }
  }

  const handlePublishFeedback = async () => {
    if (!currentEvaluation) {
      toast({
        title: "Error",
        description: "No evaluation to publish.",
        variant: "destructive"
      })
      return
    }

    try {
      await publishEvaluation(currentEvaluation.id)
    } catch (error) {
      console.error('Publish error:', error)
    }
  }

  const openGradingDialog = (submission: Submission) => {
    setSelectedSubmission(submission)
    setCurrentEvaluation(null)
    setGrade("")
    setRemarks("")
    setIsGradingOpen(true)
  }

  return (
    <Card>
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
        <div className="space-y-4">
          {/* Statistics */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {submissions.length} submissions
            </span>
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              {gradedSubmissions.length} graded
            </span>
            <span className="flex items-center gap-1 text-orange-600">
              <Eye className="w-4 h-4" />
              {ungradedSubmissions.length} pending
            </span>
          </div>

          {/* Submissions List */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Submissions to Grade</h4>
            
            {ungradedSubmissions.length > 0 ? (
              <div className="space-y-2">
                {ungradedSubmissions.slice(0, 3).map((submission) => (
                  <div key={submission.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <div>
                        <p className="text-sm font-medium">{submission.student_name || "Anonymous"}</p>
                        <p className="text-xs text-muted-foreground">
                          Submitted {new Date(submission.submission_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Dialog open={isGradingOpen} onOpenChange={setIsGradingOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" onClick={() => openGradingDialog(submission)}>
                          <GraduationCap className="w-4 h-4 mr-2" />
                          Grade
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden">
                        <DialogHeader>
                          <DialogTitle>Grade Assignment - {selectedSubmission?.student_name}</DialogTitle>
                        </DialogHeader>
                        
                        <div className="flex h-[80vh] gap-4">
                          {/* PDF Viewer */}
                          <div className="flex-1 bg-gray-100 rounded-lg overflow-hidden">
                            <div className="bg-white h-full flex flex-col">
                              {/* Viewer Controls */}
                              <div className="flex items-center justify-between p-4 border-b">
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm">
                                    <ChevronLeft className="w-4 h-4" />
                                  </Button>
                                  <span className="text-sm">1 / 1</span>
                                  <Button variant="outline" size="sm">
                                    <ChevronRight className="w-4 h-4" />
                                  </Button>
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(50, zoom - 25))}>
                                    <ZoomOut className="w-4 h-4" />
                                  </Button>
                                  <span className="text-sm min-w-[3rem] text-center">{zoom}%</span>
                                  <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(200, zoom + 25))}>
                                    <ZoomIn className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>

                              {/* Document Display */}
                              <div className="flex-1 overflow-auto p-4">
                                <div className="max-w-2xl mx-auto">
                                  {selectedSubmission?.file_path ? (
                                    selectedSubmission.file_type === 'application/pdf' ? (
                                      <iframe
                                        src={`${selectedSubmission.file_path}#toolbar=0&navpanes=0&scrollbar=0`}
                                        className="w-full h-[600px] border rounded-lg shadow-lg"
                                        title={selectedSubmission.file_name || 'PDF Document'}
                                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                                      />
                                    ) : (
                                      <img 
                                        src={selectedSubmission.file_path} 
                                        alt={selectedSubmission.file_name || `Assignment submission`}
                                        className="w-full shadow-lg rounded border"
                                        style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                                        onError={(e) => {
                                          console.error('Image failed to load:', selectedSubmission.file_path)
                                          e.currentTarget.style.display = 'none'
                                          const container = e.currentTarget.parentElement
                                          if (container && !container.querySelector('.error-message')) {
                                            const errorDiv = document.createElement('div')
                                            errorDiv.className = 'error-message w-full h-96 border-2 border-dashed border-red-300 rounded-lg flex items-center justify-center'
                                            errorDiv.innerHTML = `
                                              <div class="text-center">
                                                <div class="text-red-500 mb-2">⚠️</div>
                                                <p class="text-red-600 text-sm">Unable to preview this file</p>
                                                <p class="text-red-500 text-xs mt-1">${selectedSubmission.file_name}</p>
                                              </div>
                                            `
                                            container.appendChild(errorDiv)
                                          }
                                        }}
                                      />
                                    )
                                  ) : (
                                    <div className="w-full h-96 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                                      <div className="text-center">
                                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                                        <p className="text-muted-foreground">No file available for preview</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Grading Panel */}
                          <div className="w-80 border-l bg-card p-6">
                            <Tabs defaultValue="grade" className="w-full">
                              <TabsList className="grid w-full grid-cols-1">
                                <TabsTrigger value="grade">Grade Assignment</TabsTrigger>
                              </TabsList>

                              <TabsContent value="grade" className="space-y-4">
                                <div className="space-y-4">
                                  <div className="border-t pt-4">
                                    <h3 className="font-medium mb-4">Grade</h3>
                                    <div className="space-y-4">
                                      <div>
                                        <label className="text-sm text-muted-foreground mb-2 block">
                                          {assignment.title}
                                        </label>
                                        <div className="flex items-center gap-2">
                                          <input
                                            type="number"
                                            value={grade}
                                            onChange={(e) => setGrade(e.target.value)}
                                            className="w-16 h-12 text-xl font-bold text-center border rounded"
                                            max={assignment.max_score}
                                            min="0"
                                            disabled={currentEvaluation?.evaluation_type === 'ai'}
                                          />
                                          <span className="text-xl font-bold">/{assignment.max_score}</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Value between 0 to {assignment.max_score} is allowed
                                        </p>
                                      </div>

                                      <div className="space-y-3">
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="w-full justify-start"
                                          onClick={handleAIAssessment}
                                          disabled={loading || selectedSubmission?.status === 'evaluating'}
                                        >
                                          {loading || selectedSubmission?.status === 'evaluating' ? (
                                            <>
                                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                              AI Checking...
                                            </>
                                          ) : (
                                            <>
                                              <Bot className="w-4 h-4 mr-2" />
                                              AI Check
                                            </>
                                          )}
                                        </Button>
                                      </div>

                                      <div>
                                        <label className="text-sm font-medium mb-2 block">Add Remarks</label>
                                        <Textarea
                                          value={remarks}
                                          onChange={(e) => setRemarks(e.target.value)}
                                          placeholder="Add your remarks here..."
                                          className="min-h-[100px]"
                                          disabled={currentEvaluation?.evaluation_type === 'ai'}
                                        />
                                      </div>

                                      {currentEvaluation?.ai_feedback && (
                                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                                          <div className="flex items-center gap-2 mb-2">
                                            <Bot className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-900">AI Feedback</span>
                                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                              {Math.round((currentEvaluation.score / currentEvaluation.max_score) * 100)}%
                                            </Badge>
                                          </div>
                                          <div className="text-xs text-blue-800 space-y-2 max-h-40 overflow-y-auto">
                                            {currentEvaluation.ai_feedback.detailed_feedback && (
                                              <div>
                                                <strong>Assessment:</strong>
                                                <p className="mt-1">{currentEvaluation.ai_feedback.detailed_feedback}</p>
                                              </div>
                                            )}
                                          </div>
                                          <div className="mt-3 flex gap-2">
                                            <Button 
                                              size="sm" 
                                              variant="outline" 
                                              className="text-xs"
                                              onClick={() => setRemarks(currentEvaluation.ai_feedback.detailed_feedback || "")}
                                            >
                                              Use as Remarks
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              className="text-xs"
                                              onClick={handlePublishFeedback}
                                              disabled={currentEvaluation.is_published}
                                            >
                                              {currentEvaluation.is_published ? 'Published' : 'Publish'}
                                            </Button>
                                          </div>
                                        </div>
                                      )}

                                      <Button 
                                        onClick={handleManualSubmit} 
                                        className="w-full"
                                        disabled={!grade || loading}
                                      >
                                        {loading ? (
                                          <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Submitting...
                                          </>
                                        ) : (
                                          currentEvaluation ? 'Update Grade' : 'Submit Grade'
                                        )}
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </TabsContent>
                            </Tabs>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
                
                {ungradedSubmissions.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{ungradedSubmissions.length - 3} more submissions to grade
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                All submissions have been graded
              </p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button variant="outline" size="sm" className="flex-1">
              View All ({submissions.length})
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              Export Grades
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}