from flask import Flask, jsonify, request
from pymongo import MongoClient
from datetime import datetime, timedelta
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_bcrypt import Bcrypt
from bson.objectid import ObjectId
import bcrypt

###################### CONFIGURATION ######################

app = Flask(__name__)
CORS(app)

# Set up secret key for JWT
app.config["JWT_SECRET_KEY"] = 'super_secure_and_badass_jwt_secret'
jwt = JWTManager(app)
bcrypt = Bcrypt(app)

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client.expense_tracker # Connect to the database

###################### API ROUTING ######################

# POST route to register a user
@app.route('/auth/register', methods = ['POST'])
def register_user():

    data = request.get_json()

    # Check if user exists
    existing_user = db.users.find_one({ 'email': data['email'] })
    if existing_user:
        return jsonify(message = "User already exists."), 400
    
    # Hash the user's password
    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')

    # Save the new user
    db.users.insert_one({
        'email': data['email'],
        'password': hashed_password,
        'created_at': datetime.utcnow()
        })
    
    return jsonify(message = "User registered successfully!"), 201

# POST route to log in a user
@app.route('/auth/login', methods = ['POST'])
def login_user():

    data = request.get_json()

    # Check if user exists
    existing_user = db.users.find_one({ 'email': data['email'] })
    if not existing_user:
        return jsonify(message = "User not found."), 404
    
    # Verify the password
    if bcrypt.check_password_hash(existing_user['password'], data['password']):

        # Generate JWT
        token = create_access_token(identity = existing_user['email'], expires_delta = timedelta(hours=1))
        return jsonify(message = "Login successful! Token valid for 1 hour.", token = token), 200
    
    else:
        return jsonify(message = "Incorrect password."), 400
    
# POST route to add a new expense
@app.route('/expenses', methods = ['POST'])
@jwt_required()
def add_expense():
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        if not data:
            return jsonify(message = "No data provided"), 400
        
        # Ensure required fields are present
        if not all(k in data for k in ['amount', 'category', 'description']):
            return jsonify(message = "Missing required fields."), 400
        
        # Add the expense to the database
        expense = {
            "user_id": str(user_id),
            "amount": data['amount'],
            "category": data['category'],
            "description": data['description'],
            "date": datetime.utcnow()
        }
        db.expenses.insert_one(expense)
        return jsonify(message = "Expense added successfully."), 200
    
    except Exception as e:
        return jsonify(message = f"Error adding expense: {str(e)}"), 500
    
# GET route to fetch all expenses for a user
@app.route('/expenses', methods = ['GET'])
@jwt_required()
def get_expenses():
    try:
        user_id = str(get_jwt_identity())
        expenses = list(db.expenses.find({ "user_id": user_id }))
        if not expenses:
            return jsonify(message = "No expenses found for this user."), 404

        for expense in expenses:
            expense['_id'] = str(expense['_id']) # Convert to string for JSON serialization
        
        return jsonify(expenses), 200
    
    except Exception as e:
        return jsonify(message = f"Error fetching expenses: {str(e)}"), 500

# GET route to fetch a specific user expense
@app.route('/expenses/<id>', methods = ['GET'])
@jwt_required()
def get_expense(id):
    try:
        if not ObjectId.is_valid(id): # Verify this id is a valid ObjectId
            return jsonify(message = "Invalid expense ID"), 400
        
        user_id = str(get_jwt_identity())
        expense = db.expenses.find_one({ "_id": ObjectId(id), "user_id": user_id }) # Query for specific objectId belonging to this user
        if not expense:
            return jsonify(message = "Access denied or expense not found."), 404
        
        expense['_id'] = str(expense['_id'])
        return jsonify(expense), 200

    except Exception as e:
        return jsonify(message - f"Error fetching expense: {str(e)}"), 500

# PUT route to update a specific expense
@app.route('/expenses/<id>', methods = ['PUT'])
@jwt_required()
def update_expense(id):
    try:
        if not ObjectId.is_valid(id):
            return jsonify(message = "Invalid expense ID"), 400
        
        user_id = str(get_jwt_identity())
        expense = db.expenses.find_one({ "_id": ObjectId(id), "user_id": user_id })
        if not expense:
            return jsonify(message = "Access denied or expense not found."), 404

        data = request.get_json()
        if not data:
            return jsonify(message = "No data provided."), 400
        
        new_amount = data.get('amount')
        if new_amount is None or not isinstance(new_amount, (int, float)) or new_amount <= 0: # Validate amount
            return jsonify(message = "Invalid input: amount must be a positive number."), 400

        db.expenses.update_one(
            { "_id": ObjectId(id) }, 
            { "$set": {"amount": new_amount} }
        )
        return jsonify(message = "Expense updated!", updated_amount = new_amount), 200
    
    except Exception as e:
        return jsonify(message = f"Error updating expense: {str(e)}"), 500
    
# DELETE route to delete a specific expense
@app.route('/expenses/<id>', methods = ['DELETE'])
@jwt_required()
def delete_expenese(id):
    try:
        if not ObjectId.is_valid(id):
            return jsonify(message = "Invalid expense ID"), 400
        
        user_id = str(get_jwt_identity())
        expense = db.expenses.find_one({ "_id": ObjectId(id), "user_id": user_id })
        if not expense:
            return jsonify(message = "Access denied or expense not found."), 404
        
        result = db.expenses.delete_one({ "_id": ObjectId(id) })
        if result.deleted_count == 0:
            return jsonify(message = "Failed to delete expense. Please try again."), 500

        return jsonify(message = "Expense deleted."), 200
    
    except Exception as e:
        return jsonify(message = f"Error deleting expense: {str(e)}"), 500

##########################################################################################################################################

@app.route('/') # Testing connection is working
def home():
    return {"message": "We're live!"}

# DELETE route to remove a user -- Postman purposes
@app.route('/users/<email>', methods = ['DELETE'])
def delete_user(email):

    try:
        user = db.users.find_one({ 'email': email })

        if not user: # User not found
            return jsonify(message = f"Email {email} not found."), 404

        db.users.delete_one({ 'email': email }) # Delete user by email
        return jsonify(message = f"Deleted {email} from users."), 200
    
    except Exception as e:
        return jsonify(message = f"Error: {str(e)}"), 500

# GET route to view all users -- Postman purposes
@app.route('/users', methods = ['GET'])
def get_users():
    
    users = db.users.find()
    output = []
    for user in users:
        output.append({
            'user_id': str(user['_id']),
            'email': user['email'],
            'created_at': user['created_at']
        })
    
    return jsonify(output)

if __name__ == "__main__":
    app.run(debug = True)