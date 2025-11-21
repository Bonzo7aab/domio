-- =============================================
-- DOMIO PLATFORM - SECURITY POLICIES (RLS)
-- =============================================

-- Enable Row Level Security on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tender_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_storage_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_processing_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER PROFILES POLICIES
-- =============================================

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (id = auth.uid());

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (id = auth.uid());

-- Public profiles can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public profiles" ON user_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- COMPANIES POLICIES
-- =============================================

-- Users can view companies they're associated with
CREATE POLICY "Users can view their companies" ON companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = companies.id 
            AND user_id = auth.uid()
        )
    );

-- Users can update companies they're associated with
CREATE POLICY "Users can update their companies" ON companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = companies.id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
        )
    );

-- Public companies can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public companies" ON companies
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert companies (they'll be associated via user_companies)
CREATE POLICY "Users can insert companies" ON companies
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- USER COMPANIES POLICIES
-- =============================================

-- Users can view their company relationships
CREATE POLICY "Users can view their company relationships" ON user_companies
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own company relationships
CREATE POLICY "Users can insert their own company relationships" ON user_companies
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own company relationships
CREATE POLICY "Users can update their own company relationships" ON user_companies
    FOR UPDATE USING (user_id = auth.uid());

-- =============================================
-- SUBSCRIPTION POLICIES
-- =============================================

-- Subscription plans are publicly readable
CREATE POLICY "Subscription plans are publicly readable" ON subscription_plans
    FOR SELECT USING (true);

-- Users can view their own subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own subscriptions
CREATE POLICY "Users can insert their own subscriptions" ON user_subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own subscriptions
CREATE POLICY "Users can update their own subscriptions" ON user_subscriptions
    FOR UPDATE USING (user_id = auth.uid());

-- =============================================
-- JOB CATEGORIES POLICIES
-- =============================================

-- Job categories are publicly readable
CREATE POLICY "Job categories are publicly readable" ON job_categories
    FOR SELECT USING (true);

-- =============================================
-- JOBS POLICIES
-- =============================================

-- Public jobs can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public jobs" ON jobs
    FOR SELECT USING (auth.role() = 'authenticated' AND is_public = true);

-- Users can view jobs they created
CREATE POLICY "Users can view their own jobs" ON jobs
    FOR SELECT USING (manager_id = auth.uid());

-- Users can insert jobs
CREATE POLICY "Users can insert jobs" ON jobs
    FOR INSERT WITH CHECK (manager_id = auth.uid());

-- Users can update their own jobs
CREATE POLICY "Users can update their own jobs" ON jobs
    FOR UPDATE USING (manager_id = auth.uid());

-- Users can delete their own jobs
CREATE POLICY "Users can delete their own jobs" ON jobs
    FOR DELETE USING (manager_id = auth.uid());

-- =============================================
-- TENDERS POLICIES
-- =============================================

-- Public tenders can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public tenders" ON tenders
    FOR SELECT USING (auth.role() = 'authenticated' AND is_public = true);

-- Users can view tenders they created
CREATE POLICY "Users can view their own tenders" ON tenders
    FOR SELECT USING (manager_id = auth.uid());

-- Users can insert tenders
CREATE POLICY "Users can insert tenders" ON tenders
    FOR INSERT WITH CHECK (manager_id = auth.uid());

-- Users can update their own tenders
CREATE POLICY "Users can update their own tenders" ON tenders
    FOR UPDATE USING (manager_id = auth.uid());

-- Users can delete their own tenders
CREATE POLICY "Users can delete their own tenders" ON tenders
    FOR DELETE USING (manager_id = auth.uid());

-- =============================================
-- JOB APPLICATIONS POLICIES
-- =============================================

-- Users can view applications they submitted
CREATE POLICY "Users can view their own applications" ON job_applications
    FOR SELECT USING (contractor_id = auth.uid());

-- Users can view applications for their jobs
CREATE POLICY "Job owners can view applications" ON job_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = job_applications.job_id 
            AND jobs.manager_id = auth.uid()
        )
    );

-- Users can insert applications
CREATE POLICY "Users can submit applications" ON job_applications
    FOR INSERT WITH CHECK (contractor_id = auth.uid());

-- Job owners can update application status
CREATE POLICY "Job owners can update application status" ON job_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE jobs.id = job_applications.job_id 
            AND jobs.manager_id = auth.uid()
        )
    );

-- =============================================
-- TENDER BIDS POLICIES
-- =============================================

-- Users can view bids they submitted
CREATE POLICY "Users can view their own bids" ON tender_bids
    FOR SELECT USING (contractor_id = auth.uid());

-- Users can view bids for their tenders
CREATE POLICY "Tender owners can view bids" ON tender_bids
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tenders 
            WHERE tenders.id = tender_bids.tender_id 
            AND tenders.manager_id = auth.uid()
        )
    );

-- Users can insert bids
CREATE POLICY "Users can submit bids" ON tender_bids
    FOR INSERT WITH CHECK (contractor_id = auth.uid());

-- Tender owners can update bid status
CREATE POLICY "Tender owners can update bid status" ON tender_bids
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM tenders 
            WHERE tenders.id = tender_bids.tender_id 
            AND tenders.manager_id = auth.uid()
        )
    );

-- =============================================
-- CERTIFICATES POLICIES
-- =============================================

-- Users can view certificates for companies they're associated with
CREATE POLICY "Users can view company certificates" ON certificates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = certificates.company_id 
            AND user_id = auth.uid()
        )
    );

-- Users can insert certificates for their companies
CREATE POLICY "Users can insert company certificates" ON certificates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = certificates.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
        )
    );

-- Users can update certificates for their companies
CREATE POLICY "Users can update company certificates" ON certificates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = certificates.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
        )
    );

-- Public certificates can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public certificates" ON certificates
    FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================
-- COMPANY REVIEWS POLICIES
-- =============================================

-- Public reviews can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public reviews" ON company_reviews
    FOR SELECT USING (auth.role() = 'authenticated' AND is_public = true);

-- Users can view reviews they wrote
CREATE POLICY "Users can view their own reviews" ON company_reviews
    FOR SELECT USING (reviewer_id = auth.uid());

-- Users can view reviews for their companies
CREATE POLICY "Users can view reviews for their companies" ON company_reviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = company_reviews.company_id 
            AND user_id = auth.uid()
        )
    );

-- Users can insert reviews
CREATE POLICY "Users can insert reviews" ON company_reviews
    FOR INSERT WITH CHECK (reviewer_id = auth.uid());

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews" ON company_reviews
    FOR UPDATE USING (reviewer_id = auth.uid());

-- =============================================
-- COMPANY RATINGS POLICIES
-- =============================================

-- Company ratings are publicly readable
CREATE POLICY "Company ratings are publicly readable" ON company_ratings
    FOR SELECT USING (true);

-- =============================================
-- CONVERSATIONS POLICIES
-- =============================================

-- Users can view conversations they participate in
CREATE POLICY "Users can view their conversations" ON conversations
    FOR SELECT USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- Users can insert conversations they participate in
CREATE POLICY "Users can insert conversations" ON conversations
    FOR INSERT WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- Users can update conversations they participate in
CREATE POLICY "Users can update their conversations" ON conversations
    FOR UPDATE USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- =============================================
-- MESSAGES POLICIES
-- =============================================

-- Users can view messages in conversations they participate in
CREATE POLICY "Users can view messages in their conversations" ON messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = messages.conversation_id 
            AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
        )
    );

-- Users can insert messages in conversations they participate in
CREATE POLICY "Users can insert messages" ON messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM conversations 
            WHERE id = messages.conversation_id 
            AND (participant_1 = auth.uid() OR participant_2 = auth.uid())
        )
    );

-- Users can update their own messages
CREATE POLICY "Users can update their own messages" ON messages
    FOR UPDATE USING (sender_id = auth.uid());

-- =============================================
-- MESSAGE READ STATUS POLICIES
-- =============================================

-- Users can view read status for their messages
CREATE POLICY "Users can view message read status" ON message_read_status
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert read status for their messages
CREATE POLICY "Users can insert message read status" ON message_read_status
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update read status for their messages
CREATE POLICY "Users can update message read status" ON message_read_status
    FOR UPDATE USING (user_id = auth.uid());

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================

-- Users can view their own notifications
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (user_id = auth.uid());

-- System can insert notifications for any user
CREATE POLICY "System can insert notifications" ON notifications
    FOR INSERT WITH CHECK (true);

-- =============================================
-- NOTIFICATION PREFERENCES POLICIES
-- =============================================

-- Users can view their own notification preferences
CREATE POLICY "Users can view their notification preferences" ON notification_preferences
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notification preferences
CREATE POLICY "Users can update their notification preferences" ON notification_preferences
    FOR UPDATE USING (user_id = auth.uid());

-- Users can insert their own notification preferences
CREATE POLICY "Users can insert their notification preferences" ON notification_preferences
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- =============================================
-- ACTIVITY LOGS POLICIES
-- =============================================

-- Users can view their own activity logs
CREATE POLICY "Users can view their own activity logs" ON activity_logs
    FOR SELECT USING (user_id = auth.uid());

-- System can insert activity logs for any user
CREATE POLICY "System can insert activity logs" ON activity_logs
    FOR INSERT WITH CHECK (true);

-- =============================================
-- QUESTIONS POLICIES
-- =============================================

-- Public questions can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public questions" ON questions
    FOR SELECT USING (auth.role() = 'authenticated' AND is_public = true);

-- Users can view questions they asked
CREATE POLICY "Users can view their own questions" ON questions
    FOR SELECT USING (asker_id = auth.uid());

-- Users can view questions for their jobs/tenders
CREATE POLICY "Users can view questions for their jobs/tenders" ON questions
    FOR SELECT USING (
        (job_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM jobs WHERE jobs.id = questions.job_id AND jobs.manager_id = auth.uid()
        )) OR
        (tender_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM tenders WHERE tenders.id = questions.tender_id AND tenders.manager_id = auth.uid()
        ))
    );

-- Users can insert questions
CREATE POLICY "Users can insert questions" ON questions
    FOR INSERT WITH CHECK (asker_id = auth.uid());

-- Users can update questions they asked
CREATE POLICY "Users can update their own questions" ON questions
    FOR UPDATE USING (asker_id = auth.uid());

-- Job/tender owners can answer questions
CREATE POLICY "Job/tender owners can answer questions" ON questions
    FOR UPDATE USING (
        answered_by = auth.uid() OR
        (job_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM jobs WHERE jobs.id = questions.job_id AND jobs.manager_id = auth.uid()
        )) OR
        (tender_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM tenders WHERE tenders.id = questions.tender_id AND tenders.manager_id = auth.uid()
        ))
    );

-- =============================================
-- USER FEEDBACK POLICIES
-- =============================================

-- Users can view their own feedback
CREATE POLICY "Users can view their own feedback" ON user_feedback
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert feedback
CREATE POLICY "Users can insert feedback" ON user_feedback
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own feedback
CREATE POLICY "Users can update their own feedback" ON user_feedback
    FOR UPDATE USING (user_id = auth.uid());

-- =============================================
-- SUPPORT TICKETS POLICIES
-- =============================================

-- Users can view their own support tickets
CREATE POLICY "Users can view their own support tickets" ON support_tickets
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert support tickets
CREATE POLICY "Users can insert support tickets" ON support_tickets
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own support tickets
CREATE POLICY "Users can update their own support tickets" ON support_tickets
    FOR UPDATE USING (user_id = auth.uid());

-- =============================================
-- SUPPORT TICKET MESSAGES POLICIES
-- =============================================

-- Users can view messages in their support tickets
CREATE POLICY "Users can view support ticket messages" ON support_ticket_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE id = support_ticket_messages.ticket_id 
            AND user_id = auth.uid()
        )
    );

-- Users can insert messages in their support tickets
CREATE POLICY "Users can insert support ticket messages" ON support_ticket_messages
    FOR INSERT WITH CHECK (
        sender_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM support_tickets 
            WHERE id = support_ticket_messages.ticket_id 
            AND user_id = auth.uid()
        )
    );

-- =============================================
-- FILE UPLOADS POLICIES
-- =============================================

-- Users can view their own files
CREATE POLICY "Users can view their own files" ON file_uploads
    FOR SELECT USING (user_id = auth.uid());

-- Users can view public files
CREATE POLICY "Users can view public files" ON file_uploads
    FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');

-- Users can insert files
CREATE POLICY "Users can insert files" ON file_uploads
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own files
CREATE POLICY "Users can update their own files" ON file_uploads
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own files
CREATE POLICY "Users can delete their own files" ON file_uploads
    FOR DELETE USING (user_id = auth.uid());

-- =============================================
-- IMAGE GALLERIES POLICIES
-- =============================================

-- Users can view image galleries for entities they have access to
CREATE POLICY "Users can view image galleries" ON image_galleries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM file_uploads 
            WHERE id = image_galleries.file_id 
            AND (user_id = auth.uid() OR is_public = true)
        )
    );

-- Users can insert image galleries for their files
CREATE POLICY "Users can insert image galleries" ON image_galleries
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM file_uploads 
            WHERE id = image_galleries.file_id 
            AND user_id = auth.uid()
        )
    );

-- Users can update image galleries for their files
CREATE POLICY "Users can update image galleries" ON image_galleries
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM file_uploads 
            WHERE id = image_galleries.file_id 
            AND user_id = auth.uid()
        )
    );

-- Users can delete image galleries for their files
CREATE POLICY "Users can delete image galleries" ON image_galleries
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM file_uploads 
            WHERE id = image_galleries.file_id 
            AND user_id = auth.uid()
        )
    );

-- =============================================
-- DOCUMENT TEMPLATES POLICIES
-- =============================================

-- Document templates are publicly readable
CREATE POLICY "Document templates are publicly readable" ON document_templates
    FOR SELECT USING (true);

-- =============================================
-- SHARED FILES POLICIES
-- =============================================

-- Users can view files shared with them
CREATE POLICY "Users can view shared files" ON shared_files
    FOR SELECT USING (
        shared_with = auth.uid() OR 
        shared_by = auth.uid() OR
        shared_with IS NULL
    );

-- Users can share files
CREATE POLICY "Users can share files" ON shared_files
    FOR INSERT WITH CHECK (shared_by = auth.uid());

-- Users can update files they shared
CREATE POLICY "Users can update shared files" ON shared_files
    FOR UPDATE USING (shared_by = auth.uid());

-- Users can delete files they shared
CREATE POLICY "Users can delete shared files" ON shared_files
    FOR DELETE USING (shared_by = auth.uid());

-- =============================================
-- STORAGE QUOTAS POLICIES
-- =============================================

-- Users can view their own storage quotas
CREATE POLICY "Users can view their storage quotas" ON storage_quotas
    FOR SELECT USING (user_id = auth.uid());

-- System can insert/update storage quotas
CREATE POLICY "System can manage storage quotas" ON storage_quotas
    FOR ALL WITH CHECK (true);

-- =============================================
-- COMPANY STORAGE QUOTAS POLICIES
-- =============================================

-- Users can view storage quotas for their companies
CREATE POLICY "Users can view company storage quotas" ON company_storage_quotas
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = company_storage_quotas.company_id 
            AND user_id = auth.uid()
        )
    );

-- System can insert/update company storage quotas
CREATE POLICY "System can manage company storage quotas" ON company_storage_quotas
    FOR ALL WITH CHECK (true);

-- =============================================
-- PORTFOLIO PROJECTS POLICIES
-- =============================================

-- Users can view portfolio projects for companies they're associated with
CREATE POLICY "Users can view company portfolio projects" ON portfolio_projects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = portfolio_projects.company_id 
            AND user_id = auth.uid()
        )
    );

-- Public portfolio projects can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public portfolio projects" ON portfolio_projects
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert portfolio projects for their companies
CREATE POLICY "Users can insert portfolio projects" ON portfolio_projects
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = portfolio_projects.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
        )
    );

-- Users can update portfolio projects for their companies
CREATE POLICY "Users can update portfolio projects" ON portfolio_projects
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = portfolio_projects.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
        )
    );

-- Users can delete portfolio projects for their companies
CREATE POLICY "Users can delete portfolio projects" ON portfolio_projects
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = portfolio_projects.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
        )
    );

-- =============================================
-- PORTFOLIO PROJECT IMAGES POLICIES
-- =============================================

-- Users can view portfolio project images for projects they have access to
CREATE POLICY "Users can view portfolio project images" ON portfolio_project_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM portfolio_projects 
            WHERE id = portfolio_project_images.project_id 
            AND (
                EXISTS (
                    SELECT 1 FROM user_companies 
                    WHERE company_id = portfolio_projects.company_id 
                    AND user_id = auth.uid()
                ) OR
                auth.role() = 'authenticated'
            )
        )
    );

-- Users can insert portfolio project images for their projects
CREATE POLICY "Users can insert portfolio project images" ON portfolio_project_images
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM portfolio_projects 
            JOIN user_companies ON user_companies.company_id = portfolio_projects.company_id
            WHERE portfolio_projects.id = portfolio_project_images.project_id 
            AND user_companies.user_id = auth.uid()
            AND user_companies.role IN ('owner', 'manager')
        )
    );

-- Users can update portfolio project images for their projects
CREATE POLICY "Users can update portfolio project images" ON portfolio_project_images
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM portfolio_projects 
            JOIN user_companies ON user_companies.company_id = portfolio_projects.company_id
            WHERE portfolio_projects.id = portfolio_project_images.project_id 
            AND user_companies.user_id = auth.uid()
            AND user_companies.role IN ('owner', 'manager')
        )
    );

-- Users can delete portfolio project images for their projects
CREATE POLICY "Users can delete portfolio project images" ON portfolio_project_images
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM portfolio_projects 
            JOIN user_companies ON user_companies.company_id = portfolio_projects.company_id
            WHERE portfolio_projects.id = portfolio_project_images.project_id 
            AND user_companies.user_id = auth.uid()
            AND user_companies.role IN ('owner', 'manager')
        )
    );

-- =============================================
-- CERTIFICATE CATEGORIES POLICIES
-- =============================================

-- Certificate categories are publicly readable
CREATE POLICY "Certificate categories are publicly readable" ON certificate_categories
    FOR SELECT USING (true);

-- =============================================
-- CERTIFICATE TEMPLATES POLICIES
-- =============================================

-- Certificate templates are publicly readable
CREATE POLICY "Certificate templates are publicly readable" ON certificate_templates
    FOR SELECT USING (true);

-- =============================================
-- FILE PROCESSING QUEUE POLICIES
-- =============================================

-- System can manage file processing queue
CREATE POLICY "System can manage file processing queue" ON file_processing_queue
    FOR ALL WITH CHECK (true);

-- =============================================
-- HELPER FUNCTIONS FOR POLICIES
-- =============================================

-- Function to check if user is admin (can be extended for admin roles)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    -- For now, return false. This can be extended to check for admin roles
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns or manages a company
CREATE OR REPLACE FUNCTION user_owns_or_manages_company(company_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_companies 
        WHERE company_id = company_uuid 
        AND user_id = auth.uid()
        AND role IN ('owner', 'manager')
        AND is_active = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- BUILDINGS POLICIES
-- =============================================

-- Users can view buildings for companies they're associated with
CREATE POLICY "Users can view company buildings" ON buildings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = buildings.company_id 
            AND user_id = auth.uid()
        )
    );

-- Public buildings can be viewed by authenticated users
CREATE POLICY "Authenticated users can view public buildings" ON buildings
    FOR SELECT USING (auth.role() = 'authenticated');

-- Users can insert buildings for companies they own or manage
CREATE POLICY "Users can insert company buildings" ON buildings
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = buildings.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
            AND is_active = true
        )
    );

-- Users can update buildings for companies they own or manage
CREATE POLICY "Users can update company buildings" ON buildings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = buildings.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
            AND is_active = true
        )
    );

-- Users can delete buildings for companies they own or manage
CREATE POLICY "Users can delete company buildings" ON buildings
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM user_companies 
            WHERE company_id = buildings.company_id 
            AND user_id = auth.uid()
            AND role IN ('owner', 'manager')
            AND is_active = true
        )
    );
