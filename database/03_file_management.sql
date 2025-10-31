-- =============================================
-- DOMIO PLATFORM - FILE MANAGEMENT
-- =============================================

-- =============================================
-- FILE UPLOADS
-- =============================================

-- File uploads tracking
CREATE TABLE file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN (
        'image', 'document', 'certificate', 'portfolio', 'attachment', 'logo', 'avatar'
    )),
    entity_type VARCHAR(50), -- 'job', 'tender', 'application', 'bid', 'company', 'profile', 'review'
    entity_id UUID,
    description TEXT,
    alt_text TEXT, -- For accessibility
    is_public BOOLEAN DEFAULT FALSE,
    download_count INTEGER DEFAULT 0,
    virus_scan_status VARCHAR(20) DEFAULT 'pending' CHECK (virus_scan_status IN (
        'pending', 'clean', 'infected', 'error'
    )),
    virus_scan_result JSONB,
    metadata JSONB, -- Additional file metadata (dimensions, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- IMAGE GALLERIES
-- =============================================

-- Image galleries for jobs, companies, portfolios
CREATE TABLE image_galleries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'job', 'company', 'portfolio', 'certificate', 'tender'
    entity_id UUID NOT NULL,
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    alt_text TEXT,
    sort_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT FALSE,
    is_featured BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- DOCUMENT TEMPLATES
-- =============================================

-- Predefined document templates for different purposes
CREATE TABLE document_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'contract', 'invoice', 'quote', 'certificate', 'license', 'insurance'
    )),
    category VARCHAR(50), -- 'contractor', 'manager', 'general'
    description TEXT,
    template_content JSONB, -- Template structure and fields
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FILE SHARING
-- =============================================

-- Shared files between users
CREATE TABLE shared_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    shared_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    shared_with UUID REFERENCES user_profiles(id) ON DELETE CASCADE, -- NULL for public sharing
    entity_type VARCHAR(50), -- Context of sharing (job, tender, etc.)
    entity_id UUID,
    access_level VARCHAR(20) DEFAULT 'view' CHECK (access_level IN (
        'view', 'download', 'edit'
    )),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- STORAGE QUOTAS
-- =============================================

-- Storage quotas per user
CREATE TABLE storage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL, -- 'free', 'basic', 'pro'
    total_quota BIGINT NOT NULL, -- in bytes
    used_storage BIGINT DEFAULT 0, -- in bytes
    file_count INTEGER DEFAULT 0,
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Storage quotas per company
CREATE TABLE company_storage_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL,
    total_quota BIGINT NOT NULL, -- in bytes
    used_storage BIGINT DEFAULT 0, -- in bytes
    file_count INTEGER DEFAULT 0,
    last_calculated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id)
);

-- =============================================
-- PORTFOLIO MANAGEMENT
-- =============================================

-- Portfolio projects for contractors
CREATE TABLE portfolio_projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES job_categories(id),
    location VARCHAR(255),
    project_type VARCHAR(50), -- 'residential', 'commercial', 'industrial'
    budget_range VARCHAR(100),
    duration VARCHAR(100),
    completion_date DATE,
    client_name VARCHAR(255),
    client_feedback TEXT,
    is_featured BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio project images
CREATE TABLE portfolio_project_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES portfolio_projects(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    title VARCHAR(255),
    description TEXT,
    alt_text TEXT,
    image_type VARCHAR(20) DEFAULT 'general' CHECK (image_type IN (
        'before', 'during', 'after', 'general', 'detail'
    )),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CERTIFICATE MANAGEMENT
-- =============================================

-- Certificate categories
CREATE TABLE certificate_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    for_user_type VARCHAR(20) CHECK (for_user_type IN ('manager', 'contractor', 'both')),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certificate templates
CREATE TABLE certificate_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES certificate_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    required_fields JSONB, -- Fields that must be filled
    optional_fields JSONB, -- Optional fields
    validation_rules JSONB, -- Validation rules for fields
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FILE PROCESSING QUEUE
-- =============================================

-- File processing queue for background tasks
CREATE TABLE file_processing_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    task_type VARCHAR(50) NOT NULL CHECK (task_type IN (
        'virus_scan', 'image_resize', 'thumbnail_generate', 'pdf_extract', 'compress'
    )),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 'cancelled'
    )),
    priority INTEGER DEFAULT 5, -- 1-10, lower number = higher priority
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    processing_data JSONB, -- Task-specific data
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- File uploads indexes
CREATE INDEX idx_file_uploads_user ON file_uploads(user_id);
CREATE INDEX idx_file_uploads_type ON file_uploads(file_type);
CREATE INDEX idx_file_uploads_entity ON file_uploads(entity_type, entity_id);
CREATE INDEX idx_file_uploads_public ON file_uploads(is_public);
CREATE INDEX idx_file_uploads_created ON file_uploads(created_at);

-- Image galleries indexes
CREATE INDEX idx_image_galleries_entity ON image_galleries(entity_type, entity_id);
CREATE INDEX idx_image_galleries_file ON image_galleries(file_id);
CREATE INDEX idx_image_galleries_sort ON image_galleries(sort_order);

-- Shared files indexes
CREATE INDEX idx_shared_files_file ON shared_files(file_id);
CREATE INDEX idx_shared_files_shared_by ON shared_files(shared_by);
CREATE INDEX idx_shared_files_shared_with ON shared_files(shared_with);
CREATE INDEX idx_shared_files_entity ON shared_files(entity_type, entity_id);

-- Storage quotas indexes
CREATE INDEX idx_storage_quotas_user ON storage_quotas(user_id);
CREATE INDEX idx_company_storage_quotas_company ON company_storage_quotas(company_id);

-- Portfolio indexes
CREATE INDEX idx_portfolio_projects_company ON portfolio_projects(company_id);
CREATE INDEX idx_portfolio_projects_category ON portfolio_projects(category_id);
CREATE INDEX idx_portfolio_projects_featured ON portfolio_projects(is_featured);

-- File processing queue indexes
CREATE INDEX idx_file_processing_queue_status ON file_processing_queue(status);
CREATE INDEX idx_file_processing_queue_priority ON file_processing_queue(priority);
CREATE INDEX idx_file_processing_queue_created ON file_processing_queue(created_at);

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE TRIGGER update_file_uploads_updated_at BEFORE UPDATE ON file_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_templates_updated_at BEFORE UPDATE ON document_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_storage_quotas_updated_at BEFORE UPDATE ON storage_quotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_company_storage_quotas_updated_at BEFORE UPDATE ON company_storage_quotas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_portfolio_projects_updated_at BEFORE UPDATE ON portfolio_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certificate_templates_updated_at BEFORE UPDATE ON certificate_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
