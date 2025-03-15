import pytest
from app import app
import json
from unittest.mock import patch, MagicMock
from bson.objectid import ObjectId

@pytest.fixture
def client():
    """Create a test client for the app."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_home_route(client):
    """Test the home route returns expected message."""
    response = client.get('/')
    data = json.loads(response.data)
    assert response.status_code == 200
    assert data['message'] == "We're live!"

@patch('app.db.users.find_one')
def test_login_user_success(mock_find_one, client):
    """Test successful login returns JWT token."""
    # Mock the database response
    mock_user = {
        'email': 'test@example.com',
        'password': '$2b$12$rj8MnLcKBxAgL7GUHvYne.LNLdHYgPa9klMk6xDqSQMAJMhVhZicm'  # 'password' hashed
    }
    mock_find_one.return_value = mock_user
    
    # Mock the password check
    with patch('app.bcrypt.check_password_hash', return_value=True):
        # Test login
        response = client.post('/auth/login',
                           data=json.dumps({'email': 'test@example.com', 'password': 'password'}),
                           content_type='application/json')
        
        data = json.loads(response.data)
        assert response.status_code == 200
        assert 'token' in data
        assert data['message'] == "Login successful! Token valid for 1 hour."

@patch('app.db.users.find_one')
def test_login_user_not_found(mock_find_one, client):
    """Test login with non-existent user returns 404."""
    # Mock the database response for user not found
    mock_find_one.return_value = None
    
    # Test login with non-existent user
    response = client.post('/auth/login',
                       data=json.dumps({'email': 'nonexistent@example.com', 'password': 'password'}),
                       content_type='application/json')
    
    data = json.loads(response.data)
    assert response.status_code == 404
    assert data['message'] == "User not found."

@patch('app.db.users.find_one')
def test_login_user_wrong_password(mock_find_one, client):
    """Test login with wrong password returns 400."""
    # Mock the database response
    mock_user = {
        'email': 'test@example.com',
        'password': '$2b$12$rj8MnLcKBxAgL7GUHvYne.LNLdHYgPa9klMk6xDqSQMAJMhVhZicm'  # 'password' hashed
    }
    mock_find_one.return_value = mock_user
    
    # Mock the password check to fail
    with patch('app.bcrypt.check_password_hash', return_value=False):
        # Test login with wrong password
        response = client.post('/auth/login',
                           data=json.dumps({'email': 'test@example.com', 'password': 'wrongpassword'}),
                           content_type='application/json')
        
        data = json.loads(response.data)
        assert response.status_code == 400
        assert data['message'] == "Incorrect password."

@patch('app.db.users.find_one')
@patch('app.db.users.insert_one')
def test_register_user_success(mock_insert_one, mock_find_one, client):
    """Test successful user registration."""
    # Mock the database response for user not found
    mock_find_one.return_value = None
    mock_insert_one.return_value = MagicMock()
    
    # Mock bcrypt password hashing
    with patch('app.bcrypt.generate_password_hash', return_value=b'hashed_password'):
        # Test registration
        response = client.post('/auth/register',
                           data=json.dumps({'email': 'new@example.com', 'password': 'newpassword'}),
                           content_type='application/json')
        
        data = json.loads(response.data)
        assert response.status_code == 201
        assert data['message'] == "User registered successfully!"
        mock_insert_one.assert_called_once()

@patch('app.db.users.find_one')
def test_register_user_already_exists(mock_find_one, client):
    """Test registration when user already exists."""
    # Mock the database response for user already exists
    mock_find_one.return_value = {'email': 'existing@example.com'}
    
    # Test registration with existing user
    response = client.post('/auth/register',
                       data=json.dumps({'email': 'existing@example.com', 'password': 'password'}),
                       content_type='application/json')
    
    data = json.loads(response.data)
    assert response.status_code == 400
    assert data['message'] == "User already exists."