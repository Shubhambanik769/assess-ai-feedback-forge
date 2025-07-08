
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'

export function SignatureUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please select a JPEG, PNG, or GIF image file',
          variant: 'destructive'
        })
        return
      }

      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select a file smaller than 5MB',
          variant: 'destructive'
        })
        return
      }

      setFile(selectedFile)
      setUploadedUrl(null) // Reset previous upload
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: 'No file selected',
        description: 'Please select a signature file to upload',
        variant: 'destructive'
      })
      return
    }

    setUploading(true)

    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `signature-${Date.now()}.${fileExt}`
      const filePath = `signatures/${fileName}`

      console.log('Uploading signature to:', filePath)

      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('signatures')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('signatures')
        .getPublicUrl(filePath)

      console.log('Upload successful! URL:', urlData.publicUrl)
      
      setUploadedUrl(urlData.publicUrl)
      setFile(null)

      toast({
        title: 'Success!',
        description: 'Signature uploaded successfully',
      })

    } catch (error) {
      console.error('Error uploading signature:', error)
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'Failed to upload signature',
        variant: 'destructive'
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Signature
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="signature-file">Choose signature file</Label>
          <Input
            id="signature-file"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <p className="text-sm text-muted-foreground">
            Supported formats: JPEG, PNG, GIF (max 5MB)
          </p>
        </div>

        {file && (
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-sm">Selected: {file.name}</span>
          </div>
        )}

        {uploadedUrl && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">Upload successful!</span>
            </div>
            <div className="p-2 border rounded-lg">
              <img 
                src={uploadedUrl} 
                alt="Uploaded signature" 
                className="max-w-full h-auto max-h-32 object-contain"
              />
            </div>
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload Signature'}
        </Button>
      </CardContent>
    </Card>
  )
}
