import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { login, fetchExpenses, uploadExpense } from './services/api';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    category: '',
    description: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
        setError('Error fetching expenses. Please check your token.');
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

  return (
    <div style={{ padding: '2rem' }}>
        <h1>Expense Tracker - Login First</h1>

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
                <button type="submit">Login</button>
            </form>
        ) : (
            <>
                <h3>Welcome! You are logged in.</h3>
                <button onClick={handleFetchExpenses}>Fetch Expenses</button>
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
                            <strong>Category:</strong> {expense.category}, 
                            <strong> Amount:</strong> ${expense.amount}, 
                            <strong> Description:</strong> {expense.description}
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
                    />
                    <input
                        type="text"
                        name="category"
                        placeholder="Category"
                        value={newExpense.category}
                        onChange={handleInputChange}
                    />
                    <input
                        type="text"
                        name="description"
                        placeholder="Description"
                        value={newExpense.description}
                        onChange={handleInputChange}
                    />
                    <button onClick={handleAddExpense}>Add Expense</button>
                </div>
                {message && <p>{message}</p>}
            </div>
        )}
    </div>
  );
}

export default App
