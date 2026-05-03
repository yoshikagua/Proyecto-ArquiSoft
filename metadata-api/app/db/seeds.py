"""
Database initialization script for MongoDB.
Creates indexes and seeds test data on application startup.
"""

from datetime import datetime
from app.db.mongo import get_scores_collection


async def create_indexes():
    """Create necessary indexes on the scores collection."""
    scores = get_scores_collection()
    
    try:
        # Index on user_id for fast lookups by user
        await scores.create_index("user_id")
        
        # Index on title for searching by score title
        await scores.create_index("title")
        
        # Index on composer for searching by composer
        await scores.create_index("composer")
        
        # Index on created_at for sorting by date
        await scores.create_index("created_at")
        
        # Compound index on user_id + created_at for efficient user queries
        await scores.create_index([("user_id", 1), ("created_at", -1)])
        
        print("✓ MongoDB indexes created successfully")
    except Exception as e:
        print(f"⚠ Error creating indexes: {e}")


async def seed_test_data():
    """Seed initial test data if collection is empty."""
    scores = get_scores_collection()
    
    try:
        # Check if collection already has documents
        count = await scores.count_documents({})
        if count > 0:
            print(f"✓ Collection already has {count} documents, skipping seed")
            return
        
        # Test user ID (would come from auth service in production)
        test_user_id = "test-user-001"
        
        test_scores = [
            {
                "title": "Symphony No. 5 in C Minor",
                "composer": "Ludwig van Beethoven",
                "genre": "Classical",
                "format": "Orquesta sinfónica",
                "year": 1808,
                "file_name": "beethoven_symphony5.pdf",
                "user_id": test_user_id,
                "content_type": "application/pdf",
                "object_key": "test/beethoven_symphony5_uuid.pdf",
                "description": "",
                "instruments": ["Violín", "Viola", "Violonchelo", "Contrabajo", "Trompeta", "Trombón", "Tuba", "Flauta", "Oboe", "Clarinete", "Percusión"],
                "likes_count": 0,
                "downloads": 0,
                "liked_by": [],
                "favorited_by": [],
                "comments": [],
                "created_at": datetime.utcnow(),
            },
            {
                "title": "Requiem in D Minor",
                "composer": "Wolfgang Amadeus Mozart",
                "genre": "Classical",
                "format": "Coro y orquesta",
                "year": 1791,
                "file_name": "mozart_requiem.musicxml",
                "user_id": test_user_id,
                "content_type": "application/vnd.recordare.musicxml+xml",
                "object_key": "test/mozart_requiem_uuid.musicxml",
                "description": "",
                "instruments": ["Violín", "Viola", "Violonchelo", "Contrabajo", "Trompeta", "Trombón", "Flauta", "Oboe", "Clarinete", "Percusión", "Órgano"],
                "likes_count": 0,
                "downloads": 0,
                "liked_by": [],
                "favorited_by": [],
                "comments": [],
                "created_at": datetime.utcnow(),
            },
            {
                "title": "Clair de lune",
                "composer": "Claude Debussy",
                "genre": "Romantic",
                "format": "Solista",
                "year": 1890,
                "file_name": "debussy_clair_de_lune.pdf",
                "user_id": test_user_id,
                "content_type": "application/pdf",
                "object_key": "test/debussy_clair_de_lune_uuid.pdf",
                "description": "",
                "instruments": ["Piano"],
                "likes_count": 0,
                "downloads": 0,
                "liked_by": [],
                "favorited_by": [],
                "comments": [],
                "created_at": datetime.utcnow(),
            },
            {
                "title": "The Four Seasons - Spring",
                "composer": "Antonio Vivaldi",
                "genre": "Baroque",
                "format": "Orquesta de cámara",
                "year": 1725,
                "file_name": "vivaldi_four_seasons_spring.musicxml",
                "user_id": test_user_id,
                "content_type": "application/vnd.recordare.musicxml+xml",
                "object_key": "test/vivaldi_spring_uuid.musicxml",
                "description": "",
                "instruments": ["Violín", "Viola", "Violonchelo", "Contrabajo"],
                "likes_count": 0,
                "downloads": 0,
                "liked_by": [],
                "favorited_by": [],
                "comments": [],
                "created_at": datetime.utcnow(),
            },
        ]
        
        result = await scores.insert_many(test_scores)
        print(f"✓ Seeded {len(result.inserted_ids)} test scores to MongoDB")
        
    except Exception as e:
        print(f"⚠ Error seeding test data: {e}")


async def init_database():
    """Initialize database (create indexes and seed test data)."""
    print("🔧 Initializing MongoDB...")
    await create_indexes()
    await seed_test_data()
    print("✓ Database initialization complete")
