import pytest
import json
import sys
import os
from pathlib import Path
from unittest.mock import patch, MagicMock

# We need to patch the MongoClient before importing app
mock_db = MagicMock()
mock_client = MagicMock()
mock_client.expense_tracker = mock_db
patch('pymongo.MongoClient', return_value=mock_client).start()

# Now import app after patching
import app
from app import app as flask_app

@pytest.fixture
def client():
    """Create a test client for the app."""
    flask_app.config['TESTING'] = True
    with flask_app.test_client() as client:
        yield client

def test_home_route(client):
    """Test the home route returns expected message."""
    response = client.get('/')
    data = json.loads(response.data)
    assert response.status_code == 200
    assert data['message'] == "We're live!"

def test_login_user_success(client):
    """Test successful login returns JWT token."""
    # Mock the find_one method for this test
    mock_user = {
        'email': 'test@example.com',
        'password': '$2b$12$rj8MnLcKBxAgL7GUHvYne.LNLdHYgPa9klMk6xDqSQMAJMhVhZicm'  # 'password' hashed
    }
    
    with patch.object(app.db.users, 'find_one', return_value=mock_user):
        # Mock the password check
        with patch.object(app.bcrypt, 'check_password_hash', return_value=True):
            # Mock the JWT token creation
            with patch('app.create_access_token', return_value='dummy_token'):
                # Test login
                response = client.post('/auth/login',
                               data=json.dumps({'email': 'test@example.com', 'password': 'password'}),
                               content_type='application/json')
            
                data = json.loads(response.data)
                assert response.status_code == 200
                assert 'token' in data
                assert data['message'] == "Login successful! Token valid for 1 hour."

def test_login_user_not_found(client):
    """Test login with non-existent user returns 404."""
    # Mock the find_one method to return None
    with patch.object(app.db.users, 'find_one', return_value=None):
        # Test login with non-existent user
        response = client.post('/auth/login',
                           data=json.dumps({'email': 'nonexistent@example.com', 'password': 'password'}),
                           content_type='application/json')
        
        data = json.loads(response.data)
        assert response.status_code == 404
        assert data['message'] == "User not found."

def test_login_user_wrong_password(client):
    """Test login with wrong password returns 400."""
    # Mock the user
    mock_user = {
        'email': 'test@example.com',
        'password': '$2b$12$rj8MnLcKBxAgL7GUHvYne.LNLdHYgPa9klMk6xDqSQMAJMhVhZicm'  # 'password' hashed
    }
    
    # Mock the find_one method
    with patch.object(app.db.users, 'find_one', return_value=mock_user):
        # Mock the password check to fail
        with patch.object(app.bcrypt, 'check_password_hash', return_value=False):
            # Test login with wrong password
            response = client.post('/auth/login',
                               data=json.dumps({'email': 'test@example.com', 'password': 'wrongpassword'}),
                               content_type='application/json')
            
            data = json.loads(response.data)
            assert response.status_code == 400
            assert data['message'] == "Incorrect password."

def test_register_user_success(client):
    """Test successful user registration."""
    # Mock find_one to return None (user doesn't exist yet)
    with patch.object(app.db.users, 'find_one', return_value=None):
        # Mock insert_one to prevent actual DB operations
        with patch.object(app.db.users, 'insert_one') as mock_insert:
            # Mock bcrypt password hashing
            with patch.object(app.bcrypt, 'generate_password_hash', return_value=b'hashed_password'):
                # Mock datetime to have a consistent timestamp
                with patch('app.datetime') as mock_datetime:
                    mock_datetime.utcnow.return_value = "mocked_datetime"
                    
                    # Test registration
                    response = client.post('/auth/register',
                                       data=json.dumps({'email': 'new@example.com', 'password': 'newpassword'}),
                                       content_type='application/json')
                    
                    # Check the response
                    data = json.loads(response.data)
                    assert response.status_code == 201
                    assert data['message'] == "User registered successfully!"
                    
                    # Verify the mock was called with correct data
                    expected_call = {
                        'email': 'new@example.com',
                        'password': b'hashed_password',
                        'created_at': "mocked_datetime"
                    }
                    mock_insert.assert_called_once()

def test_register_user_already_exists(client):
    """Test registration when user already exists."""
    # Mock find_one to return an existing user
    existing_user = {'email': 'existing@example.com'}
    with patch.object(app.db.users, 'find_one', return_value=existing_user):
        # Test registration with existing user
        response = client.post('/auth/register',
                           data=json.dumps({'email': 'existing@example.com', 'password': 'password'}),
                           content_type='application/json')
        
        data = json.loads(response.data)
        assert response.status_code == 400
        assert data['message'] == "User already exists."