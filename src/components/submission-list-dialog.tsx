
import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Eye, FileText, Calendar, User } from "lucide-react"
import { type Submission, type Assignment } from "@/hooks/useAssignments"

interface SubmissionListDialogProps {
  trigger: React.ReactNode
  title: string
  submissions: Submission[]
  assignment: Assignment
  onViewSubmission: (submission: Submission) => void
}

export function SubmissionListDialog({ 
  trigger, 
  title, 
  submissions, 
  assignment,
  onViewSubmission 
}: SubmissionListDialogProps) {
  const [open, setOpen] = useState(false)

  console.log('SubmissionListDialog - submissions:', submissions)
  console.log('SubmissionListDialog - assignment:', assignment)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {title} - {assignment.title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {submissions.length} submission{submissions.length !== 1 ? 's' : ''} found
          </p>
        </DialogHeader>
        
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No submissions found</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {submissions.map((submission) => (
                <Card key={submission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">
                              {submission.student_name || "Anonymous"}
                            </span>
                          </div>
                          <Badge variant={
                            submission.status === 'graded' ? 'default' :
                            submission.status === 'evaluating' ? 'secondary' : 'outline'
                          }>
                            {submission.status}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(submission.submission_date).toLocaleDateString()} at{' '}
                              {new Date(submission.submission_date).toLocaleTimeString()}
                            </span>
                          </div>
                          {submission.file_name && (
                            <div className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              <span className="truncate max-w-[200px]" title={submission.file_name}>
                                {submission.file_name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        size="sm" 
                        onClick={() => {
                          console.log('Viewing submission:', submission)
                          onViewSubmission(submission)
                          setOpen(false)
                        }}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        {submission.status === 'graded' ? 'View Grade' : 'Grade Now'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
