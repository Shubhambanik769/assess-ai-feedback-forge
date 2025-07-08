-- Temporarily make RLS policies more permissive for demo purposes
-- Since there's no authentication setup yet

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Faculty can create templates" ON public.assessment_templates;
DROP POLICY IF EXISTS "Template creators can update" ON public.assessment_templates;
DROP POLICY IF EXISTS "Template creators can manage questions" ON public.questions;
DROP POLICY IF EXISTS "Authenticated users can create assignments" ON public.assignments;
DROP POLICY IF EXISTS "Assignment creators can update their assignments" ON public.assignments;
DROP POLICY IF EXISTS "Authenticated users can create submissions" ON public.submissions;
DROP POLICY IF EXISTS "Users can update their own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Authenticated users can create evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Evaluators can update their evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Evaluators can view all evaluations" ON public.evaluations;

-- Create more permissive policies for demo
-- Assessment Templates
CREATE POLICY "Anyone can create templates" ON public.assessment_templates FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update templates" ON public.assessment_templates FOR UPDATE USING (true);

-- Questions
CREATE POLICY "Anyone can manage questions" ON public.questions FOR ALL USING (true);

-- Assignments
CREATE POLICY "Anyone can create assignments" ON public.assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update assignments" ON public.assignments FOR UPDATE USING (true);

-- Submissions
CREATE POLICY "Anyone can create submissions" ON public.submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update submissions" ON public.submissions FOR UPDATE USING (true);

-- Evaluations
CREATE POLICY "Anyone can create evaluations" ON public.evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update evaluations" ON public.evaluations FOR UPDATE USING (true);
CREATE POLICY "Anyone can view evaluations" ON public.evaluations FOR SELECT USING (true);