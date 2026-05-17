"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('email', sa.String(255), unique=True, nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('hashed_password', sa.String(255), nullable=True),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('supabase_uid', sa.String(36), unique=True, nullable=True, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create conversations table
    op.create_table(
        'conversations',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('title', sa.String(200), nullable=True),
        sa.Column('summary', sa.Text, nullable=True),
        sa.Column('emotion_context', sa.String(50), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create messages table
    op.create_table(
        'messages',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('conversation_id', sa.String(36), sa.ForeignKey('conversations.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('role', sa.String(20), nullable=False),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('emotion', sa.String(50), nullable=True),
        sa.Column('emotion_confidence', sa.Float, nullable=True),
        sa.Column('model_used', sa.String(50), nullable=True),
        sa.Column('token_count', sa.Integer, nullable=True),
        sa.Column('crisis_flag', sa.Boolean, default=False),
        sa.Column('crisis_severity', sa.String(20), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create mood_logs table
    op.create_table(
        'mood_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('mood', sa.Integer, nullable=False),
        sa.Column('stress', sa.Integer, nullable=True),
        sa.Column('energy', sa.Integer, nullable=True),
        sa.Column('sleep', sa.Integer, nullable=True),
        sa.Column('emotion_detected', sa.String(50), nullable=True),
        sa.Column('emotion_confidence', sa.Float, nullable=True),
        sa.Column('ai_note', sa.Text, nullable=True),
        sa.Column('note', sa.Text, nullable=True),
        sa.Column('logged_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create journals table
    op.create_table(
        'journals',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('title', sa.String(200), nullable=True),
        sa.Column('content', sa.Text, nullable=False),
        sa.Column('emotion_summary', sa.Text, nullable=True),
        sa.Column('emotion_tags', sa.String(200), nullable=True),
        sa.Column('sentiment_score', sa.Float, nullable=True),
        sa.Column('ai_insights', sa.Text, nullable=True),
        sa.Column('word_count', sa.Integer, nullable=True),
        sa.Column('reading_time_minutes', sa.Integer, nullable=True),
        sa.Column('written_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create habits table
    op.create_table(
        'habits',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('color', sa.String(7), nullable=True),
        sa.Column('frequency', sa.String(20), nullable=False, default='daily'),
        sa.Column('target_count', sa.Integer, nullable=False, default=1),
        sa.Column('current_streak', sa.Integer, default=0),
        sa.Column('longest_streak', sa.Integer, default=0),
        sa.Column('total_completions', sa.Integer, default=0),
        sa.Column('is_active', sa.Boolean, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create habit_completions table
    op.create_table(
        'habit_completions',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('habit_id', sa.String(36), sa.ForeignKey('habits.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('completed_at', sa.Date, nullable=False),
        sa.Column('count', sa.Integer, default=1),
        sa.Column('note', sa.Text, nullable=True),
        sa.Column('ai_feedback', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
    )
    
    # Create memories table
    op.create_table(
        'memories',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('memory_text', sa.Text, nullable=False),
        sa.Column('pinecone_id', sa.String(36), unique=True, nullable=True, index=True),
        sa.Column('importance', sa.Float, default=0.5),
        sa.Column('emotion', sa.String(50), nullable=True),
        sa.Column('category', sa.String(50), nullable=True),
        sa.Column('source_type', sa.String(50), nullable=True),
        sa.Column('source_id', sa.String(36), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_accessed', sa.DateTime(timezone=True), nullable=False),
    )


def downgrade() -> None:
    op.drop_table('memories')
    op.drop_table('habit_completions')
    op.drop_table('habits')
    op.drop_table('journals')
    op.drop_table('mood_logs')
    op.drop_table('messages')
    op.drop_table('conversations')
    op.drop_table('users')

