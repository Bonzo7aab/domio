export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_type: 'manager' | 'contractor'
          first_name: string
          last_name: string
          phone: string | null
          avatar_url: string | null
          is_verified: boolean
          profile_completed: boolean
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_type: 'manager' | 'contractor'
          first_name: string
          last_name: string
          phone?: string | null
          avatar_url?: string | null
          is_verified?: boolean
          profile_completed?: boolean
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_type?: 'manager' | 'contractor'
          first_name?: string
          last_name?: string
          phone?: string | null
          avatar_url?: string | null
          is_verified?: boolean
          profile_completed?: boolean
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      companies: {
        Row: {
          id: string
          name: string
          short_name: string | null
          type: 'property_management' | 'housing_association' | 'cooperative' | 'condo_management' | 'spółdzielnia' | 'wspólnota' | 'contractor' | 'construction_company' | 'service_provider'
          nip: string | null
          regon: string | null
          krs: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string
          phone: string | null
          email: string | null
          website: string | null
          description: string | null
          logo_url: string | null
          founded_year: number | null
          employee_count: string | null
          license_number: string | null
          is_verified: boolean
          verification_level: 'none' | 'basic' | 'verified' | 'premium'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name?: string | null
          type: 'property_management' | 'housing_association' | 'cooperative' | 'condo_management' | 'spółdzielnia' | 'wspólnota' | 'contractor' | 'construction_company' | 'service_provider'
          nip?: string | null
          regon?: string | null
          krs?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          description?: string | null
          logo_url?: string | null
          founded_year?: number | null
          employee_count?: string | null
          license_number?: string | null
          is_verified?: boolean
          verification_level?: 'none' | 'basic' | 'verified' | 'premium'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string | null
          type?: 'property_management' | 'housing_association' | 'cooperative' | 'condo_management' | 'spółdzielnia' | 'wspólnota' | 'contractor' | 'construction_company' | 'service_provider'
          nip?: string | null
          regon?: string | null
          krs?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          phone?: string | null
          email?: string | null
          website?: string | null
          description?: string | null
          logo_url?: string | null
          founded_year?: number | null
          employee_count?: string | null
          license_number?: string | null
          is_verified?: boolean
          verification_level?: 'none' | 'basic' | 'verified' | 'premium'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          user_type: 'manager' | 'contractor'
          price_monthly: number
          price_yearly: number
          currency: string
          features: Json | null
          limitations: Json | null
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          user_type: 'manager' | 'contractor'
          price_monthly?: number
          price_yearly?: number
          currency?: string
          features?: Json | null
          limitations?: Json | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          user_type?: 'manager' | 'contractor'
          price_monthly?: number
          price_yearly?: number
          currency?: string
          features?: Json | null
          limitations?: Json | null
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          status: 'active' | 'paused' | 'cancelled' | 'expired' | 'trial'
          billing_period: 'monthly' | 'yearly'
          start_date: string
          end_date: string | null
          auto_renew: boolean
          trial_end_date: string | null
          payment_method: string | null
          last_payment_date: string | null
          next_payment_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          status?: 'active' | 'paused' | 'cancelled' | 'expired' | 'trial'
          billing_period: 'monthly' | 'yearly'
          start_date?: string
          end_date?: string | null
          auto_renew?: boolean
          trial_end_date?: string | null
          payment_method?: string | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          status?: 'active' | 'paused' | 'cancelled' | 'expired' | 'trial'
          billing_period?: 'monthly' | 'yearly'
          start_date?: string
          end_date?: string | null
          auto_renew?: boolean
          trial_end_date?: string | null
          payment_method?: string | null
          last_payment_date?: string | null
          next_payment_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          }
        ]
      }
      job_categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          parent_id: string | null
          sort_order: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          parent_id?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      jobs: {
        Row: {
          id: string
          title: string
          description: string
          category_id: string
          subcategory: string | null
          manager_id: string
          company_id: string
          location: string
          address: string | null
          latitude: number | null
          longitude: number | null
          budget_min: number | null
          budget_max: number | null
          budget_type: 'fixed' | 'hourly' | 'negotiable' | 'range'
          currency: string
          project_duration: string | null
          deadline: string | null
          urgency: 'low' | 'medium' | 'high'
          status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
          type: 'regular' | 'urgent' | 'premium'
          is_public: boolean
          contact_person: string | null
          contact_phone: string | null
          contact_email: string | null
          building_type: string | null
          building_year: number | null
          surface_area: string | null
          additional_info: string | null
          requirements: string[]
          responsibilities: string[]
          skills_required: string[]
          images: string[]
          applications_count: number
          views_count: number
          bookmarks_count: number
          created_at: string
          updated_at: string
          published_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          category_id: string
          subcategory?: string | null
          manager_id: string
          company_id: string
          location: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          budget_min?: number | null
          budget_max?: number | null
          budget_type?: 'fixed' | 'hourly' | 'negotiable' | 'range'
          currency?: string
          project_duration?: string | null
          deadline?: string | null
          urgency?: 'low' | 'medium' | 'high'
          status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
          type?: 'regular' | 'urgent' | 'premium'
          is_public?: boolean
          contact_person?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          building_type?: string | null
          building_year?: number | null
          surface_area?: string | null
          additional_info?: string | null
          requirements?: string[]
          responsibilities?: string[]
          skills_required?: string[]
          images?: string[]
          applications_count?: number
          views_count?: number
          bookmarks_count?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category_id?: string
          subcategory?: string | null
          manager_id?: string
          company_id?: string
          location?: string
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          budget_min?: number | null
          budget_max?: number | null
          budget_type?: 'fixed' | 'hourly' | 'negotiable' | 'range'
          currency?: string
          project_duration?: string | null
          deadline?: string | null
          urgency?: 'low' | 'medium' | 'high'
          status?: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
          type?: 'regular' | 'urgent' | 'premium'
          is_public?: boolean
          contact_person?: string | null
          contact_phone?: string | null
          contact_email?: string | null
          building_type?: string | null
          building_year?: number | null
          surface_area?: string | null
          additional_info?: string | null
          requirements?: string[]
          responsibilities?: string[]
          skills_required?: string[]
          images?: string[]
          applications_count?: number
          views_count?: number
          bookmarks_count?: number
          created_at?: string
          updated_at?: string
          published_at?: string | null
          expires_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      company_reviews: {
        Row: {
          id: string
          company_id: string
          reviewer_id: string
          job_id: string | null
          tender_id: string | null
          rating: number
          title: string | null
          comment: string | null
          categories: Json | null
          is_public: boolean
          is_verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          reviewer_id: string
          job_id?: string | null
          tender_id?: string | null
          rating: number
          title?: string | null
          comment?: string | null
          categories?: Json | null
          is_public?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          reviewer_id?: string
          job_id?: string | null
          tender_id?: string | null
          rating?: number
          title?: string | null
          comment?: string | null
          categories?: Json | null
          is_public?: boolean
          is_verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_reviews_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          }
        ]
      }
      company_ratings: {
        Row: {
          company_id: string
          average_rating: number | null
          total_reviews: number
          rating_breakdown: Json | null
          category_ratings: Json | null
          last_review_date: string | null
          updated_at: string
        }
        Insert: {
          company_id: string
          average_rating?: number | null
          total_reviews?: number
          rating_breakdown?: Json | null
          category_ratings?: Json | null
          last_review_date?: string | null
          updated_at?: string
        }
        Update: {
          company_id?: string
          average_rating?: number | null
          total_reviews?: number
          rating_breakdown?: Json | null
          category_ratings?: Json | null
          last_review_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_ratings_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          }
        ]
      }
      portfolio_projects: {
        Row: {
          id: string
          company_id: string
          title: string
          description: string | null
          category_id: string | null
          location: string | null
          project_type: string | null
          budget_range: string | null
          duration: string | null
          completion_date: string | null
          client_name: string | null
          client_feedback: string | null
          is_featured: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          title: string
          description?: string | null
          category_id?: string | null
          location?: string | null
          project_type?: string | null
          budget_range?: string | null
          duration?: string | null
          completion_date?: string | null
          client_name?: string | null
          client_feedback?: string | null
          is_featured?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          title?: string
          description?: string | null
          category_id?: string | null
          location?: string | null
          project_type?: string | null
          budget_range?: string | null
          duration?: string | null
          completion_date?: string | null
          client_name?: string | null
          client_feedback?: string | null
          is_featured?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_projects_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_projects_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "job_categories"
            referencedColumns: ["id"]
          }
        ]
      }
      portfolio_project_images: {
        Row: {
          id: string
          project_id: string
          file_id: string
          title: string | null
          description: string | null
          alt_text: string | null
          image_type: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          file_id: string
          title?: string | null
          description?: string | null
          alt_text?: string | null
          image_type?: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          file_id?: string
          title?: string | null
          description?: string | null
          alt_text?: string | null
          image_type?: string
          sort_order?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_project_images_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "portfolio_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_project_images_file_id_fkey"
            columns: ["file_id"]
            isOneToOne: false
            referencedRelation: "file_uploads"
            referencedColumns: ["id"]
          }
        ]
      }
      file_uploads: {
        Row: {
          id: string
          user_id: string
          file_name: string
          original_name: string
          file_path: string
          file_size: number
          mime_type: string
          file_type: string
          entity_type: string | null
          entity_id: string | null
          description: string | null
          alt_text: string | null
          is_public: boolean
          download_count: number
          virus_scan_status: string
          virus_scan_result: Json | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          original_name: string
          file_path: string
          file_size: number
          mime_type: string
          file_type: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string | null
          alt_text?: string | null
          is_public?: boolean
          download_count?: number
          virus_scan_status?: string
          virus_scan_result?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          original_name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          file_type?: string
          entity_type?: string | null
          entity_id?: string | null
          description?: string | null
          alt_text?: string | null
          is_public?: boolean
          download_count?: number
          virus_scan_status?: string
          virus_scan_result?: Json | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "file_uploads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      job_bookmarks: {
        Row: {
          id: string
          job_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          job_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          job_id?: string
          user_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_bookmarks_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_bookmarks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          email_notifications: boolean
          push_notifications: boolean
          sms_notifications: boolean
          new_job_notifications: boolean
          new_tender_notifications: boolean
          message_notifications: boolean
          status_update_notifications: boolean
          reminder_notifications: boolean
          marketing_notifications: boolean
          system_notifications: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email_notifications?: boolean
          push_notifications?: boolean
          sms_notifications?: boolean
          new_job_notifications?: boolean
          new_tender_notifications?: boolean
          message_notifications?: boolean
          status_update_notifications?: boolean
          reminder_notifications?: boolean
          marketing_notifications?: boolean
          system_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email_notifications?: boolean
          push_notifications?: boolean
          sms_notifications?: boolean
          new_job_notifications?: boolean
          new_tender_notifications?: boolean
          message_notifications?: boolean
          status_update_notifications?: boolean
          reminder_notifications?: boolean
          marketing_notifications?: boolean
          system_notifications?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: 'new_job' | 'new_tender' | 'application_received' | 'bid_received' | 'application_status_update' | 'bid_status_update' | 'job_assigned' | 'tender_awarded' | 'new_message' | 'review_received' | 'certificate_expiring' | 'deadline_reminder' | 'system_announcement' | 'subscription_expiring' | 'payment_failed' | 'verification_approved' | 'verification_rejected' | 'profile_completion_reminder'
          title: string
          message: string
          data: Json | null
          is_read: boolean
          read_at: string | null
          action_url: string | null
          expires_at: string | null
          priority: 'low' | 'normal' | 'high' | 'urgent'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: 'new_job' | 'new_tender' | 'application_received' | 'bid_received' | 'application_status_update' | 'bid_status_update' | 'job_assigned' | 'tender_awarded' | 'new_message' | 'review_received' | 'certificate_expiring' | 'deadline_reminder' | 'system_announcement' | 'subscription_expiring' | 'payment_failed' | 'verification_approved' | 'verification_rejected' | 'profile_completion_reminder'
          title: string
          message: string
          data?: Json | null
          is_read?: boolean
          read_at?: string | null
          action_url?: string | null
          expires_at?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'new_job' | 'new_tender' | 'application_received' | 'bid_received' | 'application_status_update' | 'bid_status_update' | 'job_assigned' | 'tender_awarded' | 'new_message' | 'review_received' | 'certificate_expiring' | 'deadline_reminder' | 'system_announcement' | 'subscription_expiring' | 'payment_failed' | 'verification_approved' | 'verification_rejected' | 'profile_completion_reminder'
          title?: string
          message?: string
          data?: Json | null
          is_read?: boolean
          read_at?: string | null
          action_url?: string | null
          expires_at?: string | null
          priority?: 'low' | 'normal' | 'high' | 'urgent'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh: string
          auth: string
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh?: string
          auth?: string
          user_agent?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add more tables as needed...
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
