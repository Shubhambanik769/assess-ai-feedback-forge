import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { useToast } from '@/hooks/use-toast'

export interface Assignment {
  id: string
  title: string
  description: string | null
  max_score: number
  created_by: string
  created_at: string
  updated_at: string
}

export interface Submission {
  id: string
  assignment_id: string
  student_id: string
  student_name: string
  file_path: string | null
  file_name: string | null
  file_type: string | null
  submission_date: string
  status: string
  created_at: string
  updated_at: string
}

export interface Evaluation {
  id: string
  submission_id: string
  score: number
  max_score: number
  evaluation_type: string
  ai_feedback: any | null
  manual_remarks: string | null
  evaluator_id: string | null
  is_published: boolean
  created_at: string
  updated_at: string
}

export const useAssignments = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch assignments',
        variant: 'destructive'
      })
    }
  }

  const fetchSubmissions = async (assignmentId?: string) => {
    try {
      let query = supabase.from('submissions').select('*')
      
      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId)
      }
      
      const { data, error } = await query.order('submission_date', { ascending: false })

      if (error) throw error
      setSubmissions(data || [])
    } catch (error) {
      console.error('Error fetching submissions:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch submissions',
        variant: 'destructive'
      })
    }
  }

  const fetchEvaluations = async (submissionId?: string) => {
    try {
      let query = supabase.from('evaluations').select('*')
      
      if (submissionId) {
        query = query.eq('submission_id', submissionId)
      }
      
      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error
      setEvaluations(data || [])
    } catch (error) {
      console.error('Error fetching evaluations:', error)
      toast({
        title: 'Error',
        description: 'Failed to fetch evaluations',
        variant: 'destructive'
      })
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `assignments/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('assignment-files')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data } = supabase.storage
      .from('assignment-files')
      .getPublicUrl(filePath)

    return data.publicUrl
  }

  const createSubmission = async (
    assignmentId: string,
    studentName: string,
    file: File
  ): Promise<Submission> => {
    setLoading(true)
    try {
      // Upload file
      const fileUrl = await uploadFile(file)
      
      // Create submission record
      const { data, error } = await supabase
        .from('submissions')
        .insert({
          assignment_id: assignmentId,
          student_id: crypto.randomUUID(), // In real app, this would be the authenticated user's ID
          student_name: studentName,
          file_path: fileUrl,
          file_name: file.name,
          file_type: file.type,
          status: 'submitted'
        })
        .select()
        .single()

      if (error) throw error

      await fetchSubmissions(assignmentId)
      
      toast({
        title: 'Success',
        description: 'Assignment uploaded successfully',
      })

      return data
    } catch (error) {
      console.error('Error creating submission:', error)
      toast({
        title: 'Error',
        description: 'Failed to upload assignment',
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const evaluateWithAI = async (submissionId: string, assignmentTitle: string) => {
    setLoading(true)
    try {
      // First extract text from the file
      const submission = submissions.find(s => s.id === submissionId)
      if (!submission?.file_path) {
        throw new Error('Submission file not found')
      }

      toast({
        title: 'Processing',
        description: 'Extracting text from file...',
      })

      const { data: extractResult, error: extractError } = await supabase.functions
        .invoke('extract-text', {
          body: {
            fileUrl: submission.file_path,
            fileType: submission.file_type
          }
        })

      if (extractError) throw extractError

      if (!extractResult.success) {
        throw new Error(extractResult.error || 'Failed to extract text')
      }

      toast({
        title: 'Processing',
        description: 'AI is evaluating the assignment...',
      })

      // Then evaluate with AI
      const { data: evalResult, error: evalError } = await supabase.functions
        .invoke('evaluate-assignment', {
          body: {
            submissionId: submissionId,
            assignmentTitle: assignmentTitle,
            extractedText: extractResult.extractedText
          }
        })

      if (evalError) throw evalError

      if (!evalResult.success) {
        throw new Error(evalResult.error || 'Failed to evaluate assignment')
      }

      await fetchEvaluations(submissionId)
      await fetchSubmissions()

      toast({
        title: 'Success',
        description: 'AI evaluation completed successfully',
      })

      return evalResult.evaluation
    } catch (error) {
      console.error('Error in AI evaluation:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to evaluate with AI',
        variant: 'destructive'
      })
      throw error
    } finally {
      setLoading(false)
    }
  }

  const createManualEvaluation = async (
    submissionId: string,
    score: number,
    maxScore: number,
    remarks: string
  ): Promise<Evaluation> => {
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .insert({
          submission_id: submissionId,
          score: score,
          max_score: maxScore,
          evaluation_type: 'manual',
          manual_remarks: remarks,
          evaluator_id: crypto.randomUUID(), // In real app, this would be the authenticated user's ID
          is_published: false
        })
        .select()
        .single()

      if (error) throw error

      await fetchEvaluations(submissionId)
      await fetchSubmissions()

      toast({
        title: 'Success',
        description: 'Manual evaluation saved successfully',
      })

      return data
    } catch (error) {
      console.error('Error creating manual evaluation:', error)
      toast({
        title: 'Error',
        description: 'Failed to save manual evaluation',
        variant: 'destructive'
      })
      throw error
    }
  }

  const publishEvaluation = async (evaluationId: string) => {
    try {
      const { error } = await supabase
        .from('evaluations')
        .update({ is_published: true })
        .eq('id', evaluationId)

      if (error) throw error

      await fetchEvaluations()

      toast({
        title: 'Success',
        description: 'Evaluation published successfully',
      })
    } catch (error) {
      console.error('Error publishing evaluation:', error)
      toast({
        title: 'Error',
        description: 'Failed to publish evaluation',
        variant: 'destructive'
      })
      throw error
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [])

  return {
    assignments,
    submissions,
    evaluations,
    loading,
    fetchAssignments,
    fetchSubmissions,
    fetchEvaluations,
    createSubmission,
    evaluateWithAI,
    createManualEvaluation,
    publishEvaluation
  }
}