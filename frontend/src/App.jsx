import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { login, fetchExpenses, uploadExpense, updateExpense, deleteExpense, update_or_create_Budget, fetchBudget } from './services/api';

function App() {

  /*  ====================== 
       State Initialization             
      ====================== */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    description: '',
  });
  const [editExpenseId, setEditExpenseId] = useState(null); // Track which expense to edit
  const [editData, setEditData] = useState({
    amount: '',
    category: '',
    description: '',
  });
  const [budgetAmount, setBudgetAmount] = useState(''); // Input value for budget
  const [currentBudget, setCurrentBudget] = useState(null); // Budget fetch
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  /*  ====================== 
       Function Definitions             
      ====================== */

  // Handle user login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); // Clear any previous errors
    try {
        const response = await login({ email, password });
        const userToken = response.data.token; // Extract the JWT token
        setToken(userToken);
        localStorage.setItem('token', userToken); // Save token to localStorage
        alert('Login successful!'); // Confirm login
    } catch (err) {
        setError('Login failed: Invalid credentials or server error.');
        console.error(err);
    }
  };

  // Fetch expenses with the token
  const handleFetchExpenses = async () => {
    try {
        const response = await fetchExpenses(); // Automatically uses the baseURL
        setExpenses(response.data); // Set the fetched expenses
    } catch (err) {
        setError('Add an expense or please check your token.');
        console.error(err);
    }
  };

  // Handle input changes for a new expense
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewExpense({ ...newExpense, [name]: value });
  }

  // Submit a new expense
  const handleAddExpense = async () => {
    setMessage('');
    try {
      const response = await uploadExpense(newExpense);
      setMessage('Expense added successfully!');
      setNewExpense({ amount: '', category: '', description: ''}); // Reset form
      console.log(response.data);
    } catch (err) {
      setMessage('Error adding expense.');
      console.error(err)
    }
  }

  // Handle Edit Button Click
  const handleEditClick = (expense) => {
    setEditExpenseId(expense._id);
    setEditData({
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
    });
  };

  // Update expense
  const handleUpdateExpense = async () => {
    try {
        const payload = { amount: Number(editData.amount) }
        console.log("Payload Data:" , payload);
        await updateExpense(editExpenseId, editData);
        setExpenses((prev) =>
            prev.map((expense) =>
                expense._id === editExpenseId ? { ...expense, ...payload } : expense
            )
        );
        setEditExpenseId(null); // Exit edit mode
        setError(""); // Clear any previous errors
    } catch (err) {
        setError("Error updating expense.");
        console.error(err);
    }
  };

  // Handle Edit Form Input Change
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  // Handle expense deletion
  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id); // Call deleteExpense API
      setExpenses((prev) => prev.filter((expense) => expense._id !== id)); // Update the state
      setMessage("Expense deleted successfully!");
      setError(""); // Clear any errors
    } catch (err) {
      console.error(err);
      setError("Error deleting expense. Please try again.");
      setMessage("");
    }
  };

  // Handle fetching the budget
  const handleFetchBudget = async () => {
    try {
      const response = await fetchBudget();
      setCurrentBudget(response.data); // Set the fetched budget
      setMessage("Budget Fetched successfully")
    } catch (err) {
      setMessage("Error fetching budget. Budghet might not exist.")
      console.error(err)
    }
  };

  // Handle upserting the budget
  const handleUpsertBudget = async () => {
    try {
      await update_or_create_Budget({ amount: parseFloat(budgetAmount) });
      setMessage("Budget updated successfully!");
      setBudgetAmount(""); // Reset the input field
      handleFetchBudget(); // Refresh the displayed budget
    } catch (err) {
      seetMessage("Error updating/creating budget. Please try again.");
      console.log(err)
    }
  };

  // Format date for budget updates
  const formatDate = (isoDate) => {
    return new Date(isoDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div style={{ padding: '2rem' }}>
        <h1>Expense Tracker</h1>

        {/* Login Form */}
        {!token ? (
            <form onSubmit={handleLogin}>
                <div>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button
                  style={{ backgroundColor: "deepskyblue", color: "black", border: "none", padding: "0.5rem", cursor: "pointer" }}
                  type="submit"
                >
                  Login
                </button>
            </form>
        ) : (
            <>
                <h3>Welcome! You are logged in.</h3>
                {/* Fetch Budget Section */}
                <button onClick={handleFetchBudget} style={{ backgroundColor: "limegreen", marginBottom: "1rem" }}>
                  Fetch Budget
                </button>

                {/* Display Current Budget */}
                {currentBudget && (
                  <div>
                    <h2>Current Budget:</h2>
                    <p>
                      <strong>Amount:</strong> ${currentBudget.amount}
                    </p>
                    <p>
                      <strong>Created At:</strong> {formatDate(currentBudget.created_at)}
                    </p>
                    <p>
                      <strong>Updated At:</strong> {formatDate(currentBudget.updated_at)}
                    </p>
                  </div>
                )}

                {/* Upsert Budget Section */}
                <h2>Set Your Budget</h2>
                <div>
                  <input
                    type="number"
                    placeholder="Enter budget amount"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    style={{ backgroundColor: "lightgreen", marginRight: "1rem" }}
                  />
                  <button onClick={handleUpsertBudget} style={{ backgroundColor: "limegreen" }}>
                    Save Budget
                  </button>
                </div>

                {/* Success/Error Message */}
                {message && <p style={{ color: "green", marginTop: "1rem" }}>{message}</p>}
                <button
                  style={{ backgroundColor: "deepskyblue", color: "black", padding: "0.5rem", cursor: "pointer" }}
                  onClick={handleFetchExpenses}
                >
                  Fetch Expenses
                </button>
            </>
        )}

        {/* Display Errors */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Display Expenses */}
        {expenses.length > 0 && (
            <div>
                <h2>Your Expenses:</h2>
                <ul>
                    {expenses.map((expense) => (
                        <li key={expense._id}>
                            {editExpenseId === expense._id ? (
                                // Edit Form
                                <>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={editData.amount}
                                        onChange={handleEditChange}
                                        placeholder="Amount"
                                    />
                                    <input
                                        type="text"
                                        name="category"
                                        value={editData.category}
                                        disabled
                                        placeholder="Category"
                                    />
                                    <input
                                        type="text"
                                        name="description"
                                        value={editData.description}
                                        disabled
                                        placeholder="Description"
                                    />
                                    <button onClick={handleUpdateExpense}>Save</button>
                                    <button onClick={() => setEditExpenseId(null)}>Cancel</button>
                                </>
                            ) : (
                                // Display Expense Details
                                <>
                                    <strong>Category:</strong> {expense.category},{" "}
                                    <strong>Amount:</strong> ${expense.amount},{" "}
                                    <strong>Description:</strong> {expense.description}{" "}
                                    <button 
                                      style={{ backgroundColor: "gainsboro", color: "black", border: "none", padding: "0.5rem", cursor: "pointer", marginLeft: "1rem" }}
                                      onClick={() => handleEditClick(expense)}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      style={{ backgroundColor: "red", color: "white", border: "none", padding: "0.5rem", cursor: "pointer", marginLeft: "1rem" }}
                                      onClick={() => handleDeleteExpense(expense._id)}
                                    >
                                      Delete
                                    </button>
                                    
                                </>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
          )}


        {/* Add Expense Form */}
        {token && (
            <div style={{ marginTop: '2rem' }}>
                <h2>Add a New Expense</h2>
                <div>
                    <input
                        type="number"
                        name="amount"
                        placeholder="Amount"
                        value={newExpense.amount}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "lightskyblue", marginRight: "0.2rem" }}
                    />
                    <input
                        type="text"
                        name="category"
                        placeholder="Category"
                        value={newExpense.category}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "lightskyblue", marginRight: "0.2rem" }}
                    />
                    <input
                        type="text"
                        name="description"
                        placeholder="Description"
                        value={newExpense.description}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "lightskyblue", marginRight: "1rem" }}
                    />
                    <button
                      style={{ backgroundColor: "deepskyblue", color: "black", border: "none", padding: "0.5rem", cursor: "pointer" }}
                      onClick={handleAddExpense}
                    >
                      Add Expense
                    </button>
                </div>
                {message && <p>{message}</p>}
            </div>
        )}
    </div>
  );
}

export default App
