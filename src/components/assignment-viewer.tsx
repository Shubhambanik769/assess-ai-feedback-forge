import { useState } from "react"
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
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"

const mockPages = [
  "/lovable-uploads/655f3504-5127-4580-8419-548364013def.png",
  "/lovable-uploads/655f3504-5127-4580-8419-548364013def.png",
  "/lovable-uploads/655f3504-5127-4580-8419-548364013def.png"
]

export function AssignmentViewer() {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [grade, setGrade] = useState("")
  const [remarks, setRemarks] = useState("")
  const [assessmentMode, setAssessmentMode] = useState("manual")
  const [isProcessing, setIsProcessing] = useState(false)
  const [aiFeedback, setAiFeedback] = useState("")
  const { toast } = useToast()

  const totalPages = mockPages.length

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      toast({
        title: "Assignment Uploaded",
        description: `${files.length} file(s) uploaded successfully.`,
      })
    }
  }

  const handleAIAssessment = async () => {
    setIsProcessing(true)
    // Simulate AI processing
    setTimeout(() => {
      setAiFeedback(`
**AI Assessment Report**

**Score: 62/70 (88.5%)**

**Strengths:**
• Excellent understanding of DevOps principles and philosophy
• Clear explanation of continuous integration concepts
• Good knowledge of deployment automation benefits
• Well-structured answers with logical flow

**Areas for Improvement:**
• Could provide more specific examples of CI/CD tools
• Missing discussion of containerization technologies
• Limited mention of monitoring and logging practices
• Could elaborate more on infrastructure as code concepts

**Detailed Feedback:**
The student demonstrates a solid grasp of DevOps fundamentals. The explanation of continuous integration shows good theoretical understanding. However, the answer would benefit from practical examples and tool-specific knowledge.

**Recommendations:**
1. Study Docker and Kubernetes containerization
2. Explore Jenkins, GitLab CI, or GitHub Actions
3. Learn about infrastructure as code (Terraform, Ansible)
4. Research monitoring tools like Prometheus and Grafana
      `)
      setGrade("62")
      setIsProcessing(false)
      toast({
        title: "AI Assessment Complete",
        description: "Detailed feedback has been generated.",
      })
    }, 3000)
  }

  const handleSubmit = () => {
    toast({
      title: "Grade Submitted",
      description: "Assignment has been graded successfully.",
    })
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Assignment Header */}
        <div className="p-4 border-b bg-card">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">Assignment 1 - DEVOPS_ASSIGNMENT_...11745338466625</h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <span>Chayansh Jain</span>
                <span>1/1</span>
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
                  <img 
                    src={mockPages[currentPage - 1]} 
                    alt={`Page ${currentPage}`}
                    className="w-full shadow-lg rounded"
                    style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
                  />
                </div>
              </div>

              {/* Page Thumbnails */}
              <div className="border-t p-4">
                <div className="flex gap-2 justify-center">
                  {mockPages.map((_, index) => (
                    <div 
                      key={index}
                      className={`w-12 h-16 border-2 rounded cursor-pointer ${
                        currentPage === index + 1 ? 'border-primary' : 'border-gray-300'
                      }`}
                      onClick={() => setCurrentPage(index + 1)}
                    >
                      <img 
                        src={mockPages[index]} 
                        alt={`Page ${index + 1}`}
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                </div>
              </div>
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
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-2">
                        Upload handwritten, Word, or PDF files
                      </p>
                      <input
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <label htmlFor="file-upload">
                        <Button variant="outline" size="sm" asChild>
                          <span>Choose Files</span>
                        </Button>
                      </label>
                    </div>

                    <div className="space-y-3">
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

                    {assessmentMode === "ai" && (
                      <Button 
                        onClick={handleAIAssessment} 
                        disabled={isProcessing}
                        className="w-full"
                      >
                        {isProcessing ? (
                          <>Processing...</>
                        ) : (
                          <>
                            <Bot className="w-4 h-4 mr-2" />
                            Start AI Assessment
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="grade" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Graded Students (0)</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Ungraded Students (2)</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-4">Grade</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm text-muted-foreground mb-2 block">
                          DEVOPS_ASSIGNMENT_...11745338466625
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            className="w-16 h-12 text-xl font-bold text-center border rounded"
                            max="70"
                            min="0"
                          />
                          <span className="text-xl font-bold">/70</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Value between 0 to 70 is allowed
                        </p>
                      </div>

                      <Button variant="outline" size="sm" className="w-full justify-start">
                        View Rubric
                      </Button>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Add Remarks</label>
                        <Textarea
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Add your remarks here..."
                          className="min-h-[100px]"
                        />
                      </div>

                      {aiFeedback && (
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Bot className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">AI Feedback</span>
                          </div>
                          <div className="text-xs text-blue-800 whitespace-pre-line max-h-40 overflow-y-auto">
                            {aiFeedback}
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button size="sm" variant="outline" className="text-xs">
                              Edit Feedback
                            </Button>
                            <Button size="sm" className="text-xs">
                              Publish Report
                            </Button>
                          </div>
                        </div>
                      )}

                      <Button onClick={handleSubmit} className="w-full">
                        Submit
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}