# Medical Mutual Plan Extraction System

## Overview

This system extracts comprehensive plan data from Medical Mutual PDF files and ingests it into the database. It's designed as a two-part pipeline for reliable data extraction and storage.

## System Architecture

### Part 1: PDF → JSON Extraction

- **Script**: `scripts/extract-medmutual-plans.mjs`
- **Input**: Medical Mutual PDF files in `/home/stav/Desktop/Insurance/carriers/MedMutual/`
- **Output**: `data/plans/MedMutual/medmutual-plans-extracted.json`
- **Tool**: `pdftotext` command-line utility for reliable PDF text extraction

### Part 2: JSON → Database Ingestion

- **Script**: `scripts/ingest-medmutual-plans.mjs`
- **Input**: `medmutual-plans-extracted.json`
- **Output**: Updated records in the `plans` table
- **Matching**: By CMS ID, plan year, and carrier

## Extracted Data Fields

### Core Plan Information

- `carrier` - "MedMutual"
- `plan_year` - Plan year (2025, 2026, etc.)
- `name` - Clean plan name (e.g., "Secure", "Access")
- `plan_type` - HMO, PPO, POS
- `cms_id` - Full CMS ID (e.g., "H4497-005-003")
- `cms_contract_number` - Contract number
- `cms_plan_number` - Plan number
- `cms_geo_segment` - Geo segment
- `counties` - Service area counties

### Financial Benefits

- `premium_monthly` - Monthly premium
- `medical_deductible` - General plan deductible
- `rx_deductible` - Prescription drug deductible
- `moop_in_network` - Maximum out-of-pocket (in-network)
- `moop_any_network` - Maximum out-of-pocket (any network)
- `otc_benefit_quarterly` - OTC benefit amount
- `dental_benefit_yearly` - Dental benefit amount
- `vision_benefit_yearly` - Vision benefit amount
- `hearing_benefit_yearly` - Hearing aid benefit amount

### Medical Copays

- `primary_care_copay` - Primary care physician visit
- `specialist_copay` - Specialist visit
- `emergency_room_copay` - Emergency room visit
- `urgent_care_copay` - Urgent care visit
- `ambulance_copay` - Ambulance transport
- `hospital_inpatient_per_day_copay` - Hospital inpatient per day
- `hospital_inpatient_days` - Number of days with copay

### Therapy & Specialized Services

- `physical_therapy_copay` - Physical therapy visit
- `occupational_therapy_copay` - Occupational therapy visit
- `speech_therapy_copay` - Speech therapy visit
- `mental_health_copay` - Mental health inpatient
- `substance_abuse_copay` - Substance abuse services
- `skilled_nursing_copay` - Skilled nursing facility
- `podiatry_copay` - Podiatry/foot care services
- `chiro_in_network_copay` - Chiropractic in-network copay
- `chiro_out_network_copay` - Chiropractic out-of-network copay

### Preventive & Wellness

- `routine_eye_exam_copay` - Routine eye exam
- `hearing_exam_copay` - Hearing exam
- `hearing_aid_fitting_copay` - Hearing aid fitting
- `fitness_benefit` - Fitness program (e.g., "SilverSneakers")
- `transportation_benefit` - Transportation trips

### Additional Benefits

- `card_benefit` - Card benefit amount
- `medicaid_eligibility` - Medicaid eligibility requirement
- `effective_start` - Plan effective start date
- `effective_end` - Plan effective end date

### Metadata

- `extraction_date` - When data was extracted
- `extraction_method` - How data was extracted
- `source_file` - Source PDF filename

## Usage

### Extract Plans from PDFs

```bash
node scripts/extract-medmutual-plans.mjs
```

### Ingest Plans into Database

```bash
node scripts/ingest-medmutual-plans.mjs
```

## Key Features

### Data Quality

- **Clean Plan Names**: Removes plan type suffixes (e.g., "Secure HMO-POS" → "Secure")
- **Sorted JSON**: Priority fields at top, remaining fields alphabetically sorted
- **Optional Benefits Filtering**: Ignores add-on benefits to focus on core plan benefits
- **Comprehensive Coverage**: 29+ fields per plan covering all major benefits

### Reliability

- **Robust PDF Parsing**: Uses `pdftotext` for reliable text extraction
- **Smart Matching**: Matches plans by CMS ID, year, and carrier
- **Error Handling**: Comprehensive error handling and validation
- **Audit Trail**: Complete extraction metadata for traceability

### Flexibility

- **Modular Design**: Separate extraction and ingestion scripts
- **Reusable**: Can be adapted for other carriers
- **Maintainable**: Clean, well-documented code structure

## Plan Coverage

The system successfully extracts data from all Medical Mutual plans:

### 2025 Plans

- Secure HMO-POS (H6723-005-001)
- Signature HMO-POS (H6723-006-006)

### 2026 Plans

- Access PPO (H4497-005-003)
- Choice HMO (H6723-002-001)
- Classic HMO (H6723-001-001)
- Plus HMO (H6723-003-001)
- Preferred PPO (H4497-002-001)
- Premium PPO (H4497-003-001)
- Select PPO (H4497-001-001)
- Signature HMO-POS (H6723-006-006)

## Special Features

### Chiropractic Coverage

- **Access PPO**: Only plan with both in-network ($15) and out-of-network ($40) coverage
- **HMO Plans**: In-network only coverage with various copays ($15-$20)

### Deductible Handling

- **Medical Deductible**: General plan deductible (most plans have $0)
- **RX Deductible**: Prescription drug deductible (varies by plan)

## Future Enhancements

- Support for additional carriers
- Automated PDF detection and processing
- Enhanced error reporting and validation
- Integration with plan comparison tools
- Real-time extraction monitoring

## Dependencies

- Node.js
- `pdftotext` command-line utility
- Supabase client library
- Access to Medical Mutual PDF files
- Database connection credentials
