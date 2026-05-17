"""Base schema classes."""
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    
    class Config:
        from_attributes = True  # Pydantic v2: equivalent to orm_mode
        populate_by_name = True  # Pydantic v2: equivalent to allow_population_by_field_name


class TimestampedSchema(BaseSchema):
    """Schema with timestamp fields."""
    
    created_at: datetime
    updated_at: Optional[datetime] = None

