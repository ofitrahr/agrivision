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

class RecentActivity(db.Model):
    __tablename__ = 'recent_activities'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    image_path = db.Column(db.String(500), nullable=True)
    activity_date = db.Column(db.Date, nullable=False)
    display_order = db.Column(db.Integer, nullable=False, default=0)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
