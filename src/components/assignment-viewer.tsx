import { useState, useEffect } from "react"
import { 
  Upload, 
  FileText, 
  Download, 
  RotateCcw, 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight,
  Bot,
  User,
  CheckCircle,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useAssignments, type Assignment, type Submission, type Evaluation } from "@/hooks/useAssignments"

// Removed mock pages - will use actual submission files

export function AssignmentViewer() {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [grade, setGrade] = useState("")
  const [remarks, setRemarks] = useState("")
  const [assessmentMode, setAssessmentMode] = useState("manual")
  const [studentName, setStudentName] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentSubmission, setCurrentSubmission] = useState<Submission | null>(null)
  const [currentEvaluation, setCurrentEvaluation] = useState<Evaluation | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const { toast } = useToast()
  
  const {
    assignments,
    submissions,
    evaluations,
    loading,
    fetchSubmissions,
    fetchEvaluations,
    createSubmission,
    evaluateWithAI,
    createManualEvaluation,
    publishEvaluation
  } = useAssignments()

  const currentAssignment = assignments[0] // Use first assignment for demo
  const totalPages = 1 // Will be determined by actual submission files

  useEffect(() => {
    if (currentAssignment) {
      fetchSubmissions(currentAssignment.id)
    }
  }, [currentAssignment])

  useEffect(() => {
    if (currentSubmission) {
      fetchEvaluations(currentSubmission.id)
    }
  }, [currentSubmission])

  useEffect(() => {
    if (submissions.length > 0 && !currentSubmission) {
      setCurrentSubmission(submissions[0])
    }
  }, [submissions])

  useEffect(() => {
    if (evaluations.length > 0 && currentSubmission) {
      const evaluation = evaluations.find(e => e.submission_id === currentSubmission.id)
      if (evaluation) {
        setCurrentEvaluation(evaluation)
        setGrade(evaluation.score.toString())
        setRemarks(evaluation.manual_remarks || "")
      }
    }
  }, [evaluations, currentSubmission])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0 && currentAssignment) {
      setSelectedFile(files[0])
      toast({
        title: "File Selected",
        description: `${files[0].name} selected for upload.`,
      })
    }
  }

  const handleUploadSubmission = async () => {
    if (!selectedFile || !currentAssignment || !studentName.trim()) {
      toast({
        title: "Error",
        description: "Please select a file and enter student name.",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)
    try {
      const submission = await createSubmission(currentAssignment.id, studentName, selectedFile)
      setCurrentSubmission(submission)
      setSelectedFile(null)
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleAIAssessment = async () => {
    if (!currentSubmission || !currentAssignment) {
      toast({
        title: "Error",
        description: "No submission selected for evaluation.",
        variant: "destructive"
      })
      return
    }

    try {
      const evaluation = await evaluateWithAI(currentSubmission.id, currentAssignment.title)
      setCurrentEvaluation(evaluation)
    } catch (error) {
      console.error('AI evaluation error:', error)
    }
  }

  const handleManualSubmit = async () => {
    if (!currentSubmission || !grade || !currentAssignment) {
      toast({
        title: "Error",
        description: "Please enter a grade.",
        variant: "destructive"
      })
      return
    }

    try {
      const evaluation = await createManualEvaluation(
        currentSubmission.id,
        parseInt(grade),
        currentAssignment.max_score,
        remarks
      )
      setCurrentEvaluation(evaluation)
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

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Assignment Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">
                {currentAssignment?.title || "Assignment"}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>{currentSubmission?.student_name || studentName}</span>
                <span>{submissions.length > 0 ? `${submissions.findIndex(s => s.id === currentSubmission?.id) + 1}/${submissions.length}` : "0/0"}</span>
                {currentSubmission && (
                  <Badge variant={
                    currentSubmission.status === 'graded' ? 'default' :
                    currentSubmission.status === 'evaluating' ? 'secondary' : 'outline'
                  }>
                    {currentSubmission.status}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </div>

        {/* Document Viewer */}
        <div className="flex-1 flex">
          {/* PDF Viewer Area */}
          <div className="flex-1 bg-gray-100 p-4">
            <div className="bg-white rounded-lg shadow-sm h-full flex flex-col">
              {/* Viewer Controls */}
              <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">{currentPage} / {totalPages}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
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
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Document Display */}
              <div className="flex-1 overflow-auto p-4">
                <div className="max-w-2xl mx-auto">
                  {currentSubmission?.file_path ? (
                    <img 
                      src={currentSubmission.file_path} 
                      alt={currentSubmission.file_name || `Page ${currentPage}`}
                      className="w-full shadow-lg rounded"
                      style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                    />
                  ) : (
                    <div className="w-full h-96 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground">No submission uploaded yet</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Page thumbnails - removed as no mock pages */}
            </div>
          </div>

          {/* Grading Panel */}
          <div className="w-80 border-l bg-card p-6">
            <Tabs defaultValue="grade" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grade">Grade</TabsTrigger>
                <TabsTrigger value="upload">Upload</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Upload Assignment</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="student-name">Student Name</Label>
                      <Input
                        id="student-name"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="Enter student name"
                      />
                    </div>

                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload handwritten, Word, or PDF files
                      </p>
                      {selectedFile && (
                        <div className="mb-2 p-2 bg-muted rounded text-sm">
                          Selected: {selectedFile.name}
                        </div>
                      )}
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" size="sm" asChild>
                          <span>Choose File</span>
                        </Button>
                      </label>
                    </div>

                    {selectedFile && (
                      <Button 
                        onClick={handleUploadSubmission}
                        disabled={isUploading || !studentName.trim()}
                        className="w-full"
                      >
                        {isUploading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="w-4 h-4 mr-2" />
                            Upload Assignment
                          </>
                        )}
                      </Button>
                    )}

                    {currentSubmission && (
                      <>
                        <div className="space-y-3 border-t pt-4">
                          <Label className="text-sm font-medium">Assessment Method</Label>
                          <RadioGroup value={assessmentMode} onValueChange={setAssessmentMode}>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="manual" id="manual" />
                              <Label htmlFor="manual" className="flex items-center gap-2">
                                <User className="w-4 h-4" />
                                Manual Check by Faculty
                              </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="ai" id="ai" />
                              <Label htmlFor="ai" className="flex items-center gap-2">
                                <Bot className="w-4 h-4" />
                                AI-Based Assessment
                              </Label>
                            </div>
                          </RadioGroup>
                        </div>

                        {assessmentMode === "ai" && !currentEvaluation && (
                          <Button 
                            onClick={handleAIAssessment} 
                            disabled={loading || currentSubmission.status === 'evaluating'}
                            className="w-full"
                          >
                            {loading || currentSubmission.status === 'evaluating' ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <Bot className="w-4 h-4 mr-2" />
                                Start AI Assessment
                              </>
                            )}
                          </Button>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="grade" className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Graded Students ({submissions.filter(s => s.status === 'graded').length})
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                          Ungraded Students ({submissions.filter(s => s.status !== 'graded').length})
                        </span>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    {currentSubmission && (
                      <div className="border-t pt-4">
                        <h3 className="font-medium mb-4">Grade</h3>
                        <div className="space-y-4">
                          <div>
                            <label className="text-sm text-muted-foreground mb-2 block">
                              {currentAssignment?.title || "Assignment"}
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={grade}
                                onChange={(e) => setGrade(e.target.value)}
                                className="w-16 h-12 text-xl font-bold text-center border rounded"
                                max={currentAssignment?.max_score || 100}
                                min="0"
                                disabled={currentEvaluation?.evaluation_type === 'ai'}
                              />
                              <span className="text-xl font-bold">/{currentAssignment?.max_score || 100}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Value between 0 to {currentAssignment?.max_score || 100} is allowed
                            </p>
                           </div>

                          <div className="space-y-3">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full justify-start"
                              onClick={handleAIAssessment}
                              disabled={loading || currentSubmission.status === 'evaluating'}
                            >
                              {loading || currentSubmission.status === 'evaluating' ? (
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

                            <Button variant="outline" size="sm" className="w-full justify-start">
                              View Rubric
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
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                                  <Bot className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <span className="text-base font-semibold text-blue-900">AI Evaluation Report</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="text-sm bg-blue-100 text-blue-800">
                                      Score: {currentEvaluation.score}/{currentEvaluation.max_score}
                                    </Badge>
                                    <Badge variant="outline" className="text-sm">
                                      {Math.round((currentEvaluation.score / currentEvaluation.max_score) * 100)}%
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Score Breakdown */}
                              <div className="mb-4 p-3 bg-white rounded-lg border border-blue-100">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">Score Breakdown</h4>
                                <div className="space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total Points Earned:</span>
                                    <span className="font-medium text-blue-600">{currentEvaluation.score}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total Points Possible:</span>
                                    <span className="font-medium">{currentEvaluation.max_score}</span>
                                  </div>
                                  <div className="flex justify-between text-sm border-t pt-2">
                                    <span className="text-gray-600">Grade Percentage:</span>
                                    <span className="font-semibold text-blue-600">
                                      {Math.round((currentEvaluation.score / currentEvaluation.max_score) * 100)}%
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Detailed Feedback Sections */}
                              <div className="space-y-4 max-h-80 overflow-y-auto">
                                {currentEvaluation.ai_feedback.detailed_feedback && (
                                  <div className="p-3 bg-white rounded-lg border border-blue-100">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-500" />
                                      Overall Assessment
                                    </h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {currentEvaluation.ai_feedback.detailed_feedback}
                                    </p>
                                  </div>
                                )}

                                {currentEvaluation.ai_feedback.strengths && (
                                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                                    <h4 className="text-sm font-semibold text-green-900 mb-2 flex items-center gap-2">
                                      <CheckCircle className="w-4 h-4 text-green-600" />
                                      Strengths Identified
                                    </h4>
                                    <ul className="space-y-1">
                                      {currentEvaluation.ai_feedback.strengths.map((strength: string, i: number) => (
                                        <li key={i} className="text-sm text-green-800 flex items-start gap-2">
                                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                                          <span>{strength}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {currentEvaluation.ai_feedback.improvements && (
                                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                                    <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center gap-2">
                                      <Bot className="w-4 h-4 text-amber-600" />
                                      Areas for Improvement
                                    </h4>
                                    <ul className="space-y-1">
                                      {currentEvaluation.ai_feedback.improvements.map((improvement: string, i: number) => (
                                        <li key={i} className="text-sm text-amber-800 flex items-start gap-2">
                                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-2 flex-shrink-0"></span>
                                          <span>{improvement}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {/* Grade Explanation */}
                                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                                  <h4 className="text-sm font-semibold text-purple-900 mb-2">Why This Grade?</h4>
                                  <p className="text-sm text-purple-800">
                                    This grade reflects the AI's assessment based on content accuracy, completeness, 
                                    presentation quality, and adherence to assignment requirements. The score considers 
                                    both demonstrated understanding and areas where improvement is needed.
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="mt-4 flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="text-xs flex-1"
                                  onClick={() => setRemarks(currentEvaluation.ai_feedback.detailed_feedback || "")}
                                >
                                  Edit Feedback
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="text-xs flex-1"
                                  onClick={handlePublishFeedback}
                                  disabled={currentEvaluation.is_published}
                                >
                                  {currentEvaluation.is_published ? 'Published to Student' : 'Publish to Student'}
                                </Button>
                              </div>
                            </div>
                          )}

                          <Button 
                            onClick={handleManualSubmit} 
                            className="w-full"
                            disabled={!grade || loading || (currentEvaluation?.evaluation_type === 'ai' && !currentEvaluation.is_published)}
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
                    )}

                    {!currentSubmission && (
                      <div className="border-t pt-4 text-center text-muted-foreground">
                        <FileText className="w-8 h-8 mx-auto mb-2" />
                        <p className="text-sm">No submissions to grade yet</p>
                      </div>
                    )}
                  </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}