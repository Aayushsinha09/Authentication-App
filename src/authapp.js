import React, { useState, useEffect, useCallback, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
// MODIFIED: Import Bounce for ToastContainer
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './authapp.css'; // Ensure this matches your CSS filename

const TODOS_STORAGE_KEY = 'react_todos_single_app';
const TODO_FILTER_STORAGE_KEY = 'react_todo_filter_single_app';

// NEW: Skeleton Placeholder Component
const SkeletonPlaceholder = ({ width = '100%', height = '1rem', className = '', type = 'text' }) => {
    const baseClass = `skeleton-placeholder ${className}`;
    if (type === 'avatar') {
        return <div className={`${baseClass} skeleton-avatar`} style={{ width, height }}></div>;
    }
    if (type === 'title') {
        return <div className={`${baseClass} skeleton-title`} style={{ width, height }}></div>;
    }
    return <div className={baseClass} style={{ width, height }}></div>;
};


const AuthApp = () => {
  const [appLoading, setAppLoading] = useState(true); // NEW: App-level initial loading
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [credentials, setCredentials] = useState({ name: "", email: "", password: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const [activeFeature, setActiveFeature] = useState("dashboard");
  const [message, setMessage] = useState(null);
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(false); // For auth actions
  const [showPassword, setShowPassword] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isProfileLoading, setIsProfileLoading] = useState(false); // For profile updates
  const [todos, setTodos] = useState([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [todoFilter, setTodoFilter] = useState('all');
  const [todoSearchTerm, setTodoSearchTerm] = useState('');
  const [featureVisible, setFeatureVisible] = useState(true);
  const [simulatedDataLoading, setSimulatedDataLoading] = useState(true); // NEW: For dashboard/profile content

  useEffect(() => {
    setAppLoading(true);
    setSimulatedDataLoading(true);
    const storedTheme = localStorage.getItem("theme") || 'light';
    setTheme(storedTheme); // Set theme first for initial render
    document.body.className = storedTheme === 'dark' ? 'bg-dark text-light' : '';

    const storedTodos = localStorage.getItem(TODOS_STORAGE_KEY);
    const storedTodoFilter = localStorage.getItem(TODO_FILTER_STORAGE_KEY) || 'all';
    setTodoFilter(storedTodoFilter);

    if (storedTodos) {
        try { setTodos(JSON.parse(storedTodos)); }
        catch (error) { console.error("Error parsing todos:", error); setTodos([]); }
    }

    const authStatus = localStorage.getItem("auth") === "true";
    let storedUserString = localStorage.getItem("user");

    setTimeout(() => { // Simulate initial app setup delay
        if (authStatus && storedUserString) {
          try {
            let storedUser = JSON.parse(storedUserString);
            if (storedUser && storedUser.email) {
              if (!storedUser.signupDate) {
                storedUser.signupDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
                localStorage.setItem("user", JSON.stringify(storedUser));
              }
              setIsAuthenticated(true);
              setCurrentUser(storedUser);
              setEditedName(storedUser.name || '');
            } else {
               localStorage.removeItem("auth"); localStorage.removeItem("user");
            }
          } catch (error) {
            console.error("Failed to parse user data:", error);
            localStorage.removeItem("auth"); localStorage.removeItem("user");
          }
        }
        setAppLoading(false);
        // Simulate data loading for dashboard/profile after auth check
        setTimeout(() => setSimulatedDataLoading(false), 700);
    }, 1200); // Increased initial app loading simulation

  }, []);


  useEffect(() => {
     if (!appLoading && (todos.length > 0 || localStorage.getItem(TODOS_STORAGE_KEY))) { // only save if not app loading
       localStorage.setItem(TODOS_STORAGE_KEY, JSON.stringify(todos));
     }
  }, [todos, appLoading]);

  useEffect(() => {
    localStorage.setItem(TODO_FILTER_STORAGE_KEY, todoFilter);
  }, [todoFilter]);

  useEffect(() => {
    if (message?.text) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  useEffect(() => {
    if (!appLoading) { // Only trigger feature visibility if app is not loading
        setFeatureVisible(false);
        const timer = setTimeout(() => {
            setFeatureVisible(true);
            setSimulatedDataLoading(true); // Reset simulated loading for new panel
            setTimeout(() => setSimulatedDataLoading(false), 500); // Simulate loading for the new panel
        }, 50);
        return () => clearTimeout(timer);
    }
  }, [activeFeature, appLoading]);


  const handleInputChange = (e) => setCredentials({ ...credentials, [e.target.name]: e.target.value });
  const handleTodoInputChange = (e) => setNewTodoText(e.target.value);

  const handleThemeChange = useCallback((newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.body.className = newTheme === 'dark' ? 'bg-dark text-light' : '';
    toast.info(`Theme switched to ${newTheme} mode!`, { theme: newTheme });
  }, []);

  const handleAuth = () => {
    setMessage(null);
    setIsLoading(true);
    setSimulatedDataLoading(true); // For dashboard after login
    setTimeout(() => {
      try {
        if (isSignup) {
          if (!credentials.name.trim() || !credentials.email.trim() || !credentials.password.trim()) throw new Error("All fields are mandatory for signup.");
          if (!/\S+@\S+\.\S+/.test(credentials.email)) throw new Error("Invalid email format.");
          if (credentials.password.length < 8) throw new Error("Password needs to be 8+ characters.");
          const existingUser = localStorage.getItem("user");
          if (existingUser && JSON.parse(existingUser).email === credentials.email) throw new Error("This email is already registered. Please login.");

          const newUser = {
              name: credentials.name, email: credentials.email, password: credentials.password,
              signupDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
            };
          localStorage.setItem("user", JSON.stringify(newUser));
          toast.success("Signup successful! You can now log in.");
          setIsSignup(false);
          setCredentials({ name: "", email: "", password: "" });
          setShowPassword(false);
        } else {
          if (!credentials.email.trim() || !credentials.password.trim()) throw new Error("Email and password are required.");
          const storedUserString = localStorage.getItem("user");
          let storedUser = storedUserString ? JSON.parse(storedUserString) : null;

          if (storedUser && !storedUser.signupDate) {
             storedUser.signupDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
             localStorage.setItem("user", JSON.stringify(storedUser));
          }

          if (storedUser && storedUser.email === credentials.email && storedUser.password === credentials.password) {
            localStorage.setItem("auth", "true");
            localStorage.setItem("lastLogin", new Date().toLocaleString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }));
            setIsAuthenticated(true);
            setCurrentUser(storedUser);
            setEditedName(storedUser.name || '');
            setActiveFeature('dashboard');
            setCredentials({ name: "", email: "", password: "" });
            setShowPassword(false);
            toast.success(`Welcome back, ${storedUser.name}!`);
            setTimeout(() => setSimulatedDataLoading(false), 500); // Finish simulated loading for dashboard
          } else {
            throw new Error("Login failed: Invalid email or password.");
          }
        }
      } catch (error) {
        setMessage({ type: "danger", text: error.message });
        setSimulatedDataLoading(false); // Stop loading on error
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
      setActiveFeature("dashboard"); // Or redirect to login view logic
      setCredentials({ name: "", email: "", password: "" });
      setMessage(null); setIsLoading(false); setShowPassword(false); setIsEditingProfile(false);
      setShowLogoutModal(false);
      setAppLoading(true); // Simulate going back to initial load screen briefly
      setTimeout(() => setAppLoading(false), 300);
      toast.info("You've been successfully logged out.");
  }, []);

  const handleUpdateUser = useCallback(() => {
      if (!editedName.trim()) { toast.error('Name cannot be empty.'); return; }
      setIsProfileLoading(true);
      setTimeout(() => {
          try {
              if (!currentUser) throw new Error("User not found.");
              const updatedUser = { ...currentUser, name: editedName };
              setCurrentUser(updatedUser);
              localStorage.setItem("user", JSON.stringify(updatedUser));
              setIsEditingProfile(false);
              toast.success('Profile updated!');
          } catch(error) {
              toast.error('Profile update failed.');
          } finally {
              setIsProfileLoading(false);
          }
      }, 700);
  }, [currentUser, editedName]);

  const handleCancelEditProfile = () => { setIsEditingProfile(false); setEditedName(currentUser?.name || ''); };

  const addTodo = useCallback((e) => {
    e.preventDefault();
    const text = newTodoText.trim();
    if (text) {
        setTodos(prev => [{ id: Date.now(), text, completed: false, createdAt: new Date().toISOString(), important: false }, ...prev]);
        setNewTodoText('');
        toast.success(`Task "${text.substring(0,15)}..." added!`);
    } else {
        toast.warn('Task description cannot be empty.');
    }
  }, [newTodoText]);

  const toggleTodoImportant = useCallback((id) => {
    let taskText = '';
    let isImportant = false;
    setTodos(prev => prev.map(todo => {
        if (todo.id === id) {
            taskText = todo.text;
            isImportant = !todo.important;
            return { ...todo, important: isImportant };
        }
        return todo;
    }));
    toast.info(`Task "${taskText.substring(0,15)}..." marked as ${isImportant ? 'important' : 'not important'}.`);
  }, []);


  const toggleTodoComplete = useCallback((id) => {
    let taskText = '';
    let isCompleted = false;
    setTodos(prev =>
      prev.map((todo) => {
        if (todo.id === id) {
            taskText = todo.text; isCompleted = !todo.completed;
            return { ...todo, completed: isCompleted };
        }
        return todo;
      })
    );
    toast.info(`Task "${taskText.substring(0,20)}..." ${isCompleted ? 'completed!' : 'marked active.'}`);
  }, []);

  const deleteTodo = useCallback((id) => {
     let deletedText = '';
     setTodos(prev => prev.map(t => t.id === id ? { ...t, deleting: true } : t));
     setTimeout(() => {
        setTodos(prev => prev.filter((todo) => {
            if(todo.id === id) deletedText = todo.text;
            return todo.id !== id;
        }));
        if(deletedText) toast.error(`Task "${deletedText.substring(0, 20)}..." deleted.`);
     }, 300);
  }, []);

  const filteredTodos = useMemo(() => {
    let items = [...todos].sort((a, b) => (b.important === a.important ? 0 : b.important ? 1 : -1) || new Date(b.createdAt) - new Date(a.createdAt));
    if (todoFilter === 'active') items = items.filter(t => !t.completed);
    else if (todoFilter === 'completed') items = items.filter(t => t.completed);
    const searchTerm = todoSearchTerm.toLowerCase().trim();
    if (searchTerm) { items = items.filter(t => t.text.toLowerCase().includes(searchTerm)); }
    return items.filter(t => !t.deleting);
  }, [todos, todoFilter, todoSearchTerm]);

  const activeTodoCount = useMemo(() => todos.filter(t => !t.completed && !t.deleting).length, [todos]);
  const completedTodoCount = useMemo(() => todos.filter(t => t.completed && !t.deleting).length, [todos]);
  const totalTodoCount = useMemo(() => todos.filter(t => !t.deleting).length, [todos]);
  const todoProgress = totalTodoCount > 0 ? Math.round((completedTodoCount / totalTodoCount) * 100) : 0;


  const containerClass = `app-container my-0 py-md-4 ${theme === 'dark' ? 'text-light' : ''}`;
  const cardClass = `card p-4 mx-auto shadow-lg animated-card ${theme === 'dark' ? 'bg-secondary border-light' : ''}`;
  const featurePanelClass = `p-lg-4 p-3 border rounded shadow-sm content-fade-enter ${theme === 'dark' ? 'bg-dark border-secondary' : 'bg-light-custom'}`;
  const formControlClass = `form-control app-form-control ${theme === 'dark' ? 'bg-dark text-light border-secondary placeholder-light' : ''}`;
  const btnClass = `btn app-btn ${theme === 'dark' ? 'btn-outline-light' : 'btn-outline-secondary'}`;
  const btnPrimaryClass = `btn btn-primary app-btn-primary`;
  const inputGroupClass = `input-group mb-3 app-input-group ${theme === 'dark' ? 'input-group-dark' : ''}`;
  const todoListGroupItemClass = `list-group-item d-flex justify-content-between align-items-center todo-item ${theme === 'dark' ? 'bg-dark text-light border-secondary' : ''}`;
  const profileInputClass = `form-control d-inline-block w-auto ms-2 app-form-control ${theme === 'dark' ? 'bg-secondary text-light border-secondary' : ''}`;
  const modalContentClass = `modal-content shadow-lg ${theme === 'dark' ? 'bg-dark text-light' : ''}`;
  const navLinkClass = (isActive) => `nav-link d-flex align-items-center gap-2 app-nav-link ${isActive ? 'active shadow-sm' : ''} ${theme === 'dark' && !isActive ? 'text-light-emphasis' : ''}`;


  const renderDashboard = () => (
    <div>
      <div className="d-flex align-items-center mb-4"> <i className={`bi bi-grid-1x2-fill fs-2 me-3 text-primary ${theme === 'dark' ? 'text-info': ''}`}></i> <div> <h4>Dashboard</h4> <p className="text-muted mb-0">Your application command center.</p> </div> </div> <hr className={`app-hr ${theme === 'dark' ? 'border-secondary' : ''}`}/>
      <div className={`p-3 mb-4 rounded ${theme === 'dark' ? 'bg-darker' : 'bg-light-gray'} welcome-banner`}>
        {simulatedDataLoading ? <SkeletonPlaceholder height="2rem" width="60%" className="mb-2" /> : <p className="fs-4 mb-1 dynamic-welcome">Welcome back, <strong className="text-primary">{currentUser?.name || 'User'}</strong>!</p>}
        {simulatedDataLoading ? <SkeletonPlaceholder height="1rem" width="40%" /> : <p className="text-muted small mb-0">Last login: {localStorage.getItem("lastLogin") || "N/A"}</p>}
      </div>
      <h5>Quick Stats</h5>
        <div className="row g-3">
            {[
                { title: 'Active Tasks', value: activeTodoCount, icon: 'bi-list-task', color: 'primary' },
                { title: 'Current Theme', value: theme.charAt(0).toUpperCase() + theme.slice(1), icon: theme === 'dark' ? 'bi-moon-stars-fill' : 'bi-sun-fill', color: 'info' },
                { title: 'Joined On', value: currentUser?.signupDate || 'N/A', icon: 'bi-calendar-event-fill', color: 'success' }
            ].map(stat => (
                <div className="col-md-4" key={stat.title}>
                    <div className={`card app-dashboard-card ${theme === 'dark' ? 'bg-dark border-secondary' : `border-${stat.color}`} text-center h-100 shadow-sm`}>
                        <div className="card-body">
                            {simulatedDataLoading ? (
                                <>
                                    <SkeletonPlaceholder type="avatar" width="40px" height="40px" className="mb-2 mx-auto" />
                                    <SkeletonPlaceholder height="1.25rem" width="70%" className="mb-2 mx-auto" />
                                    <SkeletonPlaceholder height="1.5rem" width="30%" className="mx-auto" />
                                </>
                            ) : (
                                <>
                                    <i className={`bi ${stat.icon} fs-2 text-${stat.color} mb-2`}></i>
                                    <h6 className="card-title mb-1">{stat.title}</h6>
                                    <p className={`fs-4 fw-bold mb-0 ${stat.title === 'Joined On' ? 'fs-5' : ''}`}>{stat.value}</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderProfile = () => (
    <div>
      <div className="d-flex align-items-center mb-4"> <i className={`bi bi-person-vcard-fill fs-2 me-3 text-primary ${theme === 'dark' ? 'text-info': ''}`}></i> <div> <h4>My Profile</h4> <p className="text-muted mb-0">Manage your account details.</p> </div> </div> <hr className={`app-hr ${theme === 'dark' ? 'border-secondary' : ''}`}/>
      <div className={`text-center mb-4 p-3 rounded ${theme === 'dark' ? 'bg-darker' : 'bg-light-gray'}`}>
        {simulatedDataLoading ? (
            <>
                <SkeletonPlaceholder type="avatar" width="100px" height="100px" className="mb-2 mx-auto" />
                <SkeletonPlaceholder height="1.5rem" width="40%" className="mb-1 mx-auto" />
                <SkeletonPlaceholder height="1rem" width="50%" className="mx-auto" />
            </>
        ) : (
            <>
                <div className={`avatar-placeholder rounded-circle d-inline-flex justify-content-center align-items-center mb-2 shadow-sm ${theme === 'dark' ? 'bg-secondary' : 'bg-light'}`}>
                    <i className={`bi bi-person-fill fs-1 ${theme === 'dark' ? 'text-light-emphasis' : 'text-secondary'}`}></i>
                </div>
                <h5 className="mt-2 mb-0">{currentUser?.name || 'User Name'}</h5>
                <p className="text-muted small">{currentUser?.email}</p>
            </>
        )}
      </div>

      <div className={`p-3 mb-4 rounded app-card ${theme === 'dark' ? 'bg-darker' : 'bg-light-gray'}`}>
          <h5 className="mb-3">Account Information</h5>
          <dl className="row mb-0">
            <dt className="col-sm-3">Full Name:</dt>
            <dd className="col-sm-9 mb-3">
                {isEditingProfile ? (<input type="text" className={profileInputClass} value={editedName} onChange={(e) => setEditedName(e.target.value)} disabled={isProfileLoading || simulatedDataLoading} />)
                : (simulatedDataLoading ? <SkeletonPlaceholder width="60%" /> : <span>{currentUser?.name || 'N/A'}</span>) }
            </dd>
            <dt className="col-sm-3">Email:</dt>
            <dd className="col-sm-9 mb-3">{simulatedDataLoading ? <SkeletonPlaceholder width="70%" /> : (currentUser?.email || 'N/A')}</dd>
            <dt className="col-sm-3">Signed Up:</dt>
            <dd className="col-sm-9 mb-0">{simulatedDataLoading ? <SkeletonPlaceholder width="30%" /> : (currentUser?.signupDate || 'N/A')}</dd>
          </dl>
      </div>
      <div className="mt-3"> {isEditingProfile ? ( <div className="d-flex gap-2"> <button className={`btn btn-success ${btnPrimaryClass.replace('btn-primary', 'btn-success')}`} onClick={handleUpdateUser} disabled={isProfileLoading || simulatedDataLoading}> {isProfileLoading ? <><span className="spinner-border spinner-border-sm me-1"></span> Saving...</> : <><i className="bi bi-check-circle-fill me-1"></i> Save Changes</>} </button> <button className={`btn btn-secondary ${btnClass.replace('btn-outline-secondary', 'btn-secondary')}`} onClick={handleCancelEditProfile} disabled={isProfileLoading || simulatedDataLoading}> <i className="bi bi-x-circle-fill me-1"></i> Cancel </button> </div> ) : ( <button className={btnPrimaryClass} onClick={() => setIsEditingProfile(true)} disabled={isProfileLoading || simulatedDataLoading || !currentUser}> <i className="bi bi-pencil-fill me-1"></i> Edit Name </button> )} </div>
    </div>
  );

   const renderTodos = () => (
     <div>
         <div className="d-flex align-items-center mb-4"> <i className={`bi bi-check-circle-fill fs-2 me-3 text-primary ${theme === 'dark' ? 'text-info': ''}`}></i> <div> <h4>Task Manager</h4> <p className="text-muted mb-0">Your daily tasks, organized.</p> </div> </div> <hr className={`app-hr ${theme === 'dark' ? 'border-secondary' : ''}`}/>
        {/* MODIFIED: className to use template literal correctly */}
        <form onSubmit={addTodo} className={`d-flex gap-2 mb-3 shadow-sm rounded p-3 ${theme === 'dark' ? 'bg-darker' : 'bg-light-gray'}`}>
            <input type="text" className={`${formControlClass} flex-grow-1`} value={newTodoText} onChange={handleTodoInputChange} placeholder="Add a new task (e.g., Finish report)"/>
            <button type="submit" className={`${btnPrimaryClass} app-btn-primary-hover-darken`}><i className="bi bi-plus-circle-fill me-1"></i> Add Task</button>
        </form>

        {totalTodoCount > 0 && (
            <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="small text-muted">Overall Progress ({completedTodoCount}/{totalTodoCount})</span>
                    <span className="small fw-bold text-primary">{todoProgress}%</span>
                </div>
                <div className="progress" style={{height: '10px'}}>
                    <div className={`progress-bar ${theme === 'dark' ? 'bg-info' : 'bg-primary'} progress-bar-striped progress-bar-animated`} role="progressbar" style={{width: `${todoProgress}%`}} aria-valuenow={todoProgress} aria-valuemin="0" aria-valuemax="100"></div>
                </div>
            </div>
        )}

        <div className={`d-flex flex-column flex-md-row justify-content-between align-items-center mb-3 gap-3 p-3 rounded shadow-sm ${theme === 'dark' ? 'bg-darker' : 'bg-light-gray'}`}>
            <div className="input-group flex-grow-1" style={{maxWidth: '400px'}}>
                <span className={`input-group-text ${theme === 'dark' ? 'bg-dark text-light border-secondary': ''}`}><i className="bi bi-search"></i></span>
                <input type="text" className={formControlClass} placeholder="Search tasks..." value={todoSearchTerm} onChange={(e) => setTodoSearchTerm(e.target.value)} />
                {todoSearchTerm && (<button className={`btn ${btnClass} btn-sm position-absolute end-0 top-50 translate-middle-y me-1 clear-search-btn`} onClick={() => setTodoSearchTerm('')} aria-label="Clear search"><i className="bi bi-x-lg"></i></button>)}
            </div>
            <div className="btn-group btn-group-sm todo-filter-buttons" role="group" aria-label="Todo Filters">
                {['all', 'active', 'completed'].map(filter => (
                    <button key={filter} onClick={() => setTodoFilter(filter)} type="button" className={`btn ${todoFilter === filter ? (theme === 'dark' ? 'btn-info' : 'btn-primary') + ' active' : btnClass}`}>
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                    </button>
                ))}
            </div>
        </div>
        <ul className="list-group todo-list shadow-sm">
            {filteredTodos.length > 0 ? (
                filteredTodos.map((todo) => (
                    <li key={todo.id} className={`${todoListGroupItemClass} ${todo.completed ? 'todo-completed' : ''} ${todo.deleting ? 'todo-deleting' : ''} ${todo.important && !todo.completed ? 'todo-important' : ''}`}>
                        <div className="form-check flex-grow-1 me-2 d-flex align-items-center gap-2">
                            <input className="form-check-input flex-shrink-0 mt-0 todo-checkbox" type="checkbox" checked={todo.completed} onChange={() => toggleTodoComplete(todo.id)} id={`todo-${todo.id}`}/>
                            <label className="form-check-label todo-text-label" htmlFor={`todo-${todo.id}`}>
                                {todo.text}
                            </label>
                        </div>
                        <div className="todo-actions">
                            <button onClick={() => toggleTodoImportant(todo.id)} className={`btn btn-sm ${todo.important && !todo.completed ? 'text-warning' : 'text-muted'} me-1 todo-action-btn`} aria-label={todo.important ? "Mark as not important" : "Mark as important"}>
                                <i className={`bi ${todo.important && !todo.completed ? 'bi-star-fill' : 'bi-star'}`}></i>
                            </button>
                            <button onClick={() => deleteTodo(todo.id)} className="btn btn-sm text-danger todo-action-btn" aria-label={`Delete task ${todo.text}`}>
                                <i className="bi bi-trash3-fill"></i>
                            </button>
                        </div>
                    </li>
                ))
            ) : (
                <li className={`${todoListGroupItemClass} justify-content-center text-center flex-column todo-empty-message`}>
                    <i className={`bi ${todoSearchTerm ? 'bi-emoji-frown' : (todoFilter === 'completed' ? 'bi-emoji-sunglasses' : 'bi-emoji-smile')} fs-1 mb-2 text-muted`}></i>
                    <p className="mb-2">
                    {todoSearchTerm ? 'No tasks found for your search.' :
                     (todoFilter === 'completed' ? 'Awesome! No completed tasks here... yet!' :
                      (todoFilter === 'active' ? 'Woohoo! All tasks done!' :
                       'Your task list is empty. Time to get productive!'))}
                    </p>
                    {!todoSearchTerm && todoFilter !== 'completed' && (
                        <button className={`btn btn-sm ${theme === 'dark' ? 'btn-outline-info' : 'btn-outline-primary'}`} onClick={() => {
                            const inputElement = document.querySelector('input[placeholder^="Add a new task"]');
                            if (inputElement) inputElement.focus();
                         }}>
                            <i className="bi bi-plus-circle-dotted me-1"></i> Add Your First Task
                        </button>
                    )}
                </li>
            )}
        </ul>
        {totalTodoCount > 0 && <div className="text-center mt-3 text-muted small">You have {activeTodoCount} active task{activeTodoCount !== 1 ? 's' : ''}. Keep going!</div>}
    </div>
  );

  const renderSettings = () => (
    <div>
        <div className="d-flex align-items-center mb-4"> <i className={`bi bi-palette-fill fs-2 me-3 text-primary ${theme === 'dark' ? 'text-info': ''}`}></i> <div> <h4>Personalization</h4> <p className="text-muted mb-0">Customize your app experience.</p> </div> </div> <hr className={`app-hr ${theme === 'dark' ? 'border-secondary' : ''}`}/>
       <div className={`card app-card ${theme === 'dark' ? 'bg-darker border-secondary' : 'bg-light-gray'}`}>
          <div className="card-body">
            <h5 className="card-title mb-3">Appearance Settings</h5>
            {/* MODIFIED: className to use template literal correctly */}
            <div className={`d-flex justify-content-between align-items-center p-3 rounded mb-3 ${theme === 'dark' ? 'bg-dark' : 'bg-light'} shadow-sm`}>
                <label htmlFor="themeSwitch" className="form-check-label mb-0">
                    <i className={`bi ${theme === 'dark' ? 'bi-moon-stars-fill text-info' : 'bi-sun-fill text-warning'} me-2`}></i>
                    {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </label>
                <div className="form-check form-switch custom-theme-switch">
                    <input className="form-check-input" type="checkbox" role="switch" id="themeSwitch" checked={theme === 'dark'} onChange={() => handleThemeChange(theme === 'light' ? 'dark' : 'light')} />
                </div>
            </div>

            <div className="mb-3">
              <label htmlFor="languageSelect" className="form-label">Language (Demo)</label>
              <select className={`form-select ${formControlClass.replace('form-control', '')}`} id="languageSelect" disabled>
                <option>English (US)</option><option>Español (Demo)</option><option>Français (Demo)</option>
              </select>
              <div className="form-text text-muted small">Language selection is a visual demonstration and not functional.</div>
            </div>
            <hr className={`app-hr ${theme === 'dark' ? 'border-secondary' : ''}`}/>
            <h5 className="card-title mb-3 mt-4">Notification Preferences (Demo)</h5>
            {['Enable Email Notifications', 'Enable Push Notifications', 'Weekly Summary Email'].map((label, idx) => (
                <div className="form-check form-switch mb-3" key={idx}>
                    <input className="form-check-input" type="checkbox" role="switch" id={`notifSwitch-${idx}`} defaultChecked={idx === 0} disabled/>
                    <label className="form-check-label" htmlFor={`notifSwitch-${idx}`}> {label} </label>
                </div>
            ))}
            <div className="form-text text-muted small">Notification settings are for demonstration and require backend services.</div>
          </div>
        </div>
    </div>
  );

  if (appLoading) {
    return (
        <div className="vh-100 d-flex flex-column justify-content-center align-items-center app-initial-loading">
            <div className="spinner-grow text-primary mb-3" style={{width: '3rem', height: '3rem'}} role="status">
                <span className="visually-hidden">Loading application...</span>
            </div>
            <h4 className={`${theme === 'dark' ? 'text-light' : 'text-dark'}`}>Strata Panel Loading...</h4>
            <p className="text-muted small">Initializing your experience.</p>
        </div>
    );
  }

  return (
    <div className={containerClass}>
        {/* MODIFIED: ToastContainer transition prop corrected */}
        <ToastContainer position="bottom-right" autoClose={3500} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme={theme} transition={Bounce} />

      {!isAuthenticated ? (
          <div className="auth-container d-flex align-items-center justify-content-center min-vh-100 py-4">
            <div className={cardClass} style={{ maxWidth: '480px' }}>
            <div className="text-center mb-4"><h1 className="mt-2 fw-bolder app-title-animate text-primary">{isSignup ? "Join Strata Panel" : "Sign In"}</h1><p className={`text-muted ${theme === 'dark' ? 'text-light-emphasis' : ''}`}>{isSignup ? 'Create your account to get started.' : 'Access your Strata Panel dashboard.'}</p></div>
              {message && (<div className={`alert alert-${message.type} d-flex align-items-center alert-dismissible fade show mb-4 shadow-sm`} role="alert"><i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'} me-2 fs-5`}></i><div>{message.text}</div><button type="button" className="btn-close" onClick={() => setMessage(null)} aria-label="Close"></button></div>)}
              {isSignup && ( <div className="mb-3"> <label htmlFor="nameInput" className="form-label fw-medium">Full Name</label> <input id="nameInput" type="text" name="name" placeholder="e.g., Alex Porter" className={formControlClass} value={credentials.name} onChange={handleInputChange} required disabled={isLoading} /> </div> )}
              <div className="mb-3"> <label htmlFor="emailInput" className="form-label fw-medium">Email Address</label> <input id="emailInput" type="email" name="email" placeholder="you@example.com" className={formControlClass} value={credentials.email} onChange={handleInputChange} required disabled={isLoading} /> </div>
              <div className={inputGroupClass}>
                  <input id="passwordInput" type={showPassword ? "text" : "password"} name="password" placeholder="Your Secure Password" className={formControlClass} value={credentials.password} onChange={handleInputChange} required disabled={isLoading} />
                  <button className={`${btnClass} app-btn-hover-effect`} type="button" onClick={() => setShowPassword(!showPassword)} disabled={isLoading} aria-label={showPassword ? "Hide password" : "Show password"}> <i className={`bi ${showPassword ? 'bi-eye-slash-fill' : 'bi-eye-fill'}`}></i> </button>
              </div>
              {isSignup && <div className="form-text mb-3 text-muted small">Password must be at least 8 characters long.</div>}
              <button className={`btn w-100 py-2 fs-5 mb-4 ${btnPrimaryClass} login-signup-button shadow-sm`} onClick={handleAuth} disabled={isLoading}> {isLoading ? <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing...</> : (isSignup ? "Create Account" : "Login to Dashboard")} </button>
              <p className="text-center mb-0 small"> {isSignup ? "Already a member?" : "New to Strata Panel?"}{" "} <button className="btn btn-link p-0 align-baseline fw-bold app-link" onClick={() => { if (!isLoading) { setIsSignup(!isSignup); setMessage(null); setCredentials({ name: "", email: "", password: "" }); setShowPassword(false); }}} disabled={isLoading}> {isSignup ? "Sign In Here" : "Create an Account"} </button> </p>
            </div>
          </div>
      ) : (
        <div className="app-authenticated-view d-flex flex-column min-vh-100">
            <header className={`d-flex flex-wrap justify-content-between align-items-center mb-4 p-3 border-bottom shadow-sm sticky-top ${theme === 'dark' ? 'bg-dark' : 'bg-white'}`}>
                <h3 className="mb-0 text-primary app-title-animate"><i className="bi bi-shield-lock-fill me-2"></i>Strata<span className="fw-light">Panel</span></h3>
                <div className="d-flex align-items-center gap-2">
                    <span className="text-muted d-none d-sm-inline">Hi, <strong className="text-primary">{currentUser?.name || 'User'}</strong>!</span>
                    <button className="btn btn-sm btn-outline-danger app-btn-hover-effect" onClick={() => setShowLogoutModal(true)}> <i className="bi bi-power me-1"></i> Logout </button>
                </div>
            </header>
             <div className="container-fluid flex-grow-1">
                <div className="row">
                    <nav className="col-md-3 col-lg-2 d-md-block sidebar collapse mb-4 mb-md-0">
                        <div className={`position-sticky pt-3 ${theme === 'dark' ? 'bg-dark' : ''}`}>
                            <ul className="nav nav-pills flex-column nav-main-buttons">
                            {[ { key: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2-fill' }, { key: 'profile', label: 'My Profile', icon: 'bi-person-vcard-fill' }, { key: 'todos', label: 'Task Manager', icon: 'bi-check-circle-fill' }, { key: 'settings', label: 'Personalization', icon: 'bi-palette-fill' } ].map(item => (
                                <li className="nav-item mb-1" key={item.key}>
                                <button className={navLinkClass(activeFeature === item.key)} onClick={() => setActiveFeature(item.key)}>
                                    <i className={`bi ${item.icon} me-2 fs-5`}></i>
                                    <span>{item.label}</span>
                                </button>
                                </li>
                            ))}
                            </ul>
                        </div>
                    </nav>
                    <main className={`col-md-9 ms-sm-auto col-lg-10 px-md-4 ${featurePanelClass} ${featureVisible ? 'content-fade-enter-active' : ''}`}>
                        {activeFeature === 'dashboard' && renderDashboard()}
                        {activeFeature === 'profile' && renderProfile()}
                        {activeFeature === 'todos' && renderTodos()}
                        {activeFeature === 'settings' && renderSettings()}
                    </main>
                </div>
            </div>
            <footer className={`mt-auto py-3 text-center text-muted small border-top ${theme === 'dark' ? 'bg-dark' : 'bg-light'}`}> Strata Panel &copy; {new Date().getFullYear()} - Advanced Secure SPA. </footer>
            {showLogoutModal && ( <> <div className="modal-backdrop fade show" onClick={() => setShowLogoutModal(false)}></div> <div className="modal fade show d-block animated-modal" tabIndex="-1" aria-labelledby="logoutModalLabel" aria-modal="true" role="dialog">
                <div className="modal-dialog modal-dialog-centered">
                    <div className={modalContentClass}>
                        <div className="modal-header border-0"> <h5 className="modal-title" id="logoutModalLabel"><i className="bi bi-exclamation-triangle-fill me-2 text-danger"></i>Confirm Logout</h5> <button type="button" className={`btn-close ${theme === 'dark' ? 'btn-close-white': ''}`} aria-label="Close" onClick={() => setShowLogoutModal(false)}></button> </div>
                        <div className="modal-body pt-0"> Are you sure you want to sign out from Strata Panel? </div>
                        <div className="modal-footer border-0"> <button type="button" className="btn btn-secondary app-btn-hover-effect" onClick={() => setShowLogoutModal(false)}>Stay Logged In</button> <button type="button" className="btn btn-danger app-btn-hover-effect" onClick={handleLogout}><i className="bi bi-power me-1"></i>Yes, Logout</button> </div>
                    </div>
                </div>
            </div> </> )}
        </div>
      )}
    </div>
  );
};

export default AuthApp;
