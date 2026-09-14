from app.db.database import db
import uuid
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
from geoalchemy2 import Geometry

class Company(db.Model):
    __tablename__ = 'companies'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    address = db.Column(db.Text)
    email = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    logo_url = db.Column(db.Text)
    subscription_plan = db.Column(db.String(50), nullable=False, default='Basic')
    max_farms = db.Column(db.Integer, nullable=False, default=5)
    max_users = db.Column(db.Integer, nullable=False, default=10)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    branding_color = db.Column(db.String(7), default='#2D6A4F')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Relationships 
    projects = db.relationship('Project', backref='company', cascade='all, delete-orphan')
    farmers = db.relationship('Farmer', backref='company', cascade='all, delete-orphan')
    trace_templates = db.relationship('TraceTemplate', backref='company', cascade='all, delete-orphan')
    batches = db.relationship('Batch', backref='company', cascade='all, delete-orphan')
    financial_records = db.relationship('FinancialRecord', backref='company', cascade='all, delete-orphan')
    harvest_records = db.relationship('HarvestRecord', backref='company', cascade='all, delete-orphan')
    esg_metrics = db.relationship('EsgMetric', backref='company', cascade='all, delete-orphan')
    company_sdgs = db.relationship('CompanySdg', backref='company', cascade='all, delete-orphan')
    sdg_verifications = db.relationship('CompanySdgVerification', backref='company', cascade='all, delete-orphan')

class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    commodity = db.Column(db.String(100))
    location = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default='active')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    farms = db.relationship('Farm', backref='project', cascade='all, delete-orphan')
    users = db.relationship('User', backref='project', cascade='all, delete-orphan')
    permissions = db.relationship('ProjectPermission', backref='project', uselist=False, cascade='all, delete-orphan')
    traceability = db.relationship('ProjectTraceability', backref='project', uselist=False, cascade='all, delete-orphan')
    traceability_profile = db.relationship('ProjectTraceabilityProfile', backref='project', uselist=False, cascade='all, delete-orphan')

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id', ondelete='CASCADE'))
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    photo_url = db.Column(db.Text)
    role = db.Column(db.String(20), nullable=False, default='manager')
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    last_login_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProjectPermission(db.Model):
    __tablename__ = 'project_permissions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id', ondelete='CASCADE'), unique=True)
    module_gis = db.Column(db.Boolean, nullable=False, default=True)
    module_traceability = db.Column(db.Boolean, nullable=False, default=True)
    module_agronomy = db.Column(db.Boolean, nullable=False, default=True)
    module_board_reports = db.Column(db.Boolean, nullable=False, default=True)
    can_access_ndvi = db.Column(db.Boolean, nullable=False, default=False)
    can_access_soc = db.Column(db.Boolean, nullable=False, default=False)
    can_access_yield = db.Column(db.Boolean, nullable=False, default=False)
    can_access_biomass = db.Column(db.Boolean, nullable=False, default=False)
    can_access_soilnpk = db.Column(db.Boolean, nullable=False, default=False)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

class ProjectTraceability(db.Model):
    __tablename__ = 'project_traceabilities'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, unique=True)
    hero_image_url = db.Column(db.Text)
    origin_story = db.Column(db.Text)
    social_description = db.Column(db.Text)
    economic_description = db.Column(db.Text)
    environmental_description = db.Column(db.Text)
    is_published = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

class Sdg(db.Model):
    __tablename__ = 'sdgs'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = db.Column(db.String(20), nullable=False, unique=True)
    title = db.Column(db.String(255), nullable=False)
    goal = db.Column(db.Text)
    image_url = db.Column(db.Text)
    icon = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    # Relationships
    company_sdgs = db.relationship('CompanySdg', backref='sdg', cascade='all, delete-orphan')

class CompanySdg(db.Model):
    __tablename__ = 'company_sdgs'
    __table_args__ = (
        db.UniqueConstraint('company_id', 'sdg_id', name='uq_company_sdg'),
    )

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    sdg_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sdgs.id', ondelete='CASCADE'), nullable=False)
    description = db.Column(db.Text)
    display_order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

class CompanySdgVerification(db.Model):
    __tablename__ = 'company_sdg_verifications'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False, unique=True)
    assessed_by = db.Column(db.String(255))
    evidence_file_url = db.Column(db.Text)
    evidence_file_type = db.Column(db.String(20))
    assessment_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

class Farm(db.Model):
    __tablename__ = 'farms'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    crop_variety = db.Column(db.String(255))
    total_area_ha = db.Column(db.Numeric(10, 2))
    altitude = db.Column(db.String(50))
    agroforestry_system = db.Column(db.String(100))
    boundary = db.Column(Geometry(geometry_type='POLYGON', srid=4326))
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='SET NULL'))
    status = db.Column(db.String(20), nullable=False, default='active')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Relationships
    gis_layers = db.relationship('GisLayer', backref='farm', cascade='all, delete-orphan')
    batches = db.relationship('Batch', backref='farm')
    
    farmers = db.relationship('Farmer', secondary='farm_farmers', backref=db.backref('farms', lazy='dynamic'))
    crops = db.relationship('FarmCrop', backref='farm', cascade='all, delete-orphan')

farm_farmers = db.Table('farm_farmers',
    db.Column('farm_id', UUID(as_uuid=True), db.ForeignKey('farms.id', ondelete='CASCADE'), primary_key=True),
    db.Column('farmer_id', UUID(as_uuid=True), db.ForeignKey('farmers.id', ondelete='CASCADE'), primary_key=True),
    db.Column('assigned_at', db.DateTime, nullable=False, default=datetime.utcnow)
)

class FarmCrop(db.Model):
    __tablename__ = 'farm_crops'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False)
    crop_type = db.Column(db.String(100), nullable=False)
    variety = db.Column(db.String(255))
    planting_date = db.Column(db.Date)
    area_ha = db.Column(db.Numeric(10, 2))
    status = db.Column(db.String(20), nullable=False, default='active')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class Farmer(db.Model):
    __tablename__ = 'farmers'
    __table_args__ = (
        db.UniqueConstraint('company_id', 'phone', name='uq_company_farmer_phone'),
    )
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    address = db.Column(db.Text)
    phone = db.Column(db.String(20))
    photo_url = db.Column(db.Text)
    gender = db.Column(db.String(20))
    birth_year = db.Column(db.Integer)
    join_year = db.Column(db.Integer)
    farm_info = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def age(self):
        if self.birth_year:
            return datetime.utcnow().year - self.birth_year
        return None



class GisLayer(db.Model):
    __tablename__ = 'gis_layers'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False)
    coordinate = db.Column(Geometry(geometry_type='POINT', srid=4326))
    parameter_type = db.Column(db.String(50), nullable=False)
    period = db.Column(db.String(50), nullable=False)
    numerical_value = db.Column(db.Numeric(12, 4))
    unit = db.Column(db.String(20))
    is_anomaly = db.Column(db.Boolean, nullable=False, default=False)
    source = db.Column(db.String(100))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class TraceTemplate(db.Model):
    __tablename__ = 'trace_templates'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Relationships
    steps = db.relationship('TraceTemplateStep', backref='template', cascade='all, delete-orphan')
    batches = db.relationship('Batch', backref='template')

class TraceTemplateStep(db.Model):
    __tablename__ = 'trace_template_steps'
    __table_args__ = (
        db.UniqueConstraint('template_id', 'step_order', name='uq_template_step_order'),
    )
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = db.Column(UUID(as_uuid=True), db.ForeignKey('trace_templates.id', ondelete='CASCADE'), nullable=False)
    step_order = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    required_photo = db.Column(db.Boolean, nullable=False, default=False)
    required_location = db.Column(db.Boolean, nullable=False, default=False)
    required_notes = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Relationships
    checkpoints = db.relationship('BatchCheckpoint', backref='step')

class Batch(db.Model):
    __tablename__ = 'batches'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farms.id', ondelete='SET NULL'))
    template_id = db.Column(UUID(as_uuid=True), db.ForeignKey('trace_templates.id', ondelete='SET NULL'))
    batch_number = db.Column(db.String(100), unique=True, nullable=False)
    product_name = db.Column(db.String(255), nullable=False)
    harvest_date = db.Column(db.Date)
    status = db.Column(db.String(50), nullable=False, default='in_progress')
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    # Relationships
    checkpoints = db.relationship('BatchCheckpoint', backref='batch', cascade='all, delete-orphan')
    qr_codes = db.relationship('QrCode', backref='batch', cascade='all, delete-orphan')

class BatchCheckpoint(db.Model):
    __tablename__ = 'batch_checkpoints'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = db.Column(UUID(as_uuid=True), db.ForeignKey('batches.id', ondelete='CASCADE'), nullable=False)
    step_id = db.Column(UUID(as_uuid=True), db.ForeignKey('trace_template_steps.id', ondelete='SET NULL'))
    completed_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='SET NULL'))
    status = db.Column(db.String(20), nullable=False, default='pending')
    photo_url = db.Column(db.Text)
    notes = db.Column(db.Text)
    location = db.Column(Geometry(geometry_type='POINT', srid=4326))
    completed_at = db.Column(db.DateTime)

class QrCode(db.Model):
    __tablename__ = 'qr_codes'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = db.Column(UUID(as_uuid=True), db.ForeignKey('batches.id', ondelete='CASCADE'), nullable=False)
    qr_image_url = db.Column(db.Text, nullable=False)
    public_url = db.Column(db.Text, nullable=False)
    scan_count = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

class AgronomyActivity(db.Model):
    __tablename__ = 'agronomy_activities'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farms.id', ondelete='CASCADE'), nullable=False)
    activity_type = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Numeric(10, 2))
    unit = db.Column(db.String(20))
    notes = db.Column(db.Text)
    activity_date = db.Column(db.Date, nullable=False)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='SET NULL'))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

class HarvestRecord(db.Model):
    __tablename__ = 'harvest_records'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farms.id', ondelete='SET NULL'))
    period = db.Column(db.String(20), nullable=False)
    yield_kg = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    area_harvested_ha = db.Column(db.Numeric(10, 2))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

class FinancialRecord(db.Model):
    __tablename__ = 'financial_records'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farms.id', ondelete='SET NULL'))
    period = db.Column(db.String(20), nullable=False)
    total_production_kg = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    operational_cost = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    estimated_revenue = db.Column(db.Numeric(15, 2), nullable=False, default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

class EsgMetric(db.Model):
    __tablename__ = 'esg_metrics'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'), nullable=False)
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farms.id', ondelete='SET NULL'))
    period = db.Column(db.String(20), nullable=False)
    carbon_footprint = db.Column(db.Numeric(10, 2))
    water_usage = db.Column(db.Numeric(10, 2))
    biodiversity_index = db.Column(db.Numeric(5, 2))
    social_compliance_score = db.Column(db.Numeric(5, 2))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='SET NULL'))
    action = db.Column(db.String(50), nullable=False)
    entity_type = db.Column(db.String(50), nullable=False)
    entity_id = db.Column(UUID(as_uuid=True))
    details = db.Column(db.Text)
    ip_address = db.Column(db.String(45))
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)


# =======================================================================
# ARSITEKTUR TRACEABILITY BARU (Project-based Questionnaire -> SDG)
# Digunakan paralel dengan arsitektur lama. Jangan dihapus.
# =======================================================================

class SdgMaster(db.Model):
    """SDG Master (plan revisi #19.1). Menyimpan threshold/konfigurasi per goal.

    Threshold bersifat configurable & bisa berbeda antar goal (plan revisi, catatan
    akhir). Status SDG dihitung oleh engine (bukan dipilih manual).
    """
    __tablename__ = 'sdg_masters'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    goal_number = db.Column(db.Integer, nullable=False, unique=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    image_url = db.Column(db.Text)
    # Threshold/methodology config (plan revisi #15, #44) -- configurable per goal
    fulfilled_score = db.Column(db.Numeric(5, 2), nullable=False, default=70.00)
    minimum_applicable_questions = db.Column(db.Integer, nullable=False, default=2)
    minimum_question_score = db.Column(db.Numeric(5, 2), nullable=False, default=50.00)
    minimum_question_coverage = db.Column(db.Numeric(5, 2), nullable=False, default=50.00)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    project_sdgs = db.relationship('ProjectSdg', backref='sdg_master', cascade='all, delete-orphan')
    indicators = db.relationship('SdgIndicator', backref='sdg_master', cascade='all, delete-orphan')


class SdgIndicator(db.Model):
    """Indikator SDG dari metadata (plan revisi #19.2).

    `is_applicable` menandai apakah indikator dapat diterjemahkan menjadi
    pertanyaan tingkat project (APPLICABLE) atau tidak (NOT_APPLICABLE).
    Klasifikasi asli metadata tidak diubah.
    """
    __tablename__ = 'sdg_indicators'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    goal_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sdg_masters.id', ondelete='CASCADE'), nullable=False)
    target_code = db.Column(db.String(20))
    target_name = db.Column(db.Text)
    indicator_code = db.Column(db.String(30), nullable=False)
    indicator_name = db.Column(db.Text, nullable=False)
    classification = db.Column(db.String(50))
    is_applicable = db.Column(db.Boolean, nullable=False, default=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('goal_id', 'indicator_code', name='uq_sdg_indicator_code'),
    )

    question_mappings = db.relationship('QuestionIndicator', backref='indicator', cascade='all, delete-orphan')


class ProjectTraceabilityProfile(db.Model):
    """project_traceability (plan.md #4). 1 project -> 1 traceability."""
    __tablename__ = 'project_traceability_profiles'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = db.Column(UUID(as_uuid=True), db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False, unique=True)
    title = db.Column(db.String(255))
    tagline = db.Column(db.String(255))
    hero_image_url = db.Column(db.Text)
    origin_story = db.Column(db.Text)
    description = db.Column(db.Text)
    social_narrative = db.Column(db.Text)
    economic_narrative = db.Column(db.Text)
    environmental_narrative = db.Column(db.Text)
    status = db.Column(db.String(20), nullable=False, default='draft')
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    assessments = db.relationship('TraceAssessment', backref='project_traceability', cascade='all, delete-orphan')
    project_sdgs = db.relationship('ProjectSdg', backref='project_traceability', cascade='all, delete-orphan')


class Questionnaire(db.Model):
    """Questionnaire master (plan.md #10)."""
    __tablename__ = 'questionnaires'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    version = db.Column(db.String(20), nullable=False, default='1.0')
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    sections = db.relationship('QuestionSection', backref='questionnaire', cascade='all, delete-orphan')
    questions = db.relationship('Question', backref='questionnaire', cascade='all, delete-orphan')
    assessments = db.relationship('TraceAssessment', backref='questionnaire')


class QuestionSection(db.Model):
    """Question section / grouping (plan.md #12)."""
    __tablename__ = 'question_sections'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    questionnaire_id = db.Column(UUID(as_uuid=True), db.ForeignKey('questionnaires.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    section_order = db.Column(db.Integer, nullable=False, default=0)

    questions = db.relationship('Question', backref='section', cascade='all, delete-orphan')


class Question(db.Model):
    """Question (plan revisi #19.3).

    Satu pertanyaan hanya mewakili SATU SDG Goal (`sdg_id`). Semua versi saat ini
    bertipe SINGLE_CHOICE. `indicator_mappings` menghubungkan pertanyaan ke
    indikator indikator dalam SDG yang sama.
    """
    __tablename__ = 'questions'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    questionnaire_id = db.Column(UUID(as_uuid=True), db.ForeignKey('questionnaires.id', ondelete='CASCADE'), nullable=False)
    section_id = db.Column(UUID(as_uuid=True), db.ForeignKey('question_sections.id', ondelete='CASCADE'))
    sdg_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sdg_masters.id', ondelete='SET NULL'))
    question_text = db.Column(db.Text, nullable=False)
    purpose = db.Column(db.Text)
    question_type = db.Column(db.String(20), nullable=False, default='single_choice')
    weight = db.Column(db.Numeric(5, 2), nullable=False, default=1.00)
    question_order = db.Column(db.Integer, nullable=False, default=0)
    is_required = db.Column(db.Boolean, nullable=False, default=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    options = db.relationship('QuestionOption', backref='question', cascade='all, delete-orphan')
    indicator_mappings = db.relationship('QuestionIndicator', backref='question', cascade='all, delete-orphan')
    assessment_answers = db.relationship('AssessmentAnswer', backref='question')
    sdg_master = db.relationship('SdgMaster', backref='questions')

    @property
    def sdg_goal_number(self):
        return self.sdg_master.goal_number if self.sdg_master else None


class QuestionIndicator(db.Model):
    """Question -> Indicator mapping (plan revisi #19.5).

    PENTING: semua indikator yang dimapping harus berasal dari SDG yang sama
    dengan `question.sdg_id`. Divalidasi pada layer service.
    """
    __tablename__ = 'question_indicator_mappings'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = db.Column(UUID(as_uuid=True), db.ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    indicator_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sdg_indicators.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('question_id', 'indicator_id', name='uq_question_indicator'),
    )


class QuestionOption(db.Model):
    """Question option / answer choice (plan revisi #19.4, #18)."""
    __tablename__ = 'question_options'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = db.Column(UUID(as_uuid=True), db.ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    option_text = db.Column(db.Text, nullable=False)
    score = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    option_order = db.Column(db.Integer, nullable=False, default=0)
    is_exclusive = db.Column(db.Boolean, nullable=False, default=False)


class TraceAssessment(db.Model):
    """Assessment / satu pelaksanaan questionnaire utk satu project (plan.md #20-#23)."""
    __tablename__ = 'trace_assessments'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_traceability_id = db.Column(UUID(as_uuid=True), db.ForeignKey('project_traceability_profiles.id', ondelete='CASCADE'), nullable=False)
    questionnaire_id = db.Column(UUID(as_uuid=True), db.ForeignKey('questionnaires.id', ondelete='SET NULL'))
    assessor_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='SET NULL'))
    respondent_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='SET NULL'))
    status = db.Column(db.String(20), nullable=False, default='draft')
    started_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    notes = db.Column(db.Text)
    evidence_url = db.Column(db.Text)
    assessor_name = db.Column(db.String(255))
    assessed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    answers = db.relationship('AssessmentAnswer', backref='assessment', cascade='all, delete-orphan')
    sdg_results = db.relationship('AssessmentSdgResult', backref='assessment', cascade='all, delete-orphan')


class AssessmentAnswer(db.Model):
    """Assessment answer (plan revisi #21).

    `selected_option_id` = opsi SINGLE_CHOICE yang dipilih; `score` = snapshot
    nilai opsi saat assessment diisi (agar hasil historis tidak berubah jika
    skor opsi master diperbarui).
    """
    __tablename__ = 'assessment_answers'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = db.Column(UUID(as_uuid=True), db.ForeignKey('trace_assessments.id', ondelete='CASCADE'), nullable=False)
    question_id = db.Column(UUID(as_uuid=True), db.ForeignKey('questions.id', ondelete='CASCADE'), nullable=False)
    selected_option_id = db.Column(UUID(as_uuid=True), db.ForeignKey('question_options.id', ondelete='SET NULL'))
    answer_text = db.Column(db.Text)
    score = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    answered_at = db.Column(db.DateTime)

    __table_args__ = (
        db.UniqueConstraint('assessment_id', 'question_id', name='uq_assessment_question_answer'),
    )


class AssessmentSdgResult(db.Model):
    """Result kalkulasi kontribusi SDG utk assessment (plan revisi #22, #13).

    Status dihitung engine menggunakan threshold configurable per goal. Bukan
    input manual. Menyimpan rincian pertanyaan yg applicable/terjawab/memenuhi
    syarat minimal + coverage utk menjelaskan status.
    """
    __tablename__ = 'assessment_sdg_results'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assessment_id = db.Column(UUID(as_uuid=True), db.ForeignKey('trace_assessments.id', ondelete='CASCADE'), nullable=False)
    sdg_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sdg_masters.id', ondelete='CASCADE'), nullable=False)
    score = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    threshold = db.Column(db.Numeric(5, 2), nullable=False, default=70.00)
    status = db.Column(db.String(30), nullable=False, default='NOT_ASSESSED')
    applicable_question_count = db.Column(db.Integer, nullable=False, default=0)
    answered_question_count = db.Column(db.Integer, nullable=False, default=0)
    qualified_question_count = db.Column(db.Integer, nullable=False, default=0)
    coverage_percentage = db.Column(db.Numeric(5, 2), nullable=False, default=0)
    is_met = db.Column(db.Boolean, nullable=False, default=False)
    calculated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('assessment_id', 'sdg_id', name='uq_assessment_sdg_result'),
    )

    sdg_master = db.relationship('SdgMaster', backref='assessment_sdg_results')


class ProjectSdg(db.Model):
    """Project SDG terpenuhi (plan.md #7, #29). Ditentukan Admin via checklist."""
    __tablename__ = 'project_sdgs_new'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_traceability_id = db.Column(UUID(as_uuid=True), db.ForeignKey('project_traceability_profiles.id', ondelete='CASCADE'), nullable=False)
    assessment_sdg_result_id = db.Column(UUID(as_uuid=True), db.ForeignKey('assessment_sdg_results.id', ondelete='SET NULL'))
    sdg_id = db.Column(UUID(as_uuid=True), db.ForeignKey('sdg_masters.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('project_traceability_id', 'sdg_id', name='uq_project_sdg'),
    )


class ProjectSdgVerification(db.Model):
    """Verifikasi SDG per project (assessor + bukti). paralel company_sdg_verifications."""
    __tablename__ = 'project_sdg_verifications'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_traceability_id = db.Column(UUID(as_uuid=True), db.ForeignKey('project_traceability_profiles.id', ondelete='CASCADE'), nullable=False, unique=True)
    assessed_by = db.Column(db.String(255))
    evidence_file_url = db.Column(db.Text)
    evidence_file_type = db.Column(db.String(20))
    assessment_date = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    project_traceability = db.relationship('ProjectTraceabilityProfile', backref=db.backref('sdg_verification', uselist=False))
