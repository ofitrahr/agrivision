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
    logo_url = db.Column(db.Text)
    subscription_plan = db.Column(db.String(50), default='Starter')
    max_farms = db.Column(db.Integer, default=5)
    max_users = db.Column(db.Integer, default=10)
    is_active = db.Column(db.Boolean, default=True)
    branding_color = db.Column(db.String(7), default='#2D6A4F')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Relationships 
    users = db.relationship('User', backref='company', cascade='all, delete-orphan')
    permissions = db.relationship('CompanyPermission', backref='company', uselist=False, cascade='all, delete-orphan')
    farms = db.relationship('Farm', backref='company', cascade='all, delete-orphan')
    farmers = db.relationship('Farmer', backref='company', cascade='all, delete-orphan')
    trace_templates = db.relationship('TraceTemplate', backref='company', cascade='all, delete-orphan')
    batches = db.relationship('Batch', backref='company', cascade='all, delete-orphan')
    financial_records = db.relationship('FinancialRecord', backref='company', cascade='all, delete-orphan')
    esg_metrics = db.relationship('EsgMetric', backref='company', cascade='all, delete-orphan')

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'))
    username = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    full_name = db.Column(db.String(255))
    phone = db.Column(db.String(20))
    photo_url = db.Column(db.Text)
    role = db.Column(db.String(20), nullable=False, default='manager')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class CompanyPermission(db.Model):
    __tablename__ = 'company_permissions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'))
    module_gis = db.Column(db.Boolean, default=True)
    module_traceability = db.Column(db.Boolean, default=True)
    module_agronomy = db.Column(db.Boolean, default=True)
    module_board_reports = db.Column(db.Boolean, default=True)
    can_access_ndvi = db.Column(db.Boolean, default=False)
    can_access_soc = db.Column(db.Boolean, default=False)
    can_access_yield = db.Column(db.Boolean, default=False)
    can_access_biomass = db.Column(db.Boolean, default=False)
    can_access_soilnpk = db.Column(db.Boolean, default=False)

class Farm(db.Model):
    __tablename__ = 'farms'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='SET NULL'))
    name = db.Column(db.String(255), nullable=False)
    crop_variety = db.Column(db.String(255))
    total_area_ha = db.Column(db.Numeric(10, 2))
    altitude = db.Column(db.String(50))
    boundary = db.Column(Geometry(geometry_type='POLYGON', srid=4326))
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Relationships
    blocks = db.relationship('FarmBlock', backref='farm', cascade='all, delete-orphan')
    gis_layers = db.relationship('GisLayer', backref='farm', cascade='all, delete-orphan')
    batches = db.relationship('Batch', backref='farm')

class Farmer(db.Model):
    __tablename__ = 'farmers'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'))
    name = db.Column(db.String(255), nullable=False)
    nik = db.Column(db.String(20))
    address = db.Column(db.Text)
    phone = db.Column(db.String(20))
    photo_url = db.Column(db.Text)
    gender = db.Column(db.String(20))
    age = db.Column(db.Integer)
    join_year = db.Column(db.Integer)
    farm_info = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FarmBlock(db.Model):
    __tablename__ = 'farm_blocks'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farms.id', ondelete='CASCADE'))
    farmer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farmers.id', ondelete='SET NULL'))
    name = db.Column(db.String(255))
    crop_type = db.Column(db.String(100))
    area_ha = db.Column(db.Numeric(10, 2))
    polygon = db.Column(Geometry(geometry_type='POLYGON', srid=4326))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Relationships
    batches = db.relationship('Batch', backref='block')
    agronomy_activities = db.relationship('AgronomyActivity', backref='block', cascade='all, delete-orphan')

class GisLayer(db.Model):
    __tablename__ = 'gis_layers'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farms.id', ondelete='CASCADE'))
    coordinate = db.Column(Geometry(geometry_type='POINT', srid=4326))
    parameter_type = db.Column(db.String(50), nullable=False)
    period = db.Column(db.String(50), nullable=False)
    numerical_value = db.Column(db.Numeric(12, 4))
    is_anomaly = db.Column(db.Boolean, default=False)

class TraceTemplate(db.Model):
    __tablename__ = 'trace_templates'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'))
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Relationships
    steps = db.relationship('TraceTemplateStep', backref='template', cascade='all, delete-orphan')
    batches = db.relationship('Batch', backref='template')

class TraceTemplateStep(db.Model):
    __tablename__ = 'trace_template_steps'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    template_id = db.Column(UUID(as_uuid=True), db.ForeignKey('trace_templates.id', ondelete='CASCADE'))
    step_order = db.Column(db.Integer, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    required_photo = db.Column(db.Boolean, default=False)
    required_location = db.Column(db.Boolean, default=False)
    required_notes = db.Column(db.Boolean, default=False)
    # Relationships
    checkpoints = db.relationship('BatchCheckpoint', backref='step')

class Batch(db.Model):
    __tablename__ = 'batches'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'))
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farms.id'))
    block_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farm_blocks.id'))
    template_id = db.Column(UUID(as_uuid=True), db.ForeignKey('trace_templates.id'))
    batch_number = db.Column(db.String(100), unique=True, nullable=False)
    product_name = db.Column(db.String(255), nullable=False)
    harvest_date = db.Column(db.Date)
    status = db.Column(db.String(50), default='in_progress')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    # Relationships
    checkpoints = db.relationship('BatchCheckpoint', backref='batch', cascade='all, delete-orphan')
    qr_codes = db.relationship('QrCode', backref='batch', cascade='all, delete-orphan')

class BatchCheckpoint(db.Model):
    __tablename__ = 'batch_checkpoints'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = db.Column(UUID(as_uuid=True), db.ForeignKey('batches.id', ondelete='CASCADE'))
    step_id = db.Column(UUID(as_uuid=True), db.ForeignKey('trace_template_steps.id'))
    completed_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    photo_url = db.Column(db.Text)
    notes = db.Column(db.Text)
    location = db.Column(Geometry(geometry_type='POINT', srid=4326))
    completed_at = db.Column(db.DateTime, default=datetime.utcnow)

class QrCode(db.Model):
    __tablename__ = 'qr_codes'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    batch_id = db.Column(UUID(as_uuid=True), db.ForeignKey('batches.id', ondelete='CASCADE'))
    qr_image_url = db.Column(db.Text, nullable=False)
    public_url = db.Column(db.Text, nullable=False)
    scan_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class AgronomyActivity(db.Model):
    __tablename__ = 'agronomy_activities'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    block_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farm_blocks.id', ondelete='CASCADE'))
    activity_type = db.Column(db.String(50), nullable=False)
    quantity = db.Column(db.Numeric(10, 2))
    unit = db.Column(db.String(20))
    notes = db.Column(db.Text)
    activity_date = db.Column(db.Date, nullable=False)
    created_by = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class FinancialRecord(db.Model):
    __tablename__ = 'financial_records'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'))
    farm_id = db.Column(UUID(as_uuid=True), db.ForeignKey('farms.id'))
    period = db.Column(db.String(20), nullable=False)
    operational_cost = db.Column(db.Numeric(15, 2), default=0)
    estimated_revenue = db.Column(db.Numeric(15, 2), default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class EsgMetric(db.Model):
    __tablename__ = 'esg_metrics'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = db.Column(UUID(as_uuid=True), db.ForeignKey('companies.id', ondelete='CASCADE'))
    period = db.Column(db.String(20), nullable=False)
    carbon_footprint = db.Column(db.Numeric(10, 2))
    water_usage = db.Column(db.Numeric(10, 2))
    biodiversity_index = db.Column(db.Numeric(5, 2))
    social_compliance_score = db.Column(db.Numeric(5, 2))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

