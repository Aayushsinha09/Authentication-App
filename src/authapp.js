import React, { useState, useEffect, useCallback, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './authapp.css'; // Ensure this matches your CSS filename

const TODOS_STORAGE_KEY = 'react_todos_single_app';
const TODO_FILTER_STORAGE_KEY = 'react_todo_filter_single_app';

const AuthApp = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [credentials, setCredentials] = useState({ name: "", email: "", password: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const [activeFeature, setActiveFeature] = useState("dashboard");
  const [message, setMessage] = useState(null);
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [todoFilter, setTodoFilter] = useState('all');
  const [todoSearchTerm, setTodoSearchTerm] = useState('');

  useEffect(() => {
    const authStatus = localStorage.getItem("auth") === "true";
    let storedUserString = localStorage.getItem("user"); // Use let
    const storedTheme = localStorage.getItem("theme") || 'light';
    const storedTodos = localStorage.getItem(TODOS_STORAGE_KEY);
    const storedTodoFilter = localStorage.getItem(TODO_FILTER_STORAGE_KEY) || 'all';

    setTheme(storedTheme);
    document.body.className = storedTheme === 'dark' ? 'bg-dark text-light' : '';
    setTodoFilter(storedTodoFilter);

    if (storedTodos) {
        try { setTodos(JSON.parse(storedTodos)); }
        catch (error) { console.error("Error parsing todos:", error); setTodos([]); }
    }

    if (authStatus && storedUserString) {
      try {
        let storedUser = JSON.parse(storedUserString); // Use let
        if (storedUser && storedUser.email) {
          // Check and default signupDate if missing using Indian format
          if (!storedUser.signupDate) {
            console.log("AuthApp: Adding default signupDate for existing user (IN format).");
            storedUser.signupDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); // Updated format
            localStorage.setItem("user", JSON.stringify(storedUser));
          }

          setIsAuthenticated(true);
          setCurrentUser(storedUser);
          setEditedName(storedUser.name || '');
        } else {
           localStorage.removeItem("auth");
           localStorage.removeItem("user");
        }
      } catch (error) {
        console.error("Failed to parse user data:", error);
         localStorage.removeItem("auth");
         localStorage.removeItem("user");
      }
    }
  }, []);

  useEffect(() => {
     if (todos.length > 0 || localStorage.getItem(TODOS_STORAGE_KEY)) {
       localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
     }
  }, [todos]);

  useEffect(() => {
    localStorage.setItem(TODO_FILTER_STORAGE_KEY, todoFilter);
  }, [todoFilter]);

  useEffect(() => {
    if (message?.text) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleInputChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });
  const handleTodoInputChange = (e) => setNewTodoText(e.target.value);

  const handleThemeChange = useCallback((newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme === 'dark' ? 'bg-dark text-light' : '';
    toast.info(`Theme changed to ${newTheme}`, { theme: newTheme });
  }, []);

  const handleAuth = () => {
     setMessage(null);
    setIsLoading(true);
    setTimeout(() => {
      try {
        if (isSignup) {
          if (!credentials.name.trim() || !credentials.email.trim() || !credentials.password.trim()) throw new Error("Please fill in all fields.");
          if (!/\S+@\S+\.\S+/.test(credentials.email)) throw new Error("Please enter a valid email address.");
          if (credentials.password.length < 8) throw new Error("Password must be at least 8 characters long.");
          const existingUser = localStorage.getItem("user");
          if (existingUser && JSON.parse(existingUser).email === credentials.email) throw new Error("Email already registered. Please login.");

          // Create signupDate using Indian format
          const newUser = {
              name: credentials.name,
              email: credentials.email,
              password: credentials.password,
              signupDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }) // Updated format
            };
          localStorage.setItem("user", JSON.stringify(newUser));
          toast.success("Signup successful! Please log in.");
          setIsSignup(false);
          setCredentials({ name: "", email: "", password: "" });
          setShowPassword(false);
        } else {
          if (!credentials.email.trim() || !credentials.password.trim()) throw new Error("Please enter both email and password.");
          const storedUserString = localStorage.getItem("user");
          let storedUser = storedUserString ? JSON.parse(storedUserString) : null;

          // Check and default signupDate on login using Indian format
          if (storedUser && !storedUser.signupDate) {
             storedUser.signupDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }); // Updated format
             localStorage.setItem("user", JSON.stringify(storedUser));
          }

          if (storedUser && storedUser.email === credentials.email && storedUser.password === credentials.password) {
            localStorage.setItem("auth", "true");
            localStorage.setItem("lastLogin", new Date().toLocaleString()); // Consider localizing this too if needed
            setIsAuthenticated(true);
            setCurrentUser(storedUser);
            setEditedName(storedUser.name || '');
            setActiveFeature('dashboard');
            setCredentials({ name: "", email: "", password: "" });
            setShowPassword(false);
            toast.success(`Welcome , ${storedUser.name}!`);
          } else {
            throw new Error("Invalid email or password.");
          }
        }
      } catch (error) {
        setMessage({ type: "danger", text: error.message });
      } finally {
        setIsLoading(false);
      }
    }, 1000);
  };

  const handleLogout = useCallback(() => {
      localStorage.removeItem("auth");
      localStorage.removeItem("lastLogin");
      setIsAuthenticated(false);
      setCurrentUser(null);
      setActiveFeature("dashboard");
      setCredentials({ name: "", email: "", password: "" });
      setMessage(null);
      setIsLoading(false);
      setShowPassword(false);
      setIsEditingProfile(false);
      setShowLogoutModal(false);
      toast.info("You have been logged out.");
  }, []);

  const handleUpdateUser = useCallback(() => {
      if (!editedName.trim()) {
          toast.error('Name cannot be empty.');
          return;
      }
      setIsProfileLoading(true);
      setTimeout(() => {
            try {
                if (!currentUser) throw new Error("User not found.");
                const updatedUser = { ...currentUser, name: editedName };
                setCurrentUser(updatedUser);
                localStorage.setItem("user", JSON.stringify(updatedUser));
                setIsEditingProfile(false);
                toast.success('Profile updated successfully!');
            } catch(error) {
                console.error("Profile update error:", error);
                toast.error('Failed to update profile.');
            } finally {
                setIsProfileLoading(false);
            }
      }, 500);
  }, [currentUser, editedName]);

   const handleCancelEditProfile = () => {
        setIsEditingProfile(false);
        setEditedName(currentUser?.name || '');
   };

  const addTodo = (e) => {
    e.preventDefault();
    const text = newTodoText.trim();
    if (text) {
        setTodos(prev => [...prev, { id: Date.now(), text, completed: false }]);
        setNewTodoText('');
        toast.success(`Task added!`);
    } else {
        toast.warn('Please enter a task description.');
    }
  };

  const toggleTodoComplete = (id) => {
    let taskText = '';
    let isCompleted = false;
    setTodos(prev =>
      prev.map((todo) => {
        if (todo.id === id) {
            taskText = todo.text;
            isCompleted = !todo.completed;
            return { ...todo, completed: isCompleted };
        }
        return todo;
      })
    );
     toast.info(`Task "${taskText.substring(0,20)}..." marked ${isCompleted ? 'complete' : 'active'}.`);
  };

  const deleteTodo = (id) => {
     let deletedText = '';
     setTodos(prev => prev.filter((todo) => {
          if(todo.id === id) deletedText = todo.text;
          return todo.id !== id;
      }));
     if(deletedText) toast.error(`Task "${deletedText.substring(0, 20)}..." deleted.`);
  };

  const filteredTodos = useMemo(() => {
    let items = todos;
    if (todoFilter === 'active') items = items.filter(t => !t.completed);
    else if (todoFilter === 'completed') items = items.filter(t => t.completed);
    const searchTerm = todoSearchTerm.toLowerCase().trim();
    if (searchTerm) { items = items.filter(t => t.text.toLowerCase().includes(searchTerm)); }
    return items;
  }, [todos, todoFilter, todoSearchTerm]);

  const activeTodoCount = useMemo(() => todos.filter(t => !t.completed).length, [todos]);

  const containerClass = `container my-5 ${theme === 'dark' ? 'text-light' : ''}`;
  const cardClass = `card p-4 mx-auto ${theme === 'dark' ? 'bg-secondary border-light' : ''} shadow`;
  const featurePanelClass = `p-4 border rounded ${theme === 'dark' ? 'bg-dark border-secondary' : 'bg-light'} shadow-sm`;
  const formControlClass = `form-control app-transition ${theme === 'dark' ? 'bg-dark text-light border-secondary placeholder-light' : ''}`;
  const btnClass = `btn app-transition ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`;
  const btnPrimaryClass = `btn btn-primary app-transition`;
  const btnOutlineClass = `btn btn-outline-secondary app-transition`;
  const inputGroupClass = `input-group mb-3 ${theme === 'dark' ? 'input-group-dark' : ''}`;
  const todoListGroupItemClass = `list-group-item d-flex justify-content-between align-items-center app-transition ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`;
  const profileInputClass = `form-control d-inline-block w-auto ms-2 app-transition ${theme === 'dark' ? 'bg-secondary text-light border-secondary' : ''}`;
  const modalContentClass = `modal-content ${theme === 'dark' ? 'bg-dark text-light' : ''}`;
  const navLinkClass = (isActive) => `nav-link d-flex align-items-center gap-2 app-transition ${isActive ? 'active' : ''} ${theme === 'dark' && !isActive ? 'text-light' : ''}`;

  const renderDashboard = () => (
    <div>
      <div className="d-flex align-items-center mb-4"> <i className={`bi bi-speedometer2 fs-2 me-3 text-primary ${theme === 'dark' ? 'text-info': ''}`}></i> <div> <h4>Dashboard</h4> <p className="text-muted mb-0">Overview of your application activity.</p> </div> </div> <hr className={theme === 'dark' ? 'border-secondary' : ''}/>
       <div className={`p-3 mb-4 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}> <p className="fs-5">Welcome 
        
        
    , {currentUser?.name || 'User'}!</p> <p className="text-muted small mb-0">Last login: {localStorage.getItem("lastLogin") || "N/A"}</p> </div>
      <h5>Quick Stats</h5>
       <div className="row g-3"> <div className="col-md-4"> <div className={`card ${theme === 'dark' ? 'bg-dark border-secondary' : 'border-primary'} text-center h-100 shadow-sm app-transition`}> <div className="card-body"> <i className="bi bi-list-check fs-3 text-primary mb-2"></i> <h6 className="card-title">Active Tasks</h6> <p className="fs-4 fw-bold mb-0">{activeTodoCount}</p> </div> </div> </div> <div className="col-md-4"> <div className={`card ${theme === 'dark' ? 'bg-dark border-secondary' : 'border-info'} text-center h-100 shadow-sm app-transition`}> <div className="card-body"> {theme === 'dark' ? <i className="bi bi-moon-stars-fill fs-3 text-info mb-2"></i> : <i className="bi bi-brightness-high-fill fs-3 text-info mb-2"></i> } <h6 className="card-title">Current Theme</h6> <p className="fs-4 fw-bold mb-0">{theme.charAt(0).toUpperCase() + theme.slice(1)}</p> </div> </div> </div> <div className="col-md-4"> <div className={`card ${theme === 'dark' ? 'bg-dark border-secondary' : 'border-success'} text-center h-100 shadow-sm app-transition`}> <div className="card-body"> <i className="bi bi-calendar-check fs-3 text-success mb-2"></i> <h6 className="card-title">Joined On</h6> <p className="fs-5 mb-0">{currentUser?.signupDate || 'N/A'}</p> </div> </div> </div> </div>
    </div>
  );

  const renderProfile = () => (
    <div>
        <div className="d-flex align-items-center mb-4"> <i className={`bi bi-person-circle fs-2 me-3 text-primary ${theme === 'dark' ? 'text-info': ''}`}></i> <div> <h4>Profile</h4> <p className="text-muted mb-0">View and manage your personal information.</p> </div> </div> <hr className={theme === 'dark' ? 'border-secondary' : ''}/>
         <div className={`p-3 mb-4 rounded ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}>
             <dl className="row mb-0"> <dt className="col-sm-3">Email:</dt> <dd className="col-sm-9">{currentUser?.email || 'N/A'}</dd> <dt className="col-sm-3">Signed Up:</dt> <dd className="col-sm-9">{currentUser?.signupDate || 'N/A'}</dd> <dt className="col-sm-3">Name:</dt> <dd className="col-sm-9">{isEditingProfile ? (<input type="text" className={profileInputClass} value={editedName} onChange={(e) => setEditedName(e.target.value)} disabled={isProfileLoading} />) : (<span>{currentUser?.name || 'N/A'}</span>)}</dd> </dl>
        </div>
        <div className="mt-3"> {isEditingProfile ? ( <div className="d-flex gap-2"> <button className={`btn btn-success ${btnPrimaryClass}`} onClick={handleUpdateUser} disabled={isProfileLoading}> {isProfileLoading ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-check-lg me-1"></i> Save</>} </button> <button className={`btn btn-secondary ${btnClass.replace('btn-outline-secondary', 'btn-secondary')}`} onClick={handleCancelEditProfile} disabled={isProfileLoading}> <i className="bi bi-x-lg me-1"></i> Cancel </button> </div> ) : ( <button className={btnPrimaryClass} onClick={() => setIsEditingProfile(true)} disabled={isProfileLoading || !currentUser}> <i className="bi bi-pencil-square me-1"></i> Edit Name </button> )} </div>
    </div>
  );

   const renderTodos = () => (
     <div>
         <div className="d-flex align-items-center mb-4"> <i className={`bi bi-check2-square fs-2 me-3 text-primary ${theme === 'dark' ? 'text-info': ''}`}></i> <div> <h4>My To-Do List</h4> <p className="text-muted mb-0">Manage your tasks.</p> </div> </div> <hr className={theme === 'dark' ? 'border-secondary' : ''}/>
        <form onSubmit={addTodo} className="d-flex gap-2 mb-4"> <input type="text" className={formControlClass} value={newTodoText} onChange={handleTodoInputChange} placeholder="What needs to be done?"/> <button type="submit" className={btnPrimaryClass}><i className="bi bi-plus-lg me-1"></i> Add</button> </form>
         <div className="input-group mb-3"> <span className={`input-group-text ${theme === 'dark' ? 'bg-dark text-light border-secondary': ''}`}><i className="bi bi-search"></i></span> <input type="text" className={formControlClass} placeholder="Search tasks..." value={todoSearchTerm} onChange={(e) => setTodoSearchTerm(e.target.value)} /> </div>
        <div className="d-flex justify-content-between align-items-center mb-3 gap-3 flex-wrap"> <span className="text-muted small">{activeTodoCount} item{activeTodoCount !== 1 ? 's' : ''} left</span> <div className="btn-group btn-group-sm" role="group" aria-label="Todo Filters"> <button onClick={() => setTodoFilter('all')} type="button" className={`btn ${todoFilter === 'all' ? 'btn-primary active' : btnClass}`}>All</button> <button onClick={() => setTodoFilter('active')} type="button" className={`btn ${todoFilter === 'active' ? 'btn-primary active' : btnClass}`}>Active</button> <button onClick={() => setTodoFilter('completed')} type="button" className={`btn ${todoFilter === 'completed' ? 'btn-primary active' : btnClass}`}>Completed</button> </div> </div>
        <ul className="list-group todo-list"> {filteredTodos.length > 0 ? ( filteredTodos.map((todo) => ( <li key={todo.id} className={`${todoListGroupItemClass} ${todo.completed ? 'todo-completed' : ''}`}> <div className="form-check flex-grow-1 me-3 d-flex align-items-center gap-2"> <input className="form-check-input flex-shrink-0" type="checkbox" checked={todo.completed} onChange={() => toggleTodoComplete(todo.id)} id={`todo-${todo.id}`}/> <label className="form-check-label" htmlFor={`todo-${todo.id}`}> {todo.text} </label> </div> <button onClick={() => deleteTodo(todo.id)} className="btn btn-sm btn-outline-danger app-transition delete-todo-btn" aria-label={`Delete task ${todo.text}`}> <i className="bi bi-trash"></i> </button> </li> )) ) : ( <li className={`${todoListGroupItemClass} justify-content-center todo-empty-message`}> <i className="bi bi-clipboard-x me-2"></i> {todoSearchTerm ? 'No tasks match your search.' : (todoFilter === 'completed' ? 'No completed tasks yet!' : 'All tasks done, or add a new one!')} </li> )} </ul>
    </div>
  );

  const renderSettings = () => (
    <div>
        <div className="d-flex align-items-center mb-4"> <i className={`bi bi-gear-fill fs-2 me-3 text-primary ${theme === 'dark' ? 'text-info': ''}`}></i> <div> <h4>Settings</h4> <p className="text-muted mb-0">Configure application preferences.</p> </div> </div> <hr className={theme === 'dark' ? 'border-secondary' : ''}/>
       <div className={`card ${theme === 'dark' ? 'bg-dark border-secondary' : ''}`}> <div className="card-body"> <h5 className="card-title mb-3">Preferences</h5> <div className="form-check form-switch mb-3"> <input className="form-check-input" type="checkbox" role="switch" id="themeSwitch" checked={theme === 'dark'} onChange={() => handleThemeChange(theme === 'light' ? 'dark' : 'light')} /> <label className="form-check-label" htmlFor="themeSwitch"> Enable Dark Mode </label> </div> <div className="mb-3"> <label htmlFor="languageSelect" className="form-label">Language (Mock)</label> <select className={`form-select ${formControlClass.replace('form-control', '')}`} id="languageSelect" disabled> <option>English (US)</option> <option>Español (Mock)</option> <option>Français (Mock)</option> </select> <div className="form-text">Language selection is currently disabled.</div> </div> <hr className={theme === 'dark' ? 'border-secondary' : ''}/> <h5 className="card-title mb-3 mt-4">Notifications (Mock)</h5> <div className="form-check form-switch mb-3"> <input className="form-check-input" type="checkbox" role="switch" id="emailNotifications" defaultChecked disabled/> <label className="form-check-label" htmlFor="emailNotifications"> Enable Email Notifications </label> </div> <div className="form-check form-switch mb-3"> <input className="form-check-input" type="checkbox" role="switch" id="pushNotifications" disabled/> <label className="form-check-label" htmlFor="pushNotifications"> Enable Push Notifications </label> </div> <div className="form-text">Notification settings require backend integration.</div> </div> </div>
    </div>
  );

  return (
    <div className={containerClass}>
         <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme={theme} />

      {!isAuthenticated ? (
          <div className={cardClass} style={{ maxWidth: '450px' }}>
           <div className="text-center mb-4"><h2 className="mt-2 fw-bold">{isSignup ? "Create Account" : "Login"}</h2><p className={`text-muted small ${theme === 'dark' ? 'text-light-emphasis' : ''}`}>{isSignup ? 'Fill in the details to register.' : 'Welcome ! Please login.'}</p></div>
            {message && (<div className={`alert alert-${message.type} d-flex align-items-center alert-dismissible fade show mb-4`} role="alert"><i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2`}></i><div>{message.text}</div><button type="button" className="btn-close" onClick={() => setMessage(null)} aria-label="Close"></button></div>)}
            {isSignup && ( <div className="mb-3"> <label htmlFor="nameInput" className="form-label">Name</label> <input id="nameInput" type="text" name="name" placeholder="Your Name" className={formControlClass} value={credentials.name} onChange={handleInputChange} required disabled={isLoading} /> </div> )}
            <div className="mb-3"> <label htmlFor="emailInput" className="form-label">Email Address</label> <input id="emailInput" type="email" name="email" placeholder="email@example.com" className={formControlClass} value={credentials.email} onChange={handleInputChange} required disabled={isLoading} /> </div>
            <div className={inputGroupClass}> <input id="passwordInput" type={showPassword ? "text" : "password"} name="password" placeholder="Password" className={formControlClass} value={credentials.password} onChange={handleInputChange} required disabled={isLoading} /> <button className={btnOutlineClass} type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading} aria-label={showPassword ? "Hide password" : "Show password"}> <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i> </button> </div>
            {isSignup && <div className="form-text mb-3">Password must be at least 8 characters long.</div>}
             <button className={`btn btn-primary w-100 py-2 mb-4 ${btnPrimaryClass} login-signup-button`} onClick={handleAuth} disabled={isLoading}> {isLoading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing...</> : (isSignup ? "Create Account" : "Login")} </button>
            <p className="text-center mb-0 small"> {isSignup ? "Already have an account?" : "Don't have an account?"}{" "} <button className="btn btn-link p-0 align-baseline fw-bold" onClick={() => { if (!isLoading) { setIsSignup(!isSignup); setMessage(null); setCredentials({ name: "", email: "", password: "" }); setShowPassword(false); }}} disabled={isLoading}> {isSignup ? "Login here" : "Signup now"} </button> </p>
          </div>
      ) : (
        <div className="app-authenticated-view">
            <header className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom gap-2"> <h3 className="mb-0 text-primary"><i className="bi bi-shield-check me-2"></i>Strata Panel</h3> <div className="d-flex align-items-center gap-2"> <span className="text-muted d-none d-sm-inline">Hello, {currentUser?.name || 'User'}!</span> <button className="btn btn-sm btn-outline-danger app-transition" onClick={() => setShowLogoutModal(true)}> <i className="bi bi-box-arrow-right me-1"></i> Logout </button> </div> </header>
             <ul className="nav nav-pills flex-column flex-md-row nav-fill mb-4 gap-2"> {[ { key: 'dashboard', label: 'Dashboard', icon: 'bi-speedometer2' }, { key: 'profile', label: 'Profile', icon: 'bi-person-circle' }, { key: 'todos', label: 'To-Do List', icon: 'bi-check2-square' }, { key: 'settings', label: 'Settings', icon: 'bi-gear-fill' } ].map(item => ( <li className="nav-item" key={item.key}> <button className={navLinkClass(activeFeature === item.key)} onClick={() => setActiveFeature(item.key)}> <i className={`bi ${item.icon}`}></i> <span>{item.label}</span> </button> </li> ))} </ul>
            <main className={featurePanelClass}>
                {activeFeature === 'dashboard' && renderDashboard()}
                {activeFeature === 'profile' && renderProfile()}
                {activeFeature === 'todos' && renderTodos()}
                {activeFeature === 'settings' && renderSettings()}
            </main>
            <footer className="mt-5 py-3 text-center text-muted small border-top"> Strata Panel &copy; {new Date().getFullYear()} </footer>
            {showLogoutModal && ( <> <div className="modal-backdrop fade show" onClick={() => setShowLogoutModal(false)}></div> <div className="modal fade show" tabIndex="-1" style={{ display: 'block' }} aria-labelledby="logoutModalLabel" aria-modal="true" role="dialog"> <div className="modal-dialog modal-dialog-centered"> <div className={modalContentClass}> <div className="modal-header"> <h5 className="modal-title" id="logoutModalLabel">Confirm Logout</h5> <button type="button" className={`btn-close ${theme === 'dark' ? 'btn-close-white': ''}`} aria-label="Close" onClick={() => setShowLogoutModal(false)}></button> </div> <div className="modal-body"> Are you sure you want to log out? </div> <div className="modal-footer"> <button type="button" className="btn btn-secondary app-transition" onClick={() => setShowLogoutModal(false)}>Cancel</button> <button type="button" className="btn btn-danger app-transition" onClick={handleLogout}>Logout</button> </div> </div> </div> </div> </> )}
        </div>
      )}
    </div>
  );
};

export default AuthApp;
