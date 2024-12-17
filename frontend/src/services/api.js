import axios from 'axios';

const API = axios.create({
    baseURL: 'http://127.0.0.1:5000', // Point to Flask backend
});

/* API Endpoints to Handle Authentication */
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

/* API Endpoints to Handle Expenses */
export const fetchExpenses = () => API.get('/expenses');
export const uploadExpense = (data) => API.post('/expenses', data);
export const fetchExpenseDetails = () => API.get(`/expenses/${id}`);
export const updateExpense = (data) => API.put(`/expenses/${id}`, data);
export const deleteExpense = () => API.delete(`/expenses/${id}`);

/* API Endpoints to Handle Budgets */
export const update_or_create_Budget = (data) => API.post('/budget', data);
export const fetchBudget = () => API.get('/budget');