import axios from 'axios';

const API = axios.create({
    baseURL: 'http://127.0.0.1:5000', // Point to Flask backend
});

API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token'); // Get token from local storage
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req
})

/* API Endpoints to Handle Authentication */
export const register = (data) => API.post('/auth/register', data);
export const login = (data) => API.post('/auth/login', data);

/* API Endpoints to Handle Expenses */
export const fetchExpenses = () => API.get('/expenses');
export const uploadExpense = (data) => API.post('/expenses', data);
export const fetchExpenseDetails = (id) => API.get(`/expenses/${id}`);
export const updateExpense = (id, data) =>
    API.put(`/expenses/${id}`, JSON.stringify(data), {
        headers: {
            "Content-Type": "application/json",
        },
    });
export const deleteExpense = (id) => API.delete(`/expenses/${id}`);

/* API Endpoints to Handle Budgets */
export const update_or_create_Budget = (data) => API.post('/budget', data);
export const fetchBudget = () => API.get('/budget');