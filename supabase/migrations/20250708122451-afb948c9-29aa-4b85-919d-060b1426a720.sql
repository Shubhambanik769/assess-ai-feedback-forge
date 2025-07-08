-- Add user roles and profiles
CREATE TYPE user_role AS ENUM ('faculty', 'student', 'admin');

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL,
  email TEXT,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'student',
  signature_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add assessment templates and questions
CREATE TABLE IF NOT EXISTS public.assessment_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  topic TEXT NOT NULL,
  difficulty_level TEXT NOT NULL DEFAULT 'medium',
  total_questions INTEGER NOT NULL DEFAULT 5,
  created_by UUID NOT NULL,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_template_id UUID REFERENCES assessment_templates(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'essay',
  marks INTEGER NOT NULL DEFAULT 10,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Update assignments table to reference templates
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES assessment_templates(id);
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS total_marks INTEGER;

-- Update evaluations for enhanced feedback
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS detailed_feedback JSONB;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS question_scores JSONB;
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS improvement_areas TEXT[];
ALTER TABLE public.evaluations ADD COLUMN IF NOT EXISTS signature_included BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for assessment templates
CREATE POLICY "Anyone can view published templates" ON public.assessment_templates FOR SELECT USING (is_published = true OR auth.uid() = created_by);
CREATE POLICY "Faculty can create templates" ON public.assessment_templates FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Template creators can update" ON public.assessment_templates FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for questions
CREATE POLICY "Anyone can view questions of accessible templates" ON public.questions 
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM assessment_templates 
    WHERE id = questions.assessment_template_id 
    AND (is_published = true OR created_by = auth.uid())
  )
);
CREATE POLICY "Template creators can manage questions" ON public.questions 
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM assessment_templates 
    WHERE id = questions.assessment_template_id 
    AND created_by = auth.uid()
  )
);

-- Update triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assessment_templates_updated_at
  BEFORE UPDATE ON public.assessment_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for signatures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('signatures', 'signatures', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for signatures
CREATE POLICY "Anyone can view signatures" ON storage.objects 
FOR SELECT USING (bucket_id = 'signatures');

CREATE POLICY "Users can upload their signature" ON storage.objects 
FOR INSERT WITH CHECK (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their signature" ON storage.objects 
FOR UPDATE USING (bucket_id = 'signatures' AND auth.uid()::text = (storage.foldername(name))[1]);