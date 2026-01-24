-- =============================================
-- UPDATE EXISTING JOBS TO NEW CATEGORY SYSTEM
-- =============================================
-- This script maps old categories to new categories and updates all existing jobs

DO $$
DECLARE
    -- Old category IDs
    old_remonty_id UUID;
    old_instalacje_id UUID;
    old_wykonczenia_id UUID;
    old_sprzatanie_id UUID;
    old_zarzadzanie_id UUID;
    
    -- New category IDs (main categories)
    new_roboty_id UUID;
    new_sprzatanie_id UUID;
    new_zielen_id UUID;
    new_instalacje_id UUID;
    new_przeglady_id UUID;
    new_ekspertyzy_id UUID;
    
    -- New subcategory IDs
    new_termomodernizacja_id UUID;
    new_renowacja_klatek_id UUID;
    new_wymiana_stolarki_id UUID;
    new_biezace_sprzatanie_id UUID;
    new_mycie_okien_id UUID;
    new_pielegnacja_zieleni_id UUID;
    new_odsniezanie_id UUID;
    new_instalacje_elektryczne_id UUID;
    new_instalacje_wodno_kanalizacyjne_id UUID;
    new_serwis_wind_id UUID;
    new_przeglady_techniczne_id UUID;
    new_audyty_id UUID;
    new_projekty_id UUID;
    
    updated_count INTEGER;
BEGIN
    -- Get old category IDs
    SELECT id INTO old_remonty_id FROM job_categories WHERE slug = 'remonty-budownictwo' AND is_active = FALSE;
    SELECT id INTO old_instalacje_id FROM job_categories WHERE slug = 'instalacje-techniczne' AND is_active = FALSE;
    SELECT id INTO old_wykonczenia_id FROM job_categories WHERE slug = 'wykończenia-dekoracje' AND is_active = FALSE;
    SELECT id INTO old_sprzatanie_id FROM job_categories WHERE slug = 'usługi-sprzątające' AND is_active = FALSE;
    SELECT id INTO old_zarzadzanie_id FROM job_categories WHERE slug = 'zarządzanie-nieruchomościami' AND is_active = FALSE;
    
    -- Get new main category IDs
    SELECT id INTO new_roboty_id FROM job_categories WHERE slug = 'roboty-budowlane-remonty' AND is_active = TRUE;
    SELECT id INTO new_sprzatanie_id FROM job_categories WHERE slug = 'sprzatanie-utrzymanie-czystosci' AND is_active = TRUE;
    SELECT id INTO new_zielen_id FROM job_categories WHERE slug = 'zielen-tereny-zewnetrzne' AND is_active = TRUE;
    SELECT id INTO new_instalacje_id FROM job_categories WHERE slug = 'instalacje-systemy-techniczne' AND is_active = TRUE;
    SELECT id INTO new_przeglady_id FROM job_categories WHERE slug = 'przeglady-obsługa-techniczna' AND is_active = TRUE;
    SELECT id INTO new_ekspertyzy_id FROM job_categories WHERE slug = 'ekspertyzy-projekty' AND is_active = TRUE;
    
    -- Get new subcategory IDs
    SELECT id INTO new_termomodernizacja_id FROM job_categories WHERE slug = 'termomodernizacja-elewacje' AND is_active = TRUE;
    SELECT id INTO new_renowacja_klatek_id FROM job_categories WHERE slug = 'renowacja-klatek-schodowych' AND is_active = TRUE;
    SELECT id INTO new_wymiana_stolarki_id FROM job_categories WHERE slug = 'wymiana-stolarki' AND is_active = TRUE;
    SELECT id INTO new_biezace_sprzatanie_id FROM job_categories WHERE slug = 'biezace-sprzatanie' AND is_active = TRUE;
    SELECT id INTO new_mycie_okien_id FROM job_categories WHERE slug = 'mycie-okien-przeszklen' AND is_active = TRUE;
    SELECT id INTO new_pielegnacja_zieleni_id FROM job_categories WHERE slug = 'pielegnacja-roslinnosci' AND is_active = TRUE;
    SELECT id INTO new_odsniezanie_id FROM job_categories WHERE slug = 'odsniezanie-utrzymanie-zimowe' AND is_active = TRUE;
    SELECT id INTO new_instalacje_elektryczne_id FROM job_categories WHERE slug = 'instalacje-elektryczne-oswietlenie' AND is_active = TRUE;
    SELECT id INTO new_instalacje_wodno_kanalizacyjne_id FROM job_categories WHERE slug = 'instalacje-wodno-kanalizacyjne-co' AND is_active = TRUE;
    SELECT id INTO new_serwis_wind_id FROM job_categories WHERE slug = 'serwis-modernizacja-wind' AND is_active = TRUE;
    SELECT id INTO new_przeglady_techniczne_id FROM job_categories WHERE slug = 'obowiazkowe-przeglady-techniczne' AND is_active = TRUE;
    SELECT id INTO new_audyty_id FROM job_categories WHERE slug = 'audyty-energetyczne-esg' AND is_active = TRUE;
    SELECT id INTO new_projekty_id FROM job_categories WHERE slug = 'projekty-budowlane-inzynierskie' AND is_active = TRUE;
    
    -- =============================================
    -- MAPPING 1: Remonty i Budownictwo -> Roboty Budowlane i Remonty
    -- =============================================
    IF old_remonty_id IS NOT NULL AND new_roboty_id IS NOT NULL THEN
        -- Map main category
        UPDATE jobs 
        SET category_id = new_roboty_id
        WHERE category_id = old_remonty_id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % jobs from "Remonty i Budownictwo" to "Roboty Budowlane i Remonty"', updated_count;
        
        -- Map subcategories based on subcategory field
        -- Termomodernizacja
        IF new_termomodernizacja_id IS NOT NULL THEN
            UPDATE jobs 
            SET category_id = new_termomodernizacja_id
            WHERE category_id = old_remonty_id 
            AND (subcategory ILIKE '%termomodernizacja%' OR subcategory ILIKE '%ociepl%');
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            IF updated_count > 0 THEN
                RAISE NOTICE 'Updated % jobs to "Termomodernizacja i elewacje" subcategory', updated_count;
            END IF;
        END IF;
        
        -- Renowacja klatek (for remonty mieszkań that involve common areas)
        IF new_renowacja_klatek_id IS NOT NULL THEN
            UPDATE jobs 
            SET category_id = new_renowacja_klatek_id
            WHERE category_id = old_remonty_id 
            AND (subcategory ILIKE '%klatka%' OR subcategory ILIKE '%korytarz%' OR subcategory ILIKE '%wspólne%');
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            IF updated_count > 0 THEN
                RAISE NOTICE 'Updated % jobs to "Renowacja klatek schodowych" subcategory', updated_count;
            END IF;
        END IF;
        
        -- Wymiana stolarki
        IF new_wymiana_stolarki_id IS NOT NULL THEN
            UPDATE jobs 
            SET category_id = new_wymiana_stolarki_id
            WHERE category_id = old_remonty_id 
            AND (subcategory ILIKE '%okno%' OR subcategory ILIKE '%drzwi%' OR subcategory ILIKE '%stolark%');
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            IF updated_count > 0 THEN
                RAISE NOTICE 'Updated % jobs to "Wymiana stolarki" subcategory', updated_count;
            END IF;
        END IF;
    END IF;
    
    -- =============================================
    -- MAPPING 2: Instalacje Techniczne -> Instalacje i Systemy Techniczne
    -- =============================================
    IF old_instalacje_id IS NOT NULL AND new_instalacje_id IS NOT NULL THEN
        -- Map main category
        UPDATE jobs 
        SET category_id = new_instalacje_id
        WHERE category_id = old_instalacje_id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % jobs from "Instalacje Techniczne" to "Instalacje i Systemy Techniczne"', updated_count;
        
        -- Map subcategories
        -- Instalacje elektryczne
        IF new_instalacje_elektryczne_id IS NOT NULL THEN
            UPDATE jobs 
            SET category_id = new_instalacje_elektryczne_id
            WHERE category_id = old_instalacje_id 
            AND (subcategory ILIKE '%elektry%' OR subcategory ILIKE '%oświetlenie%');
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            IF updated_count > 0 THEN
                RAISE NOTICE 'Updated % jobs to "Instalacje elektryczne" subcategory', updated_count;
            END IF;
        END IF;
        
        -- Instalacje wodno-kanalizacyjne
        IF new_instalacje_wodno_kanalizacyjne_id IS NOT NULL THEN
            UPDATE jobs 
            SET category_id = new_instalacje_wodno_kanalizacyjne_id
            WHERE category_id = old_instalacje_id 
            AND (subcategory ILIKE '%wodn%' OR subcategory ILIKE '%kanaliz%' OR subcategory ILIKE '%hydraul%' OR subcategory ILIKE '%ogrzewan%' OR subcategory ILIKE '%c.o.%');
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            IF updated_count > 0 THEN
                RAISE NOTICE 'Updated % jobs to "Instalacje wodno-kanalizacyjne" subcategory', updated_count;
            END IF;
        END IF;
        
        -- Serwis wind
        IF new_serwis_wind_id IS NOT NULL THEN
            UPDATE jobs 
            SET category_id = new_serwis_wind_id
            WHERE category_id = old_instalacje_id 
            AND (subcategory ILIKE '%wind%' OR subcategory ILIKE '%dźwig%');
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            IF updated_count > 0 THEN
                RAISE NOTICE 'Updated % jobs to "Serwis i modernizacja wind" subcategory', updated_count;
            END IF;
        END IF;
    END IF;
    
    -- =============================================
    -- MAPPING 3: Wykończenia i Dekoracje -> Roboty Budowlane i Remonty (Renowacja klatek)
    -- =============================================
    IF old_wykonczenia_id IS NOT NULL AND new_renowacja_klatek_id IS NOT NULL THEN
        -- Most finishing work relates to renovation of common areas
        UPDATE jobs 
        SET category_id = new_renowacja_klatek_id
        WHERE category_id = old_wykonczenia_id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % jobs from "Wykończenia i Dekoracje" to "Renowacja klatek schodowych"', updated_count;
    END IF;
    
    -- =============================================
    -- MAPPING 4: Usługi Sprzątające -> Sprzątanie i Utrzymanie Czystości
    -- =============================================
    IF old_sprzatanie_id IS NOT NULL AND new_sprzatanie_id IS NOT NULL THEN
        -- Map main category
        UPDATE jobs 
        SET category_id = new_sprzatanie_id
        WHERE category_id = old_sprzatanie_id;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        RAISE NOTICE 'Updated % jobs from "Usługi Sprzątające" to "Sprzątanie i Utrzymanie Czystości"', updated_count;
        
        -- Map subcategories
        -- Bieżące sprzątanie
        IF new_biezace_sprzatanie_id IS NOT NULL THEN
            UPDATE jobs 
            SET category_id = new_biezace_sprzatanie_id
            WHERE category_id = old_sprzatanie_id 
            AND (subcategory ILIKE '%klatka%' OR subcategory ILIKE '%wspólne%' OR subcategory ILIKE '%korytarz%' OR subcategory ILIKE '%budynk%');
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            IF updated_count > 0 THEN
                RAISE NOTICE 'Updated % jobs to "Bieżące sprzątanie nieruchomości" subcategory', updated_count;
            END IF;
        END IF;
        
        -- Mycie okien
        IF new_mycie_okien_id IS NOT NULL THEN
            UPDATE jobs 
            SET category_id = new_mycie_okien_id
            WHERE category_id = old_sprzatanie_id 
            AND (subcategory ILIKE '%okno%' OR subcategory ILIKE '%fasad%');
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            IF updated_count > 0 THEN
                RAISE NOTICE 'Updated % jobs to "Mycie okien i przeszkleń" subcategory', updated_count;
            END IF;
        END IF;
    END IF;
    
    -- =============================================
    -- MAPPING 5: Zarządzanie Nieruchomościami -> Przeglądy i Obsługa Techniczna / Ekspertyzy
    -- =============================================
    IF old_zarzadzanie_id IS NOT NULL THEN
        -- Map to Przeglądy for maintenance/technical service jobs
        IF new_przeglady_id IS NOT NULL THEN
            UPDATE jobs 
            SET category_id = new_przeglady_id
            WHERE category_id = old_zarzadzanie_id 
            AND (subcategory ILIKE '%konserwacja%' OR subcategory ILIKE '%przegląd%' OR subcategory ILIKE '%serwis%' OR subcategory ILIKE '%napraw%');
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            IF updated_count > 0 THEN
                RAISE NOTICE 'Updated % jobs from "Zarządzanie Nieruchomościami" to "Przeglądy i Obsługa Techniczna"', updated_count;
            END IF;
            
            -- Map to specific subcategory: Przeglądy techniczne
            IF new_przeglady_techniczne_id IS NOT NULL THEN
                UPDATE jobs 
                SET category_id = new_przeglady_techniczne_id
                WHERE category_id = old_zarzadzanie_id 
                AND subcategory ILIKE '%przegląd%';
                
                GET DIAGNOSTICS updated_count = ROW_COUNT;
                IF updated_count > 0 THEN
                    RAISE NOTICE 'Updated % jobs to "Obowiązkowe przeglądy techniczne" subcategory', updated_count;
                END IF;
            END IF;
        END IF;
        
        -- Map to Ekspertyzy for consulting/audit jobs
        IF new_ekspertyzy_id IS NOT NULL THEN
            UPDATE jobs 
            SET category_id = new_ekspertyzy_id
            WHERE category_id = old_zarzadzanie_id 
            AND (subcategory ILIKE '%audyt%' OR subcategory ILIKE '%projekt%' OR subcategory ILIKE '%administracja%');
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            IF updated_count > 0 THEN
                RAISE NOTICE 'Updated % jobs from "Zarządzanie Nieruchomościami" to "Ekspertyzy i Projekty"', updated_count;
            END IF;
            
            -- Map to specific subcategories
            IF new_audyty_id IS NOT NULL THEN
                UPDATE jobs 
                SET category_id = new_audyty_id
                WHERE category_id = old_zarzadzanie_id 
                AND subcategory ILIKE '%audyt%';
                
                GET DIAGNOSTICS updated_count = ROW_COUNT;
                IF updated_count > 0 THEN
                    RAISE NOTICE 'Updated % jobs to "Audyty energetyczne" subcategory', updated_count;
                END IF;
            END IF;
            
            IF new_projekty_id IS NOT NULL THEN
                UPDATE jobs 
                SET category_id = new_projekty_id
                WHERE category_id = old_zarzadzanie_id 
                AND subcategory ILIKE '%projekt%';
                
                GET DIAGNOSTICS updated_count = ROW_COUNT;
                IF updated_count > 0 THEN
                    RAISE NOTICE 'Updated % jobs to "Projekty budowlane" subcategory', updated_count;
                END IF;
            END IF;
        END IF;
        
        -- Default: map remaining to Przeglądy
        IF new_przeglady_id IS NOT NULL THEN
            UPDATE jobs 
            SET category_id = new_przeglady_id
            WHERE category_id = old_zarzadzanie_id;
            
            GET DIAGNOSTICS updated_count = ROW_COUNT;
            IF updated_count > 0 THEN
                RAISE NOTICE 'Updated % remaining jobs to "Przeglądy i Obsługa Techniczna"', updated_count;
            END IF;
        END IF;
    END IF;
    
    -- =============================================
    -- UPDATE SUBCATEGORY FIELD NAMES
    -- =============================================
    -- Update subcategory field to match new subcategory names where applicable
    UPDATE jobs 
    SET subcategory = 'Termomodernizacja i elewacje'
    WHERE subcategory ILIKE '%termomodernizacja%' AND subcategory != 'Termomodernizacja i elewacje';
    
    UPDATE jobs 
    SET subcategory = 'Renowacja klatek schodowych i korytarzy'
    WHERE (subcategory ILIKE '%klatka%' OR subcategory ILIKE '%korytarz%') 
    AND subcategory != 'Renowacja klatek schodowych i korytarzy'
    AND category_id IN (SELECT id FROM job_categories WHERE slug = 'renowacja-klatek-schodowych');
    
    UPDATE jobs 
    SET subcategory = 'Wymiana stolarki okiennej i drzwiowej'
    WHERE (subcategory ILIKE '%okno%' OR subcategory ILIKE '%drzwi%' OR subcategory ILIKE '%stolark%')
    AND subcategory != 'Wymiana stolarki okiennej i drzwiowej'
    AND category_id IN (SELECT id FROM job_categories WHERE slug = 'wymiana-stolarki');
    
    UPDATE jobs 
    SET subcategory = 'Bieżące sprzątanie nieruchomości'
    WHERE (subcategory ILIKE '%klatka%' OR subcategory ILIKE '%wspólne%' OR subcategory ILIKE '%budynk%')
    AND subcategory != 'Bieżące sprzątanie nieruchomości'
    AND category_id IN (SELECT id FROM job_categories WHERE slug = 'biezace-sprzatanie');
    
    UPDATE jobs 
    SET subcategory = 'Mycie okien i przeszkleń'
    WHERE (subcategory ILIKE '%okno%' OR subcategory ILIKE '%fasad%')
    AND subcategory != 'Mycie okien i przeszkleń'
    AND category_id IN (SELECT id FROM job_categories WHERE slug = 'mycie-okien-przeszklen');
    
    UPDATE jobs 
    SET subcategory = 'Instalacje elektryczne i oświetlenie'
    WHERE (subcategory ILIKE '%elektry%' OR subcategory ILIKE '%oświetlenie%')
    AND subcategory != 'Instalacje elektryczne i oświetlenie'
    AND category_id IN (SELECT id FROM job_categories WHERE slug = 'instalacje-elektryczne-oswietlenie');
    
    UPDATE jobs 
    SET subcategory = 'Instalacje wodno-kanalizacyjne i C.O.'
    WHERE (subcategory ILIKE '%wodn%' OR subcategory ILIKE '%kanaliz%' OR subcategory ILIKE '%hydraul%' OR subcategory ILIKE '%ogrzewan%')
    AND subcategory != 'Instalacje wodno-kanalizacyjne i C.O.'
    AND category_id IN (SELECT id FROM job_categories WHERE slug = 'instalacje-wodno-kanalizacyjne-co');
    
    RAISE NOTICE 'Category migration completed successfully!';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error updating jobs: %', SQLERRM;
END $$;

-- Verify the update
SELECT 
    c.name as category_name,
    COUNT(j.id) as job_count
FROM job_categories c
LEFT JOIN jobs j ON j.category_id = c.id
WHERE c.is_active = TRUE
GROUP BY c.id, c.name, c.sort_order
ORDER BY c.sort_order, c.name;
