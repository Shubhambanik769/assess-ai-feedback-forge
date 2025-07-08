import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Wand2, FileText, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"

interface Question {
  question_text: string
  question_type: string
  marks: number
  order_index: number
  sample_answer?: string
  difficulty?: string
}

interface AssessmentData {
  title: string
  description: string
  questions: Question[]
  total_marks: number
  estimated_duration: string
  learning_objectives: string[]
}

interface AssessmentGeneratorProps {
  onAssessmentGenerated: (assessment: AssessmentData) => void
}

export function AssessmentGenerator({ onAssessmentGenerated }: AssessmentGeneratorProps) {
  const [topic, setTopic] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [totalQuestions, setTotalQuestions] = useState(5)
  const [difficultyLevel, setDifficultyLevel] = useState("medium")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAssessment, setGeneratedAssessment] = useState<AssessmentData | null>(null)
  const { toast } = useToast()

  const handleGenerateAssessment = async () => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic for the assessment",
        variant: "destructive"
      })
      return
    }

    setIsGenerating(true)
    try {
      const { data, error } = await supabase.functions.invoke('generate-assessment', {
        body: {
          topic: topic.trim(),
          title: title.trim() || undefined,
          description: description.trim() || undefined,
          totalQuestions,
          difficultyLevel
        }
      })

      if (error) throw error

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate assessment')
      }

      setGeneratedAssessment(data.assessment)
      onAssessmentGenerated(data.assessment)
      
      toast({
        title: "Success",
        description: "Assessment generated successfully!",
      })
    } catch (error) {
      console.error('Error generating assessment:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate assessment",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    if (!generatedAssessment) return
    
    const updatedQuestions = [...generatedAssessment.questions]
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value }
    
    const updatedAssessment = {
      ...generatedAssessment,
      questions: updatedQuestions,
      total_marks: updatedQuestions.reduce((sum, q) => sum + q.marks, 0)
    }
    
    setGeneratedAssessment(updatedAssessment)
    onAssessmentGenerated(updatedAssessment)
  }

  const addQuestion = () => {
    if (!generatedAssessment) return
    
    const newQuestion: Question = {
      question_text: "",
      question_type: "essay",
      marks: 10,
      order_index: generatedAssessment.questions.length + 1
    }
    
    const updatedAssessment = {
      ...generatedAssessment,
      questions: [...generatedAssessment.questions, newQuestion],
      total_marks: generatedAssessment.total_marks + 10
    }
    
    setGeneratedAssessment(updatedAssessment)
    onAssessmentGenerated(updatedAssessment)
  }

  const removeQuestion = (index: number) => {
    if (!generatedAssessment) return
    
    const updatedQuestions = generatedAssessment.questions.filter((_, i) => i !== index)
      .map((q, i) => ({ ...q, order_index: i + 1 }))
    
    const updatedAssessment = {
      ...generatedAssessment,
      questions: updatedQuestions,
      total_marks: updatedQuestions.reduce((sum, q) => sum + q.marks, 0)
    }
    
    setGeneratedAssessment(updatedAssessment)
    onAssessmentGenerated(updatedAssessment)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            AI Assessment Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic *</Label>
              <Input
                id="topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Machine Learning Fundamentals"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Assessment Title (Optional)</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave empty for AI to generate"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Leave empty for AI to generate"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="questions">Number of Questions</Label>
            <Input
              id="questions"
              type="number"
              min="1"
              max="20"
              value={totalQuestions}
              onChange={(e) => setTotalQuestions(parseInt(e.target.value) || 5)}
            />
          </div>

          <Button 
            onClick={handleGenerateAssessment}
            disabled={isGenerating || !topic.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Assessment...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate Assessment with AI
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {generatedAssessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Generated Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={generatedAssessment.title}
                  onChange={(e) => setGeneratedAssessment({
                    ...generatedAssessment,
                    title: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Marks</Label>
                <Input value={generatedAssessment.total_marks} disabled />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={generatedAssessment.description}
                onChange={(e) => setGeneratedAssessment({
                  ...generatedAssessment,
                  description: e.target.value
                })}
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Questions</Label>
                <Button onClick={addQuestion} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Question
                </Button>
              </div>

              {generatedAssessment.questions.map((question, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <Label className="font-medium">Question {index + 1}</Label>
                        <Button
                          onClick={() => removeQuestion(index)}
                          size="sm"
                          variant="outline"
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>

                      <Textarea
                        value={question.question_text}
                        onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                        placeholder="Enter question text"
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Question Type</Label>
                          <Select
                            value={question.question_type}
                            onValueChange={(value) => updateQuestion(index, 'question_type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="essay">Essay</SelectItem>
                              <SelectItem value="short_answer">Short Answer</SelectItem>
                              <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label>Marks</Label>
                          <Input
                            type="number"
                            min="1"
                            value={question.marks}
                            onChange={(e) => updateQuestion(index, 'marks', parseInt(e.target.value) || 1)}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}