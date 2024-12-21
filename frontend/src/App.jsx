import './App.css'
import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { login, fetchExpenses, uploadExpense, updateExpense, deleteExpense,
   update_or_create_Budget, fetchBudget 
  } from './services/api';
import Analytics from './analytics';

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
  const [budgetMessage, setBudgetMessage] = useState('');
  const [expenseMessage, setExpenseMessage] = useState('');
  const [budgetError, setBudgetError] = useState('');
  const [expenseError, setExpenseError] = useState('');
  const [error, setError] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
        handleFetchExpenses()
        handleFetchBudget()
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
    try {
      const response = await uploadExpense(newExpense);
      setExpenseError('')
      setExpenseMessage('Expense added successfully!');
      setNewExpense({ amount: '', category: '', description: ''}); // Reset form
      handleFetchExpenses()
      handleFetchBudget()
      setRefreshTrigger((prev) => prev + 1);
      console.log(response.data);
    } catch (err) {
      setExpenseError('Error adding expense.');
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
        setRefreshTrigger((prev) => prev + 1);
        setExpenseError(''); // Clear any previous errors
    } catch (err) {
        setExpenseError("Error updating expense.");
        console.error(err);
    }
  };

  // Handle expense deletion
  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id); // Call deleteExpense API
      setExpenses((prev) => prev.filter((expense) => expense._id !== id)); // Update the state
      setExpenseError('')
      setExpenseMessage("Expense deleted successfully!");
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
      setExpenseError("Error deleting expense. Please try again.");
    }
  };

  // Handle fetching the budget
  const handleFetchBudget = async () => {
    try {
      const response = await fetchBudget();
      setCurrentBudget(response.data); // Set the fetched budget
    } catch (err) {
      setBudgetError("Set a budget.")
      console.error(err)
    }
  };

  // Handle upserting the budget
  const handleUpsertBudget = async () => {
    try {
      await update_or_create_Budget({ amount: parseFloat(budgetAmount) });
      setBudgetError("")
      setBudgetMessage("Budget updated successfully!");
      setBudgetAmount(""); // Reset the input field
      handleFetchBudget(); // Refresh the displayed budget
    } catch (err) {
      setBudgetError("Error updating/creating budget. Please try again.");
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
    <>
      <div className="d-flex flex-column justify-content-center align-items-center" style={{width: "100vw", height: "1vh", paddingTop: "5rem"}}>
        <h1 className='text-center mb-4'>Expense Tracker</h1>
      </div>
      
        {/* Login Form */}
        <div style={{ padding: "2rem" }}>
        <div className='container mt-4'>
        {!token ? (
            <form onSubmit={handleLogin} className='w-50 mx-auto'>
                <div className='mb-3'>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className='md-3'>
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
                <h3 className='text-center'>Welcome! You are logged in.</h3>
                

                {/* Display Current Budget */}
                {currentBudget && (
                  <div className="container mt-5">
                    <div className="row">
                      {/* Current Budget and Update Section */}
                      <div className="col-md-6 mx-auto">
                        <div className="card p-4" style={{ backgroundColor: "#6bffb5", minHeight: "450px", maxHeight: "450px" }}>
                          <h2 className="text-center">Current Budget</h2>
                          <p>
                            <strong>Amount:</strong> ${currentBudget.amount}
                          </p>
                          <p>
                            <strong>Spent:</strong> ${currentBudget.current_spent}
                          </p>
                          <p
                            style={{
                              color:
                                currentBudget.amount - currentBudget.current_spent < 0
                                  ? "red"
                                  : "inherit",
                            }}
                          >
                            <strong>Remaining:</strong> $
                            {currentBudget.amount - currentBudget.current_spent}
                          </p>
                          <p>
                            <strong>Created At:</strong>{" "}
                            {formatDate(currentBudget.created_at)}
                          </p>
                          <p>
                            <strong>Updated At:</strong>{" "}
                            {formatDate(currentBudget.updated_at)}
                          </p>

                          {/* Add Budget Upsert Section Below */}
                          <h2 className="text-center mt-4">Set Your Budget</h2>
                          <div className="input-group my-3">
                            <input
                              type="number"
                              placeholder="Enter budget amount"
                              value={budgetAmount}
                              onChange={(e) => setBudgetAmount(e.target.value)}
                              className="form-control"
                            />
                            <button
                              onClick={handleUpsertBudget}
                              className="btn btn-success"
                            >
                              Save Budget
                            </button>
                          </div>
                          {budgetMessage && (
                            <p className="text-success text-center" style={{ color: "black" }}>
                              {budgetMessage}
                            </p>
                          )}
                          {budgetError && <p className="text-danger text-center">{budgetError}</p>}
                        </div>
                      </div>

                      {/* Analytics */}
                      <div className="col-md-6">
                        <div className="card p-4" style={{ backgroundColor: "#fff2e6", minHeight: "450px", maxHeight: "450px" }}>
                          <h2 className="text-center">Categorical Spending</h2>
                          <Analytics refreshTrigger={refreshTrigger} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </>
        )}

        {/* Display Errors */}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {/* Display Expenses */}
        
        <div className='container mt-5 text-center'>
        {expenses.length > 0 && (
          <div className="card">
            <h2 className="text-center">Your Expenses:</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense._id}>
                    <td>{expense.category}</td>
                    <td>${expense.amount}</td>
                    <td>{expense.description}</td>
                    <td>
                      <button
                        className="btn btn-edit"
                        onClick={() => handleEditClick(expense)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-delete"
                        onClick={() => handleDeleteExpense(expense._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                        style={{ backgroundColor: "lightskyblue", color: "black", marginRight: "0.2rem" }}
                    />
                    <input
                        type="text"
                        name="category"
                        placeholder="Category"
                        value={newExpense.category}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "lightskyblue", color: "black", marginRight: "0.2rem" }}
                    />
                    <input
                        type="text"
                        name="description"
                        placeholder="Description"
                        value={newExpense.description}
                        onChange={handleInputChange}
                        style={{ backgroundColor: "lightskyblue", color: "black", marginRight: "1rem" }}
                    />
                    <button
                      style={{ backgroundColor: "deepskyblue", color: "black", border: "none", padding: "0.5rem", cursor: "pointer" }}
                      onClick={handleAddExpense}
                    >
                      Add Expense
                    </button>
                </div>
                {expenseMessage && (
                  <p className="text-success text-center" style={{ color: "black" }}>
                    {expenseMessage}
                  </p>
                )}
                {expenseError && <p className="text-danger text-center">{expenseError}</p>}
            </div>
        )}
        </div>
        </div>
        </div>
    </>
  );
}

export default App
